# Operations Guide

Este guia cobre tarefas operacionais do dia a dia.

## Start/Stop

Backend:
```bash
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

Worker (opcional):
```bash
npm run worker
```

## Health Check
```bash
curl http://localhost:3000/health
```

## Backup e Retencao

Script recomendado:
```bash
bash scripts/backup.sh
```

Cron:
```bash
0 2 * * * /path/to/backup.sh
```

Retencao (30 dias):
```bash
find backups/* -mtime +30 -delete
```

## Restauracao de Backup (PostgreSQL)
```bash
psql -U $DB_USER -h $DB_HOST -d $DB_NAME < backups/backup_YYYY-MM-DD.sql
```

## Logs e Observabilidade
- Use o stdout/stderr da aplicacao
- Centralize logs com um coletor
- Monitore erros 4xx/5xx e latencia

## Scans de Seguranca

Semgrep:
```bash
npm run security-scan
```

OWASP ZAP:
```bash
npm run zap-scan
npm run zap-scan:full
```

## Importacao de alertas ZAP
```bash
POST /api/protected/zap-alerts-import
```

