# Security Policy

Este documento descreve o processo de resposta a incidentes e boas praticas.

## Responsavel por Seguranca
- Time/Owner: Security Team
- Canal: security@empresa.com

## Reporte de Vulnerabilidades
- Enviar detalhes tecnicos, impacto e passos de reproducao
- Evitar abrir issues publicas para temas sensiveis

## Resposta a Incidentes (Runbook)

### 1. Identificacao
- Confirmar a severidade (critico/alto/medio/baixo)
- Registrar horario e impacto
- Identificar sistemas afetados

### 2. Contencao
- Revogar credenciais suspeitas
- Bloquear IPs/rotas vulneraveis
- Reduzir superficie (desabilitar features temporarias)

### 3. Erradicacao
- Aplicar patch e atualizar dependencias
- Rotacionar secrets (JWT_SECRET, SESSION_SECRET, DB_PASSWORD)
- Validar que o vetor foi removido

### 4. Recuperacao
- Restaurar servicos
- Monitorar logs e metricas
- Verificar integridade dos dados

### 5. Pos-Incidente
- Documentar causa raiz
- Criar plano de prevencao
- Atualizar testes e monitoramento

## Rotacao de Secrets
- Periodicidade minima: 90 dias (ou conforme politica interna)
- Em incidente: rotacao imediata
- Atualizar todas as instancias e serviços dependentes

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

