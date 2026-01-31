# Configuração do Redis

## Opção 1: Usando Docker (Recomendado)

### Instalar Docker Desktop

1. **Baixe o Docker Desktop para Windows:**
   - Acesse: https://www.docker.com/products/docker-desktop/
   - Baixe e instale o Docker Desktop

2. **Após instalar, reinicie o PowerShell e execute:**
   ```powershell
   docker run -d --name redis -p 6379:6379 redis:7
   ```

3. **Verificar se está rodando:**
   ```powershell
   docker ps
   ```

4. **Parar o Redis (quando necessário):**
   ```powershell
   docker stop redis
   ```

5. **Iniciar novamente:**
   ```powershell
   docker start redis
   ```

## Opção 2: Instalar Redis nativo no Windows

### Usando WSL2 (Windows Subsystem for Linux)

1. **Instalar WSL2:**
   ```powershell
   wsl --install
   ```

2. **Após instalar e reiniciar, abra o Ubuntu/WSL e execute:**
   ```bash
   sudo apt update
   sudo apt install redis-server -y
   sudo service redis-server start
   ```

3. **Verificar se está rodando:**
   ```bash
   redis-cli ping
   # Deve retornar: PONG
   ```

### Usando Memurai (Redis compatível para Windows)

1. **Baixe o Memurai:**
   - Acesse: https://www.memurai.com/get-memurai
   - Baixe e instale a versão Developer (gratuita)

2. **O Memurai será iniciado automaticamente como serviço do Windows**

3. **Verificar se está rodando:**
   ```powershell
   Get-Service Memurai
   ```

## Opção 3: Redis na nuvem (para desenvolvimento/testes)

Você pode usar serviços gratuitos como:
- **Redis Cloud**: https://redis.com/try-free/
- **Upstash**: https://upstash.com/

Depois configure no arquivo `.env`:
```env
REDIS_HOST=seu-host-redis
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha
```

## Configuração no Projeto

Adicione as seguintes variáveis no arquivo `.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Verificar Conexão

Após configurar, você pode testar a conexão com Redis executando:

```powershell
node -e "const Redis = require('ioredis'); const redis = new Redis({ host: 'localhost', port: 6379 }); redis.ping().then(r => console.log('Redis conectado:', r)).catch(e => console.error('Erro:', e));"
```

## Nota Importante

⚠️ **O projeto atualmente não requer Redis para funcionar**. As dependências `ioredis` e `bullmq` estão instaladas, mas não estão sendo usadas no código atual. Você pode:

1. **Instalar Redis agora** se planeja usar filas de jobs ou cache
2. **Pular a instalação** se não for usar essas funcionalidades ainda
3. **Remover as dependências** se não planeja usar Redis:
   ```powershell
   npm uninstall ioredis bullmq
   ```
