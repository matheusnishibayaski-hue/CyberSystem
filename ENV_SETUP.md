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

# Redis Configuration (Obrigatório para o Worker de Scans)
REDIS_URL=redis://localhost:6379
# Ou use variáveis individuais:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
# REDIS_DB=0
```

## Importante

⚠️ **Altere o `JWT_SECRET` e `SESSION_SECRET` para valores seguros em produção!**

Você pode gerar um secret seguro usando:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Redis (Obrigatório para Worker)

⚠️ **O Redis é obrigatório se você for usar o Worker de Scans (`npm run worker`).**

Para instalar e iniciar o Redis:

1. **Instalar Docker Desktop** (se ainda não tiver):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/install-docker.ps1
   ```

2. **Iniciar Redis**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/start-redis.ps1
   ```
   
   Ou manualmente:
   ```powershell
   docker run -d --name redis -p 6379:6379 redis:7
   ```

3. **Verificar se Redis está rodando**:
   ```powershell
   docker ps --filter "name=redis"
   ```

Para mais informações, consulte `docs/redis-setup.md`.
