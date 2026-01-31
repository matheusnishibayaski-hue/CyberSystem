# Como Iniciar os Servidores

## ⚠️ IMPORTANTE: Você precisa rodar DOIS servidores (e opcionalmente um Worker)

### 1️⃣ Backend (API) - Porta 3000
Abra um terminal e execute:
```bash
npm run dev
```

Ou em produção:
```bash
npm start
```

### 2️⃣ Frontend (React) - Porta 5173
Abra OUTRO terminal e execute:
```bash
cd frontend
npm run dev
```

### 3️⃣ Worker de Scans (Opcional) - Requer Redis
Se você for usar scans de segurança em background, abra um TERCEIRO terminal:

**Primeiro, certifique-se de que o Redis está rodando:**
```powershell
# Verificar se Redis está rodando
docker ps --filter "name=redis"

# Se não estiver, inicie:
powershell -ExecutionPolicy Bypass -File scripts/start-redis.ps1
```

**Depois, inicie o Worker:**
```bash
npm run worker
```

Ou em modo desenvolvimento (com auto-reload):
```bash
npm run worker:dev
```

## 🌐 URLs de Acesso

- **Frontend (Interface)**: http://localhost:5173
- **Backend (API)**: http://localhost:3000

## ✅ Verificar se está funcionando

1. Backend rodando: Acesse http://localhost:3000/health
   - Deve retornar: `{"status":"OK",...}`

2. Frontend rodando: Acesse http://localhost:5173
   - Deve mostrar a tela de login

## 🔧 Solução de Problemas

### Erro: "Port already in use"
- Pare todos os processos Node.js: `Get-Process node | Stop-Process`
- Ou use portas diferentes no arquivo `.env`

### Erro: "ERR_CONNECTION_REFUSED"
- Verifique se ambos os servidores estão rodando
- Verifique se as portas 3000 e 5173 estão livres
- Verifique o firewall do Windows

### Erro: "BullMQ: Your redis options maxRetriesPerRequest must be null"
- ✅ **Já corrigido!** Os arquivos `src/workers/scanWorker.js` e `src/queues/scanQueue.js` foram atualizados.
- Se ainda ocorrer, verifique se o Redis está rodando: `docker ps --filter "name=redis"`

### Erro: "ECONNREFUSED" ao iniciar o Worker
- Verifique se o Redis está rodando: `docker ps --filter "name=redis"`
- Se não estiver, inicie: `powershell -ExecutionPolicy Bypass -File scripts/start-redis.ps1`
- Verifique se `REDIS_URL` está configurado no arquivo `.env`
