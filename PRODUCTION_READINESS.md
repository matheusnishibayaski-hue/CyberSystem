# Production Readiness Checklist

Este documento cobre os itens essenciais antes de colocar o CyberSystem em producao.

## Infraestrutura
- Banco PostgreSQL com backups automatizados e retencao definida
- Redis em modo persistente (se usar o worker)
- TLS no proxy/reverso (Nginx/ALB/App Gateway)
- Logs centralizados (ex.: CloudWatch, ELK, Azure Monitor)
- Monitoramento e alertas (CPU, memoria, latencia, erros 5xx)

## Seguranca
- Secrets via AWS Secrets Manager / Vault / Azure Key Vault
- IAM/RBAC minimos (principio de menor privilegio)
- JWT_SECRET e SESSION_SECRET com alta entropia e rotacao planejada
- CORS_ORIGIN restrito ao dominio oficial
- Rate limiting revisado para producao

## Configuracao
- NODE_ENV=production
- PORT definido
- DB_SSL=true quando exigido pelo provedor
- Health check em `/health`

## Banco de dados
- Schema inicial aplicado: `npm run db:init`
- Indices conferidos
- Politica de retenção de backups

## Deploy
- Build reproducivel (lockfiles commitados)
- Rollback rapido (tag/imagem anterior)
- Migracoes versionadas quando aplicavel

## Backup e Restauracao (PostgreSQL)

### Backup manual
```bash
pg_dump -U $DB_USER -h $DB_HOST $DB_NAME > backups/backup_$(date +%F).sql
```

### Restaurar backup
```bash
psql -U $DB_USER -h $DB_HOST -d $DB_NAME < backups/backup_YYYY-MM-DD.sql
```

### Verificacoes recomendadas
- Testar restauracao em ambiente isolado
- Validar tabelas criticas e contagens

## Scans de Seguranca

### Semgrep (SAST)
```bash
npm run security-scan
```

### OWASP ZAP (DAST)
```bash
npm run zap-scan
npm run zap-scan:full
```

