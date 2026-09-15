# 📋 ESPECIFICAÇÃO DE INTEGRAÇÃO: EduCampina ↔ EduConnect
## Módulo: Liberação de Acesso de Estudantes por Turma & SSO

> **Instruções para o chat do EduCampina (`student-evaluation-app`):**
> Cole o conteúdo deste documento no chat do EduCampina para que o agente implemente as funções compatíveis com o EduConnect.

---

### 1. Contexto & Objetivo
No EduCampina, o professor precisa ter autonomia para **liberar o acesso ao EduConnect** para os estudantes de suas turmas. O acesso dos estudantes é controlado e autenticado através da combinação de:
1. **Matrícula do Aluno** (já existente no modelo `Student.registration`).
2. **Código de Acesso da Turma** (código alfanumérico de 6 caracteres gerado pelo professor, ex: `EDU-842` ou `7K9A2M`).

O EduCampina deve fornecer:
1. Interface na página da turma para o professor ativar/desativar o acesso, gerar/renovar o código e visualizar/imprimir a lista com as matrículas dos alunos.
2. Endpoint para o professor salvar/gerar o código da turma.
3. Endpoint de verificação externa para o EduConnect autenticar o aluno (`POST /api/auth/external/student-verify`).
4. Endpoint para o aluno fazer login diretamente no portal com Matrícula + Código e ser redirecionado via SSO para o EduConnect.

---

### 2. Alterações no Banco de Dados (EduCampina Prisma Schema)

No arquivo `backend/prisma/schema.prisma` do EduCampina, adicione os seguintes campos ao model `Class`:

```prisma
model Class {
  // ... campos existentes ...
  
  // Controle de Acesso ao EduConnect
  educonnectEnabled        Boolean   @default(false)
  educonnectCode           String?   // Código alfanumérico (ex: EDU-784)
  educonnectCodeExpiresAt  DateTime? // Validade opcional do código
  educonnectUpdatedAt      DateTime?
  
  // ... relações existentes ...
}
```

Após atualizar o schema, execute no terminal do EduCampina:
```powershell
npx prisma db push
npx prisma generate
```

---

### 3. Backend do EduCampina (`student-evaluation-app/backend`)

#### 3.1. Gerenciamento do Código pelo Professor (`routes/classes.js` ou controller dedicado)

Adicione as rotas para consulta e geração do código da turma:

```javascript
// @route   GET /api/classes/:id/educonnect-access
// @desc    Obter status e código de acesso ao EduConnect para a turma
// @access  Private (Teacher, Manager, Admin)
router.get('/:id/educonnect-access', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        grade: true,
        school: { select: { id: true, name: true, inep: true } },
        educonnectEnabled: true,
        educonnectCode: true,
        educonnectCodeExpiresAt: true,
        students: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            registration: true,
            birthDate: true
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ success: false, message: 'Turma não encontrada' });
    }

    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Erro ao buscar acesso EduConnect da turma:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});

// @route   POST /api/classes/:id/educonnect-access
// @desc    Ativar/desativar e gerar/renovar código de acesso da turma
// @access  Private (Teacher, Manager, Admin)
router.post('/:id/educonnect-access', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, regenerateCode, expiresDays } = req.body;

    const currentClass = await prisma.class.findUnique({ where: { id } });
    if (!currentClass) {
      return res.status(404).json({ success: false, message: 'Turma não encontrada' });
    }

    let code = currentClass.educonnectCode;

    // Gera um novo código se solicitado ou se ainda não possuir
    if (regenerateCode || !code) {
      // Exemplo de código amigável: EDU- + 4 caracteres alfanuméricos únicos (ex: EDU-9F2K)
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      code = `EDU-${randomPart}`;
    }

    let expiresAt = currentClass.educonnectCodeExpiresAt;
    if (expiresDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresDays));
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        educonnectEnabled: enabled !== undefined ? enabled : true,
        educonnectCode: code,
        educonnectCodeExpiresAt: expiresAt,
        educonnectUpdatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        educonnectEnabled: true,
        educonnectCode: true,
        educonnectCodeExpiresAt: true
      }
    });

    res.json({
      success: true,
      message: 'Acesso da turma ao EduConnect atualizado com sucesso',
      data: updatedClass
    });
  } catch (error) {
    console.error('Erro ao atualizar acesso EduConnect da turma:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});
```

---

#### 3.2. Endpoint de Verificação Externa para o EduConnect (`routes/auth.js`)

O EduConnect chamará este endpoint quando o estudante preencher Matrícula e Código da Turma na tela de login do EduConnect:

```javascript
// @route   POST /api/auth/external/student-verify
// @desc    Validação de matrícula e código de acesso da turma pelo EduConnect
// @access  Public com validação de API Key
router.post('/external/student-verify', async (req, res) => {
  try {
    const { registration, accessCode, apiKey } = req.body;

    if (!apiKey || apiKey !== process.env.EDUCONNECT_API_KEY) {
      return res.status(401).json({ success: false, message: 'API Key inválida ou não fornecida' });
    }

    if (!registration || !accessCode) {
      return res.status(400).json({ success: false, message: 'Matrícula e código de acesso são obrigatórios' });
    }

    const formattedCode = accessCode.trim().toUpperCase();
    const formattedReg = registration.trim();

    // 1. Localiza a turma com o código ativo
    const classData = await prisma.class.findFirst({
      where: {
        educonnectCode: formattedCode,
        educonnectEnabled: true,
        isActive: true,
        OR: [
          { educonnectCodeExpiresAt: null },
          { educonnectCodeExpiresAt: { gte: new Date() } }
        ]
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            inep: true,
            address: true,
            neighborhood: true,
            zone: true
          }
        }
      }
    });

    if (!classData) {
      return res.status(401).json({
        success: false,
        message: 'Código de acesso da turma inválido, expirado ou não liberado pelo professor.'
      });
    }

    // 2. Localiza o aluno matriculado nessa turma
    const student = await prisma.student.findFirst({
      where: {
        registration: formattedReg,
        classId: classData.id,
        isActive: true
      }
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Estudante não encontrado ou não matriculado nesta turma.'
      });
    }

    // Retorna os dados normalizados para o EduConnect
    res.json({
      success: true,
      student: {
        registration: student.registration,
        name: student.name,
        email: student.email || `aluno.${student.registration}@educampina.local`,
        role: 'ALUNO',
        school: {
          id: classData.school.id,
          name: classData.school.name,
          inep: classData.school.inep,
          address: classData.school.address,
          zone: classData.school.zone
        },
        class: {
          id: classData.id,
          name: classData.name,
          grade: classData.grade
        }
      }
    });
  } catch (error) {
    console.error('Erro ao verificar estudante para EduConnect:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});
```

---

#### 3.3. Endpoint de SSO Direto para Estudante no EduCampina (`routes/auth.js`)

Caso o estudante acesse através do EduCampina e clique para ir ao EduConnect:

```javascript
// @route   POST /api/auth/student-sso
// @desc    Autenticação do estudante via Matrícula + Código e emissão de token SSO
// @access  Public
router.post('/student-sso', async (req, res) => {
  try {
    const { registration, accessCode } = req.body;

    if (!registration || !accessCode) {
      return res.status(400).json({ success: false, message: 'Matrícula e código são obrigatórios' });
    }

    const formattedCode = accessCode.trim().toUpperCase();
    const formattedReg = registration.trim();

    const classData = await prisma.class.findFirst({
      where: {
        educonnectCode: formattedCode,
        educonnectEnabled: true,
        isActive: true,
        OR: [
          { educonnectCodeExpiresAt: null },
          { educonnectCodeExpiresAt: { gte: new Date() } }
        ]
      },
      include: {
        school: true
      }
    });

    if (!classData) {
      return res.status(401).json({ success: false, message: 'Código de turma inválido ou inativo.' });
    }

    const student = await prisma.student.findFirst({
      where: {
        registration: formattedReg,
        classId: classData.id,
        isActive: true
      }
    });

    if (!student) {
      return res.status(401).json({ success: false, message: 'Matrícula não vinculada a esta turma.' });
    }

    if (!process.env.SOCIAL_SSO_SECRET) {
      return res.status(500).json({ success: false, message: 'SOCIAL_SSO_SECRET não configurado.' });
    }

    // Token SSO com metadados completos de aluno, escola e turma
    const ssoToken = jwt.sign(
      {
        registration: student.registration,
        name: student.name,
        email: student.email || `aluno.${student.registration}@educampina.local`,
        role: 'ALUNO',
        schoolName: classData.school.name,
        schools: [{
          id: classData.school.id,
          name: classData.school.name,
          inep: classData.school.inep,
          address: classData.school.address,
          zone: classData.school.zone
        }],
        classId: classData.id,
        className: classData.name,
        source: 'EDUCAMPINA_STUDENT_CODE',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.SOCIAL_SSO_SECRET,
      { expiresIn: '5m' }
    );

    const baseUrl = (process.env.EDUCONNECT_URL || 'http://localhost:3001').replace(/\/$/, '');
    const redirectUrl = `${baseUrl}/login/external?token=${ssoToken}`;

    res.json({
      success: true,
      token: ssoToken,
      url: redirectUrl
    });
  } catch (error) {
    console.error('Erro no student-sso:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});
```

---

### 4. Frontend do EduCampina (`student-evaluation-app/frontend`)

Na tela de Detalhes da Turma (`ClassDetails.jsx`), adicione a aba/card **"EduConnect - Acesso de Estudantes"**:

1. **Switch de Ativação**: "Liberar Acesso da Turma no EduConnect".
2. **Exibição do Código de Acesso**: Badge com tamanho destacado (ex: `EDU-842`) e botão "Copiar Código".
3. **Botão "Gerar Novo Código"**: Permite ao professor trocar o código a qualquer momento para invalidar o antigo.
4. **Tabela de Alunos da Turma**:
   - Nome do Aluno
   - Matrícula (para repassar ao aluno)
   - Status (Ativo)
   - Botão "Imprimir Fichas Rápidas de Acesso" (gera impressão/PDF compacto com Nome, Matrícula e Código da Turma para distribuição na sala de aula).

---

### 5. Variáveis de Ambiente Necessárias no `.env` do EduCampina Backend

```env
# SSO & Integração com EduConnect
EDUCONNECT_API_KEY="GK8ALtde1m4cnOhjr9ukpNxWTIVS6CRa"
SOCIAL_SSO_SECRET="liowFfyk7rbSnYaEm0hWpAKCIUzVq9TB62e8js51O4LtDHQMZJuGgNxX3RvdcP"
EDUCONNECT_URL="http://localhost:3001"
```
