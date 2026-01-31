# CyberSystem 🔐

## 📋 Visão Geral

O **CyberSystem** é uma plataforma completa de **segurança para aplicações web**, focada em **DevSecOps**, análise de vulnerabilidades, autenticação segura e monitoramento de sites. O projeto foi desenvolvido com base em **ferramentas reais do mercado** e alinhado às boas práticas do **OWASP Top 10**.

O objetivo principal é demonstrar, de forma clara e profissional, **como a segurança pode ser integrada ao ciclo de desenvolvimento** desde o início (Shift Left Security), sem correções automáticas perigosas e com tomada de decisão humana.

---

## 🎯 Objetivos do Projeto

* Aplicar segurança web de forma realista e profissional
* Automatizar análises de vulnerabilidade no CI/CD
* Detectar falhas e **sugerir correções**, sem modificar o código automaticamente
* Fornecer interface web moderna para monitoramento e gestão
* Servir como projeto de estudo e **portfólio profissional**

---

## 🛡️ Funcionalidades Principais

### 1. Segurança da Aplicação

* **Autenticação JWT** com expiração configurável
* **Criptografia de senhas** com bcrypt (12 rounds)
* **Proteção contra força bruta** (rate limiting)
* **Headers de segurança** com Helmet
* **Validação e sanitização** de dados de entrada
* **Sessões seguras** com configuração adequada

Essas medidas mitigam riscos relacionados a:

* Broken Authentication
* XSS (Cross-Site Scripting)
* Brute Force
* Security Misconfiguration

---

### 2. Interface Web (Frontend)

* **Dashboard interativo** com métricas de segurança em tempo real
* **Monitoramento de sites** com gerenciamento completo
* **Visualização de logs** de segurança
* **Gráficos e estatísticas** de vulnerabilidades
* **Design moderno** com Tailwind CSS e animações
* **Responsivo** e otimizado para diferentes dispositivos

---

### 3. API Backend

* **RESTful API** com Express.js
* **Autenticação baseada em tokens** (JWT)
* **Rotas protegidas** com middleware de autorização
* **Banco de dados PostgreSQL** para persistência
* **Validação de dados** com express-validator
* **Tratamento de erros** robusto

---

### 4. Análise de Vulnerabilidades (DevSecOps)

* **Análise estática de código (SAST)** utilizando **Semgrep**
* **Execução automática** de scans a cada push ou pull request
* **Geração de resultados** em formato JSON
* **Script próprio de sugestão de correções**, com:

  * Identificação do arquivo e linha afetada
  * Classificação por severidade (Alta, Média, Baixa)
  * Recomendações baseadas em boas práticas do OWASP

> ⚠️ O sistema **não aplica correções automaticamente**. A decisão final é sempre do desenvolvedor, seguindo o padrão adotado por times maduros de segurança.

---

### 5. Pipeline de Segurança (CI/CD)

* **Integração com GitHub Actions**
* **Execução automática** de:

  * Scan de segurança com Semgrep
  * Análise e exibição de sugestões de correção
* **Armazenamento de resultados** como artefatos
* **Pipeline não bloqueante**, priorizando visibilidade e controle de risco

Esse modelo evita falsos positivos e mantém a estabilidade do desenvolvimento.

---

## 🧰 Tecnologias Utilizadas

### Backend

* **Node.js** - Runtime JavaScript
* **Express.js** - Framework web
* **PostgreSQL** - Banco de dados relacional
* **JWT** - Autenticação baseada em tokens
* **bcryptjs** - Criptografia de senhas

### Frontend

* **React 18** - Biblioteca UI
* **Vite** - Build tool e dev server
* **React Router** - Roteamento
* **TanStack Query** - Gerenciamento de estado e cache
* **Tailwind CSS** - Framework CSS utilitário
* **Framer Motion** - Animações
* **Recharts** - Gráficos e visualizações
* **Axios** - Cliente HTTP

### Segurança

* **Helmet** - Headers de segurança HTTP
* **express-rate-limit** - Proteção contra brute force
* **express-validator** - Validação de dados
* **Semgrep** - Análise estática de código
* **OWASP ZAP** - Scan dinâmico de vulnerabilidades (execução manual)

### Automação e DevOps

* **GitHub Actions** - CI/CD pipeline
* **Python 3** - Scripts de análise e sugestão
* **PowerShell** - Scripts de automação (Windows)

---

## 📂 Estrutura do Projeto

```
CyberSystem/
│
├── src/                          # Backend (Node.js/Express)
│   ├── config/                   # Configurações
│   │   └── db.config.js         # Configuração do banco de dados
│   ├── controllers/             # Controladores da API
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── logs.controller.js
│   │   └── sites.controller.js
│   ├── database/                 # Banco de dados
│   │   ├── init.js              # Inicialização do banco
│   │   └── init.sql             # Schema SQL
│   ├── middleware/              # Middlewares
│   │   └── auth.middleware.js   # Autenticação JWT
│   ├── routes/                   # Rotas da API
│   │   ├── auth.routes.js       # Rotas públicas
│   │   └── protected.routes.js  # Rotas protegidas
│   └── server.js                # Servidor principal
│
├── frontend/                     # Frontend (React/Vite)
│   ├── src/
│   │   ├── api/                 # Cliente API
│   │   ├── components/         # Componentes React
│   │   │   ├── cyber/           # Componentes específicos
│   │   │   └── ui/              # Componentes UI reutilizáveis
│   │   ├── lib/                 # Utilitários e contextos
│   │   ├── pages/               # Páginas da aplicação
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Logs.jsx
│   │   │   └── Sites.jsx
│   │   ├── App.jsx              # Componente principal
│   │   └── main.jsx            # Entry point
│   └── package.json
│
├── scripts/                      # Scripts de automação
│   ├── semgrep_suggestions.py   # Script de sugestões de correção
│   ├── security_gate.py         # Security Gate inteligente
│   ├── security-scan.ps1        # Scan de segurança (Windows)
│   └── seed-data.js             # Dados de exemplo
│
├── .github/
│   └── workflows/
│       └── security.yml         # Pipeline de segurança (CI/CD)
│
├── security/                     # Configurações de segurança
│   ├── semgrep.yml             # Regras do Semgrep
│   └── zap-report.html         # Relatórios OWASP ZAP
│
├── docs/                         # Documentação
│   ├── owasp-top10.md          # Mitigações OWASP Top 10
│   ├── threat-model.md          # Modelo de ameaças
│   ├── security-gate.md         # Security Gate
│   ├── github-actions-pipeline.md
│   └── zap-scan-guide.md
│
├── .env                          # Variáveis de ambiente (não versionado)
├── package.json                  # Dependências do backend
└── README.md                     # Este arquivo
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

* **Node.js** 16+ e npm
* **PostgreSQL** 12+ (ou banco de dados compatível)
* **Python 3.11+** (para scripts de análise)
* **Git** (para controle de versão)

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd CyberSystem
```

### 2. Configuração do Backend

#### Instalar dependências:

```bash
npm install
```

#### Configurar variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto (apenas para desenvolvimento local):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=seu-secret-jwt-aqui-gerar-com-crypto-randomBytes
JWT_EXPIRES_IN=1h

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cybersystem
DB_USER=postgres
DB_PASSWORD=sua-senha
DB_SSL=false

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_SECRET=seu-session-secret-aqui
```

#### Gestão profissional de secrets (AWS / Vault / Azure)

**Não armazene secrets no repositório.** Em ambientes reais, use um cofre de secrets.
O backend carrega automaticamente secrets via SDK quando as variáveis abaixo estão configuradas.

**AWS Secrets Manager**

Credenciais:
* IAM Role (recomendado) ou `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
* `AWS_REGION`

Variáveis:
```env
AWS_SECRETS_ID=cybersystem/prod
AWS_REGION=us-east-1
```

Exemplo de payload (SecretString JSON):
```json
{
  "DB_HOST": "prod-db.example.com",
  "DB_PORT": "5432",
  "DB_NAME": "CyberSystem",
  "DB_USER": "postgres",
  "DB_PASSWORD": "super-secret",
  "JWT_SECRET": "jwt-secret-prod",
  "SESSION_SECRET": "session-secret-prod",
  "REDIS_URL": "redis://prod-redis:6379"
}
```

**HashiCorp Vault (KV v2 ou v1)**

Credenciais:
* `VAULT_TOKEN` (ou configure auth via agent)

Variáveis:
```env
VAULT_ADDR=https://vault.example.com
VAULT_TOKEN=s.XXXXX
VAULT_SECRET_PATH=secret/data/cybersystem
```

Exemplo de payload (KV v2):
```json
{
  "data": {
    "DB_HOST": "prod-db.example.com",
    "DB_PORT": "5432",
    "DB_NAME": "CyberSystem",
    "DB_USER": "postgres",
    "DB_PASSWORD": "super-secret",
    "JWT_SECRET": "jwt-secret-prod",
    "SESSION_SECRET": "session-secret-prod",
    "REDIS_URL": "redis://prod-redis:6379"
  }
}
```

**Azure Key Vault**

Credenciais:
* `DefaultAzureCredential` (Managed Identity, Azure CLI, Service Principal)

Variáveis:
```env
AZURE_KEYVAULT_URL=https://<vault-name>.vault.azure.net
AZURE_KEYVAULT_SECRET_NAMES=DB_HOST,DB_PORT,DB_NAME,DB_USER,DB_PASSWORD,JWT_SECRET,SESSION_SECRET,REDIS_URL
```

Exemplo de secrets (um segredo por chave):
* `DB_HOST=prod-db.example.com`
* `DB_PORT=5432`
* `DB_NAME=CyberSystem`
* `DB_USER=postgres`
* `DB_PASSWORD=super-secret`
* `JWT_SECRET=jwt-secret-prod`
* `SESSION_SECRET=session-secret-prod`
* `REDIS_URL=redis://prod-redis:6379`

**Override opcional**
```env
SECRETS_OVERRIDE=true
```
Quando `true`, o loader sobrescreve variáveis já presentes no ambiente.

**Exemplos por ambiente**

*Desenvolvimento (local)*:
```env
NODE_ENV=development
AWS_SECRETS_ID=cybersystem/dev
AWS_REGION=us-east-1
VAULT_ADDR=https://vault.dev.example.com
VAULT_SECRET_PATH=secret/data/cybersystem
AZURE_KEYVAULT_URL=https://cybersystem-dev.vault.azure.net
AZURE_KEYVAULT_SECRET_NAMES=DB_HOST,DB_PORT,DB_NAME,DB_USER,DB_PASSWORD,JWT_SECRET,SESSION_SECRET,REDIS_URL
```

*Staging*:
```env
NODE_ENV=staging
AWS_SECRETS_ID=cybersystem/staging
AWS_REGION=us-east-1
VAULT_ADDR=https://vault.staging.example.com
VAULT_SECRET_PATH=secret/data/cybersystem
AZURE_KEYVAULT_URL=https://cybersystem-staging.vault.azure.net
AZURE_KEYVAULT_SECRET_NAMES=DB_HOST,DB_PORT,DB_NAME,DB_USER,DB_PASSWORD,JWT_SECRET,SESSION_SECRET,REDIS_URL
```

*Produção*:
```env
NODE_ENV=production
AWS_SECRETS_ID=cybersystem/prod
AWS_REGION=us-east-1
VAULT_ADDR=https://vault.prod.example.com
VAULT_SECRET_PATH=secret/data/cybersystem
AZURE_KEYVAULT_URL=https://cybersystem-prod.vault.azure.net
AZURE_KEYVAULT_SECRET_NAMES=DB_HOST,DB_PORT,DB_NAME,DB_USER,DB_PASSWORD,JWT_SECRET,SESSION_SECRET,REDIS_URL
```

**Política mínima IAM (AWS Secrets Manager)**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:cybersystem/*"
    }
  ]
}
```

**Política mínima HashiCorp Vault (KV v2)**
```hcl
path "secret/data/cybersystem/*" {
  capabilities = ["read"]
}
```

**Política mínima HashiCorp Vault (KV v1)**
```hcl
path "secret/cybersystem/*" {
  capabilities = ["read"]
}
```

**Azure Key Vault (credenciais e permissões mínimas)**

Opções de credencial com `DefaultAzureCredential`:
```env
# Service Principal
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_ID=<client-id>
AZURE_CLIENT_SECRET=<client-secret>
```

Permissão mínima com RBAC:
* Role: `Key Vault Secrets User`
* Scope: no Key Vault específico (ex.: `/subscriptions/.../resourceGroups/.../providers/Microsoft.KeyVault/vaults/<vault-name>`)

Permissão mínima com Access Policy (modo clássico):
```text
Secret Permissions: Get, List
```

**HashiCorp Vault Agent (exemplo de configuração)**

*Exemplo com AppRole:*
```hcl
vault {
  address = "https://vault.prod.example.com"
}

auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path   = "/etc/vault/role_id"
      secret_id_file_path = "/etc/vault/secret_id"
    }
  }
  sink "file" {
    config = {
      path = "/etc/vault/token"
    }
  }
}
```

**Rotação de secrets (boas práticas)**
* Gire `JWT_SECRET`, `SESSION_SECRET` e senhas de DB periodicamente
* Use versões e expiração no provedor (AWS Secrets Manager/Key Vault)
* Atualize os serviços com rollout gradual para evitar downtime
* Considere usar tokens de curta duração e renovar via agent/SDK

**Kubernetes (exemplos de integração)**

*AWS (IRSA)*:
* Configure ServiceAccount com `eks.amazonaws.com/role-arn`
* Use policy mínima do Secrets Manager

*Vault (Kubernetes auth)*:
```hcl
path "auth/kubernetes/login" {
  capabilities = ["create", "read"]
}
path "secret/data/cybersystem/*" {
  capabilities = ["read"]
}
```

*Azure (Managed Identity)*:
* Habilite identidade gerenciada no cluster
* Atribua role `Key Vault Secrets User` no Key Vault

**AWS Task Roles (ECS/Fargate)**
* Use task role com policy mínima do Secrets Manager
* Evite `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` em env vars

**Kubernetes Manifests (exemplos)**

*AWS IRSA (ServiceAccount):*
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cybersystem
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/CyberSystemSecretsRole
```

*Deployment (variáveis básicas e provider):*
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cybersystem
spec:
  template:
    spec:
      serviceAccountName: cybersystem
      containers:
        - name: api
          image: your-registry/cybersystem:latest
          env:
            - name: NODE_ENV
              value: "production"
            - name: AWS_REGION
              value: "us-east-1"
            - name: AWS_SECRETS_ID
              value: "cybersystem/prod"
```

*Vault Agent Injector (annotations):*
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cybersystem
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/role: "cybersystem"
    vault.hashicorp.com/agent-inject-secret-config: "secret/data/cybersystem"
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "cybersystem"
        vault.hashicorp.com/agent-inject-secret-config: "secret/data/cybersystem"
    spec:
      containers:
        - name: api
          image: your-registry/cybersystem:latest
          env:
            - name: VAULT_ADDR
              value: "https://vault.prod.example.com"
            - name: VAULT_SECRET_PATH
              value: "secret/data/cybersystem"
```

*Azure Workload Identity (ServiceAccount + labels):*
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cybersystem
  labels:
    azure.workload.identity/use: "true"
```

*Azure Deployment (Key Vault):*
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cybersystem
spec:
  template:
    spec:
      serviceAccountName: cybersystem
      containers:
        - name: api
          image: your-registry/cybersystem:latest
          env:
            - name: AZURE_KEYVAULT_URL
              value: "https://cybersystem-prod.vault.azure.net"
            - name: AZURE_KEYVAULT_SECRET_NAMES
              value: "DB_HOST,DB_PORT,DB_NAME,DB_USER,DB_PASSWORD,JWT_SECRET,SESSION_SECRET,REDIS_URL"
```

**Helm values (exemplo)**
```yaml
env:
  NODE_ENV: production
  AWS_REGION: us-east-1
  AWS_SECRETS_ID: cybersystem/prod
  VAULT_ADDR: https://vault.prod.example.com
  VAULT_SECRET_PATH: secret/data/cybersystem
  AZURE_KEYVAULT_URL: https://cybersystem-prod.vault.azure.net
  AZURE_KEYVAULT_SECRET_NAMES: DB_HOST,DB_PORT,DB_NAME,DB_USER,DB_PASSWORD,JWT_SECRET,SESSION_SECRET,REDIS_URL
serviceAccount:
  create: true
  name: cybersystem
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/CyberSystemSecretsRole
```

**Vault Kubernetes Auth (role)**
```hcl
path "auth/kubernetes/role/cybersystem" {
  capabilities = ["read"]
}
```

**Exemplo de role Kubernetes no Vault**
```bash
vault write auth/kubernetes/role/cybersystem \
  bound_service_account_names=cybersystem \
  bound_service_account_namespaces=default \
  policies=cybersystem \
  ttl=1h
```

**Política Vault por namespace (exemplo)**
```hcl
path "secret/data/cybersystem/production/*" {
  capabilities = ["read"]
}
```

**IAM por ambiente (exemplo de Resource)**
```json
{
  "Effect": "Allow",
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": [
    "arn:aws:secretsmanager:us-east-1:123456789012:secret:cybersystem/dev*",
    "arn:aws:secretsmanager:us-east-1:123456789012:secret:cybersystem/staging*",
    "arn:aws:secretsmanager:us-east-1:123456789012:secret:cybersystem/prod*"
  ]
}
```

**Azure RBAC (exemplo de atribuição)**
```bash
az role assignment create \
  --assignee <principal-id> \
  --role "Key Vault Secrets User" \
  --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault>"
```

**Gerar secrets seguros:**

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Inicializar banco de dados:

```bash
npm run db:init
```

### 3. Configuração do Frontend

```bash
cd frontend
npm install
```

### 4. Instalar Semgrep (para análise de segurança)

```bash
# Windows
pip install semgrep

# Linux/Mac
pip3 install semgrep
```

---

## 🏃 Como Executar

### Desenvolvimento

#### Terminal 1 - Backend:

```bash
npm run dev
```

O backend estará disponível em `http://localhost:3000`

#### Terminal 2 - Frontend:

```bash
cd frontend
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

### Produção

#### Backend:

```bash
npm start
```

#### Frontend:

```bash
cd frontend
npm run build
npm run preview
```

---

## 📡 API Endpoints

### Rotas Públicas

#### Autenticação

* `POST /api/auth/register` - Registro de novo usuário
  ```json
  {
    "email": "user@example.com",
    "password": "SenhaSegura123!"
  }
  ```

* `POST /api/auth/login` - Login de usuário
  ```json
  {
    "email": "user@example.com",
    "password": "SenhaSegura123!"
  }
  ```
  Retorna: `{ "token": "...", "user": {...} }`

* `GET /health` - Health check do servidor

### Rotas Protegidas (requerem token JWT)

**Header necessário:** `Authorization: Bearer <token>`

#### Dashboard

* `GET /api/protected/dashboard/stats` - Estatísticas do dashboard
* `GET /api/protected/dashboard/activity?limit=5` - Atividade recente
* `GET /api/protected/dashboard/alerts-chart` - Dados para gráfico de alertas

#### Sites Monitorados

* `GET /api/protected/sites` - Listar sites monitorados
* `POST /api/protected/sites` - Adicionar novo site
  ```json
  {
    "url": "https://example.com",
    "name": "Meu Site"
  }
  ```
* `PUT /api/protected/sites/:id` - Atualizar site
* `DELETE /api/protected/sites/:id` - Remover site

#### Logs de Segurança

* `GET /api/protected/logs` - Listar logs
* `POST /api/protected/logs` - Criar log
* `GET /api/protected/logs/stats` - Estatísticas de logs

#### Perfil

* `GET /api/protected/profile` - Informações do usuário autenticado

---

## 🔒 Segurança e DevSecOps

### Análise Estática (SAST)

#### Executar scan localmente:

```bash
# Windows
npm run security-scan

# Ou diretamente com Semgrep
semgrep --config=security/semgrep.yml --json src/ frontend/src/ > semgrep-result.json
```

#### Gerar sugestões de correção:

```bash
python scripts/semgrep_suggestions.py --file semgrep-result.json
```

### Pipeline CI/CD

O pipeline do GitHub Actions executa automaticamente:

1. **Scan de segurança** com Semgrep
2. **Análise e sugestões** de correção
3. **Geração de resumo** visual
4. **Armazenamento de artefatos**

**Configuração do pipeline:**

O pipeline é **não bloqueante** por padrão (`FAIL_ON_CRITICAL: false`). Para tornar bloqueante, edite `.github/workflows/security.yml`:

```yaml
env:
  FAIL_ON_CRITICAL: true  # Quebra build se houver problemas críticos
```

### Análise Dinâmica (DAST)

#### OWASP ZAP (execução manual):

```bash
# Scan simples
npm run zap-scan

# Scan completo
npm run zap-scan:full
```

Relatórios são salvos em `security/zap-report.html`

---

## 📌 Alinhamento com OWASP Top 10

O projeto aborda diretamente riscos relacionados a:

* **A01:2021** – Broken Access Control
* **A02:2021** – Cryptographic Failures
* **A03:2021** – Injection
* **A05:2021** – Security Misconfiguration
* **A07:2021** – Identification and Authentication Failures

📖 **Documentação completa:** `docs/owasp-top10.md`

---

## 🧠 Diferenciais do Projeto

* ✅ **Segurança desde o início** (Shift Left Security)
* ✅ **Correção assistida**, não automática
* ✅ **Alinhamento com OWASP Top 10**
* ✅ **Uso de ferramentas** amplamente adotadas no mercado
* ✅ **Arquitetura simples**, organizada e extensível
* ✅ **Abordagem realista** de DevSecOps
* ✅ **Interface web moderna** e responsiva
* ✅ **Pipeline CI/CD** integrado

---

## 📚 Scripts Disponíveis

### Backend

```bash
npm start              # Inicia servidor em produção
npm run dev            # Desenvolvimento com auto-reload
npm run db:init        # Inicializa banco de dados
npm run db:seed        # Popula banco com dados de exemplo
npm run security-scan  # Scan estático com Semgrep
npm run zap-scan       # Scan dinâmico com OWASP ZAP
```

### Frontend

```bash
npm run dev            # Servidor de desenvolvimento
npm run build          # Build para produção
npm run preview        # Preview do build
npm run lint           # Linter ESLint
```

---

## 📖 Documentação Adicional

* **OWASP Top 10**: `docs/owasp-top10.md` - Mitigações implementadas
* **Modelo de Ameaças**: `docs/threat-model.md` - Análise de ameaças
* **Security Gate**: `docs/security-gate.md` - Sistema de gates por severidade
* **GitHub Actions**: `docs/github-actions-pipeline.md` - Pipeline CI/CD
* **OWASP ZAP**: `docs/zap-scan-guide.md` - Guia de scan dinâmico
* **Configuração**: `ENV_SETUP.md` - Variáveis de ambiente
* **Iniciar Servidores**: `INICIAR_SERVIDORES.md` - Guia rápido

---

## 🚀 Roadmap (Evoluções Futuras)

* [ ] Dashboard visual de métricas de segurança aprimorado
* [ ] Relatórios em Markdown ou HTML automatizados
* [ ] Integração automatizada de DAST (OWASP ZAP) no pipeline
* [ ] Risk Score por commit
* [ ] Notificações em tempo real de vulnerabilidades
* [ ] Integração com sistemas de monitoramento externos
* [ ] API para integração com outras ferramentas
* [ ] Suporte a múltiplos bancos de dados
* [ ] Testes automatizados (unitários e integração)

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 🏁 Conclusão

O **CyberSystem** é um projeto focado em **segurança prática e responsável**, refletindo como a Cyber Segurança é aplicada no mundo real. Ele prioriza visibilidade, controle e tomada de decisão consciente, sendo ideal para:

* 📚 **Estudos avançados** de segurança web
* 💼 **Portfólio profissional** em DevSecOps
* 🎓 **Demonstração de maturidade técnica** em segurança de aplicações
* 🏢 **Base para projetos empresariais** que precisam de segurança robusta

---

## 📞 Suporte

Para dúvidas, sugestões ou problemas, abra uma [issue](https://github.com/seu-usuario/CyberSystem/issues) no repositório.

---

**Desenvolvido com ❤️ focado em segurança e boas práticas**
