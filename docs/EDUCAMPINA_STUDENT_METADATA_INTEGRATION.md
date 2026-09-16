# 🎓 Especificação de Metadados Completos do Estudante (EduCampina -> EduConnect)

Este artefato foi elaborado para ser executado diretamente no repositório **EduCampina (`student-evaluation-app`)**, garantindo que o endpoint de validação de estudantes entregue os metadados completos da **Escola** (INEP, nome, endereço, zona, tipo) e da **Turma**, utilizando o mesmo padrão já consagrado no acesso de Professores, Secretários e Gestores Escolares.

---

## 🎯 Objetivo da Integração

Quando um professor, diretor ou secretário acessa o EduConnect via SSO do EduCampina, o EduCampina envia os dados detalhados da sua unidade escolar. Se a escola ainda não existir no EduConnect, ela é provisionada automaticamente com todas as suas informações oficiais (INEP, endereço, zona).

Para estudantes, a autenticação ocorre via **Matrícula + Código de Acesso da Turma**. O endpoint do EduCampina deve carregar a escola do estudante com os mesmos atributos completos, garantindo:
1. **Localização imediata por INEP** no banco do EduConnect, evitando conflitos de nomes aproximados ou duplicidades de e-mails.
2. **Provisionamento automático (JIT)** da Escola se ela ainda não existir no EduConnect.
3. **Vinculação precisa do Estudante** à sua Escola e à sua Turma para fins de controle de feed e moderação de postagens pelos professores.

---

## 📡 Contrato do Endpoint no EduCampina

* **Rota**: `POST /api/auth/external/student-verify`
* **Autenticação**: Header ou Body com `apiKey` correspondente a `PORTAL_API_KEY` (configurada em ambas as aplicações).
* **Payload de Entrada**:
```json
{
  "registration": "202400123",
  "accessCode": "XYZ123",
  "apiKey": "SUA_CHAVE_COMPARTILHADA"
}
```

---

## 📦 Payload de Saída Esperado pelo EduConnect

Assim como no login dos servidores e professores, o retorno deve conter a estrutura enriquecida da escola e da turma:

```json
{
  "success": true,
  "student": {
    "registration": "202400123",
    "name": "Nome Completo do Estudante",
    "email": null,
    "role": "STUDENT",
    "school": {
      "id": "cuid_ou_uuid_da_escola",
      "name": "EMEIF RAIMUNDO ASFORA",
      "inep": "25071157",
      "address": "Rua Exemplo, 123 - Bairro",
      "zone": "Urbana",
      "schoolType": "Municipal"
    },
    "class": {
      "id": "cuid_ou_uuid_da_turma",
      "name": "9º Ano A",
      "grade": "9º Ano"
    }
  }
}
```

> [!NOTE]
> Estudantes **não possuem e-mail obrigatório**. O EduConnect gerencia a unicidade e identidade exclusivamente pelo campo `registration` (Matrícula).

---

## 🛠️ Implementação no EduCampina (`student-evaluation-app`)

No arquivo de rotas de autenticação do backend do EduCampina (ex: `backend/src/routes/auth.js`):

### 1. Validação do Código da Turma e Busca do Aluno
O código de acesso é gerado pelo professor na turma. A rota deve validar:
1. Se a turma possui o código de acesso informado e se está ativo.
2. Se o aluno com a matrícula informada pertence a essa turma ou escola.
3. Fazer o `join` / `include` com a tabela de Escolas para obter os dados institucionais completos.

### 2. Código de Referência para `auth.js`

```javascript
// POST /api/auth/external/student-verify
router.post('/external/student-verify', async (req, res) => {
  try {
    const { registration, accessCode, apiKey } = req.body;

    // 1. Validar Chave de Integração EduConnect
    const expectedApiKey = process.env.PORTAL_API_KEY || process.env.EDUCONNECT_API_KEY;
    if (!apiKey || apiKey !== expectedApiKey) {
      return res.status(401).json({ success: false, message: 'Chave de API inválida' });
    }

    if (!registration || !accessCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Matrícula e código de acesso da turma são obrigatórios' 
      });
    }

    // 2. Buscar a Turma pelo Código de Acesso
    // (Ajustar para o modelo do banco do EduCampina: Prisma, Knex ou Sequelize)
    const classData = await prisma.class.findFirst({
      where: {
        accessCode: String(accessCode).trim().toUpperCase(),
        isActive: true // ou status correspondente
      },
      include: {
        school: true // Garante o carregamento dos dados da unidade escolar
      }
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Código de acesso da turma inválido ou expirado'
      });
    }

    // 3. Buscar o Estudante pela Matrícula
    const student = await prisma.student.findFirst({
      where: {
        matricula: String(registration).trim(),
        classId: classData.id
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudante não localizado ou não matriculado nesta turma'
      });
    }

    // 4. Obter a Escola associada (da turma ou do aluno)
    const school = classData.school;
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Unidade escolar vinculada à turma não encontrada'
      });
    }

    // 5. Montar o retorno padronizado compatível com o EduConnect
    return res.json({
      success: true,
      student: {
        registration: String(student.matricula).trim(),
        name: student.nome || student.name,
        email: student.email || null,
        role: 'STUDENT',
        school: {
          id: String(school.id),
          name: school.nome || school.name,
          inep: school.inep ? String(school.inep).trim() : null,
          address: school.endereco || school.address || null,
          zone: school.zona || school.zone || 'Urbana',
          schoolType: school.tipo || school.schoolType || 'Municipal'
        },
        class: {
          id: String(classData.id),
          name: classData.nome || classData.name,
          grade: classData.serie_ano || classData.grade || null
        }
      }
    });

  } catch (error) {
    console.error('Erro em /external/student-verify:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao validar credenciais do estudante' 
    });
  }
});
```

---

## 🛡️ Benefícios Desta Estruturação

| Campo da Escola | Função no EduConnect |
| :--- | :--- |
| **`inep`** | Identificador universal único nacional. Garante que `getOrCreateSchool` encontre instantaneamente a escola exata, mesmo que o nome tenha sido digitado com pequenas variações. |
| **`name`** | Nome oficial exibido no feed de notícias, crachás e nos filtros de moderação da escola. |
| **`address` e `zone`** | Metadados exibidos no perfil da instituição e usados em métricas SEDUC. |
| **`class.id` e `class.name`** | Vincula as postagens do aluno à sua turma e alimenta o painel de moderação pedagógica do professor (`/moderation`). |

---

## 🚀 Como testar a comunicação entre as duas stacks

1. No **EduCampina Backend**, verifique se a rota `/api/auth/external/student-verify` está respondendo conforme o formato acima.
2. No **EduConnect Frontend**, acerte a aba **"Sou Estudante"**, insira uma matrícula e código de turma válidos.
3. No **EduConnect Backend**, o estudante será provisionado de forma JIT (Just-In-Time) com os dados da escola e turma salvos no banco.
