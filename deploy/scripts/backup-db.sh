#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-${ENV_NAME:-staging}}"
AWS_REGION="${2:-${AWS_REGION:-ap-southeast-1}}"

if [[ "${ENV_NAME}" != "prod" && "${ENV_NAME}" != "staging" ]]; then
  echo "ERROR: ENV_NAME must be 'prod' or 'staging' (got '${ENV_NAME}')" >&2
  exit 1
fi

STATE_DIR="/opt/car-service/${ENV_NAME}"
ENV_FILE="${STATE_DIR}/.env.runtime"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: Runtime env file not found: ${ENV_FILE}" >&2
  exit 1
fi

DB_URL="$(grep -E '^DATABASE_URL=' "${ENV_FILE}" | head -n1 | cut -d'=' -f2-)"
S3_BUCKET="$(grep -E '^AWS_S3_BUCKET=' "${ENV_FILE}" | head -n1 | cut -d'=' -f2-)"

if [[ -z "${DB_URL}" || -z "${S3_BUCKET}" ]]; then
  echo "ERROR: DATABASE_URL and AWS_S3_BUCKET must be set in ${ENV_FILE}" >&2
  exit 1
fi

read -r DB_HOST DB_PORT DB_USER DB_PASS DB_NAME < <(python3 - "${DB_URL}" <<'PYEOF'
import sys
from urllib.parse import urlparse, unquote

u = urlparse(sys.argv[1])
host = u.hostname or ""
port = str(u.port or 3306)
user = unquote(u.username or "")
password = unquote(u.password or "")
db = u.path.lstrip("/")
print(host, port, user, password, db)
PYEOF
)

TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
BACKUP_FILE="/tmp/car_service_${ENV_NAME}_${TIMESTAMP}.sql.gz"
S3_URI="s3://${S3_BUCKET}/backups/${ENV_NAME}/car_service_${ENV_NAME}_${TIMESTAMP}.sql.gz"

trap 'rm -f "${BACKUP_FILE}"' EXIT

echo "==> [${ENV_NAME}] Backing up MySQL database '${DB_NAME}' at ${DB_HOST}:${DB_PORT}..."
if command -v mysqldump >/dev/null 2>&1; then
  MYSQL_PWD="${DB_PASS}" mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --single-transaction \
    --routines \
    --triggers \
    "${DB_NAME}" | gzip -c > "${BACKUP_FILE}"
else
  docker run --rm -e MYSQL_PWD="${DB_PASS}" mysql:8.0 \
    mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --single-transaction \
    --routines \
    --triggers \
    "${DB_NAME}" | gzip -c > "${BACKUP_FILE}"
fi

echo "==> [${ENV_NAME}] Uploading backup to ${S3_URI}..."
aws s3 cp "${BACKUP_FILE}" "${S3_URI}" --region "${AWS_REGION}" --only-show-errors
echo "==> [${ENV_NAME}] Backup completed: ${S3_URI}"
