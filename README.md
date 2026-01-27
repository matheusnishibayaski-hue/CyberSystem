# Secure Web Security 🔐

Projeto focado em Cyber Segurança Web utilizando ferramentas de mercado.

## Ferramentas

- **Node.js + Express** - Framework web para construção da API
- **Helmet** - Headers de segurança HTTP
- **bcrypt** - Criptografia de senhas
- **JWT** - Autenticação baseada em tokens
- **OWASP ZAP** - Scan dinâmico de vulnerabilidades
- **Semgrep** - Análise estática de código
- **OWASP Top 10** - Proteção contra principais vulnerabilidades

## Estrutura do Projeto

```
CyberSystem/
│
├── src/                    # Backend (Node.js/Express)
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   └── middleware/
│
├── frontend/               # Frontend (React/Vite)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── security/
│   ├── semgrep.yml
│   └── zap-report.html
│
├── docs/
│   ├── owasp-top10.md
│   ├── threat-model.md
│   └── zap-scan-guide.md
│
├── scripts/
│   ├── security-scan.ps1
│   ├── zap-scan.ps1
│   └── zap-scan-simple.ps1
│
├── .env
├── package.json
└── README.md
```

## Instalação

### Backend

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env e configure:
# - JWT_SECRET (obrigatório)
# - PORT (opcional, padrão: 3000)
# - CORS_ORIGIN=http://localhost:5173 (para o frontend)
```

3. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

### Frontend

1. Navegue até a pasta frontend:
```bash
cd frontend
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173` e se comunicará automaticamente com o backend na porta 3000.

## Funcionalidades de Segurança

### Autenticação
- ✅ Autenticação JWT com expiração configurável
- ✅ Criptografia de senhas com bcrypt (12 rounds)
- ✅ Middleware de autorização para rotas protegidas
- ✅ Validação de entrada com express-validator

### Proteção contra Ataques
- ✅ Rate limiting (proteção contra brute force)
- ✅ Headers de segurança HTTP (Helmet)
- ✅ CORS configurado
- ✅ Validação e sanitização de dados

### Análise de Segurança
- ✅ Scan estático com Semgrep
- ✅ Scan dinâmico com OWASP ZAP
- ✅ Proteção contra OWASP Top 10

## OWASP Top 10 - Vulnerabilidades Mitigadas

Este projeto implementa proteções contra as principais vulnerabilidades:

- **A01:2021** – Broken Access Control
- **A02:2021** – Cryptographic Failures
- **A03:2021** – Injection
- **A07:2021** – Identification and Authentication Failures

📖 **Documentação completa:** `docs/owasp-top10.md`

## Análise de Segurança

### Scan Estático (Semgrep)
```bash
npm run security-scan
```
Executa análise estática de código com regras OWASP.

### Scan Dinâmico (OWASP ZAP)
```bash
# Certifique-se de que o servidor está rodando
npm start

# Em outro terminal, execute o scan
npm run zap-scan
```

O relatório será salvo em `security/zap-report.html`

**Nota**: Para scan completo, instale OWASP ZAP Desktop ou use Docker. Veja `docs/zap-scan-guide.md` para instruções detalhadas.

## Endpoints da API

### Públicos
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `GET /health` - Health check

### Protegidos (requerem autenticação)
- `GET /api/protected/profile` - Perfil do usuário
- `GET /api/protected/dashboard` - Dashboard

**Exemplo de uso:**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha123"}'

# Acessar rota protegida
curl -X GET http://localhost:3000/api/protected/profile \
  -H "Authorization: Bearer <token>"
```

## Documentação

- **OWASP Top 10**: `docs/owasp-top10.md` - Documentação profissional das mitigações
- **Modelo de Ameaças**: `docs/threat-model.md` - Análise de ameaças e riscos
- **Guia ZAP**: `docs/zap-scan-guide.md` - Instruções para scan de segurança

## Scripts Disponíveis

```bash
npm start              # Inicia o servidor
npm run dev            # Desenvolvimento com auto-reload
npm run security-scan  # Scan estático com Semgrep
npm run zap-scan       # Scan dinâmico com OWASP ZAP
```

## Requisitos

- Node.js 16+ 
- npm ou yarn
- Python 3.x (para Semgrep e OWASP ZAP CLI)
- OWASP ZAP Desktop (opcional, para scan completo)

## Licença

MIT
