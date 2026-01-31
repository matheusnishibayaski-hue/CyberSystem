# Sistema de Fila de Scans

Este documento explica como usar o sistema de fila de scans implementado com BullMQ e Redis.

## Arquitetura

O sistema de filas permite processar scans de segurança de forma assíncrona, evitando bloqueios na API e permitindo melhor controle de recursos.

### Componentes

1. **Fila (`src/queues/scanQueue.js`)**: Configuração da fila BullMQ
2. **Worker (`src/workers/scanWorker.js`)**: Processa os jobs da fila
3. **Service (`src/services/scanService.js`)**: Lógica de execução dos scans
4. **Controller (`src/controllers/scans.controller.js`)**: Endpoint para adicionar scans à fila

## Pré-requisitos

1. **Redis**: Deve estar rodando e acessível
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7
   ```

2. **Variáveis de Ambiente** (opcional):
   ```env
   REDIS_URL=redis://localhost:6379
   ```

## Como Usar

### 1. Iniciar o Worker

O worker precisa estar rodando para processar os jobs da fila:

```bash
# Produção
npm run worker

# Desenvolvimento (com auto-reload)
npm run worker:dev
```

### 2. Iniciar o Servidor

Em outro terminal, inicie o servidor:

```bash
npm start
# ou
npm run dev
```

### 3. Enfileirar um Scan

Faça uma requisição POST para `/api/protected/scans`:

```bash
# Scan de segurança (Semgrep)
curl -X POST http://localhost:3000/api/protected/scans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "type": "security"
  }'

# Scan ZAP simples
curl -X POST http://localhost:3000/api/protected/scans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "type": "zap",
    "scanType": "simple"
  }'

# Scan ZAP completo
curl -X POST http://localhost:3000/api/protected/scans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "type": "zap",
    "scanType": "full"
  }'
```

### Resposta da API

```json
{
  "message": "Scan enfileirado.",
  "jobId": "123",
  "type": "security",
  "status": "queued"
}
```

## Tipos de Scan

### Security Scan (`type: "security"`)
- Executa scan Semgrep
- Gera relatório `semgrep-result.json`
- Gera resumo `security-gate-summary.json`

### ZAP Scan (`type: "zap"`)
- Executa scan OWASP ZAP
- Parâmetros:
  - `scanType`: `"simple"` (padrão) ou `"full"`
- Gera relatório `security/zap-report.html`
- Processa e salva alertas no banco de dados

## Monitoramento

O worker registra logs de todas as operações:

```
[WORKER] Processando job 123 - Tipo: security, Target: null
[SCAN] Iniciando Security scan
✅ Security scan completed successfully
[WORKER] ✅ Job 123 concluído com sucesso (Security Scan)
```

## Rotas Disponíveis

- `POST /api/protected/scans` - Adiciona scan à fila (novo)
- `POST /api/protected/scans/security` - Executa scan de segurança diretamente (legado)
- `POST /api/protected/scans/zap` - Executa scan ZAP diretamente (legado)
- `GET /api/protected/scans/reports` - Lista relatórios disponíveis
- `GET /api/protected/scans/reports/:reportType` - Baixa relatório específico

## Troubleshooting

### Worker não processa jobs
- Verifique se o Redis está rodando: `docker ps | grep redis`
- Verifique se o worker está rodando: `npm run worker`
- Verifique os logs do worker para erros

### Jobs ficam na fila mas não são processados
- Certifique-se de que o worker está rodando
- Verifique a conexão com o Redis
- Verifique os logs do worker para erros específicos

### Erro de conexão com Redis
- Verifique se o Redis está acessível na porta 6379
- Verifique a variável `REDIS_URL` se estiver usando URL customizada
- Teste a conexão: `redis-cli ping` (deve retornar `PONG`)
