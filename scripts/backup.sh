#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"

mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
pg_dump -U "${DB_USER}" -h "${DB_HOST}" cyber_system > "${BACKUP_DIR}/backup_$(date +%F).sql"

# Retenção de 30 dias
find "${BACKUP_DIR}"/* -mtime +30 -delete
