# Configuração do Arquivo .env

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=change-this-secret-key-in-production
JWT_EXPIRES_IN=1h

# Database Configuration
DB_HOST=painellinux.fabricadetempo.cloud
DB_PORT=5432
DB_NAME=CyberSystem
DB_USER=postgres
DB_PASSWORD=83e93176b68d4e97dadc5fc34e3aa331
DB_SSL=false

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_SECRET=change-this-session-secret-in-production
```

## Importante

⚠️ **Altere o `JWT_SECRET` e `SESSION_SECRET` para valores seguros em produção!**

Você pode gerar um secret seguro usando:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
