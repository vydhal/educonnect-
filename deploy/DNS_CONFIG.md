# 🌐 Configuração de DNS

Para que o domínio `portaledu.simplisoft.com.br` funcione com a sua nova Stack, você precisa configurar os registros DNS no seu provedor (Cloudflare, Registro.br, etc).

### Registro Necessário

| Tipo | Nome (Host) | Valor (Aponta para) | TTL |
|------|-------------|---------------------|-----|
| **A** | `portaledu` | `[IP_DO_SEU_SERVIDOR]` | Automático / 3600 |

> [!NOTE]
> - Se você já usa um CNAME para o domínio principal `simplisoft.com.br`, você também pode usar um **CNAME** para `portaledu` apontando para o seu host principal.
> - **Exemplo CNAME**: `portaledu` -> `simplisoft.com.br`

### Como verificar se funcionou?
Após salvar a alteração no DNS, você pode testar no seu terminal:
```bash
ping portaledu.simplisoft.com.br
```
Ou usar o comando `nslookup`:
```bash
nslookup portaledu.simplisoft.com.br
```

---

### Fluxo de Acesso
Uma vez que o DNS aponte para o IP do seu servidor, o **Traefik** (que já está na sua infraestrutura) interceptará a requisição para `portaledu.simplisoft.com.br` e a direcionará para o container correto seguindo as `labels` que configuramos no `stack.yml`.
