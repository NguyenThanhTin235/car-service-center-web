#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-${ENV_NAME:-}}"
IMAGE_TAG="${2:-${IMAGE_TAG:-}}"
ECR_REGISTRY="${3:-${ECR_REGISTRY:-}}"
AWS_REGION="${4:-${AWS_REGION:-ap-southeast-1}}"
DOMAIN_NAME="${5:-${DOMAIN_NAME:-carservice.id.vn}}"

if [[ "${ENV_NAME}" != "prod" && "${ENV_NAME}" != "staging" ]]; then
  echo "ERROR: ENV_NAME must be 'prod' or 'staging' (got '${ENV_NAME}')" >&2
  exit 1
fi

if [[ -z "${IMAGE_TAG}" || -z "${ECR_REGISTRY}" ]]; then
  echo "ERROR: IMAGE_TAG and ECR_REGISTRY are required" >&2
  exit 1
fi

if [[ "${ENV_NAME}" == "prod" ]]; then
  BACKEND_PORT=5000
  CUSTOMER_PORT=3000
  INTERNAL_PORT=3001
else
  BACKEND_PORT=5100
  CUSTOMER_PORT=3100
  INTERNAL_PORT=3101
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${DEPLOY_DIR}/docker-compose.aws.yml}"
PROJECT_NAME="car-service-${ENV_NAME}"
STATE_DIR="/opt/car-service/${ENV_NAME}"
ENV_FILE="${STATE_DIR}/.env.runtime"
SSM_PREFIX="/car-service/${ENV_NAME}/"

mkdir -p "${STATE_DIR}"

echo "==> [${ENV_NAME}] Fetching SSM parameters from ${SSM_PREFIX} (${AWS_REGION})..."
ENV_TMP="${ENV_FILE}.tmp"
rm -f "${ENV_TMP}"
touch "${ENV_TMP}"
chmod 600 "${ENV_TMP}"

python3 - "${SSM_PREFIX}" "${AWS_REGION}" "${ENV_TMP}" <<'PYEOF'
import json
import subprocess
import sys

prefix, region, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
params = []
next_token = None

while True:
    cmd = [
        "aws", "ssm", "get-parameters-by-path",
        "--path", prefix,
        "--recursive",
        "--with-decryption",
        "--region", region,
        "--output", "json",
    ]
    if next_token:
        cmd.extend(["--next-token", next_token])
    raw = subprocess.check_output(cmd, text=True)
    data = json.loads(raw)
    params.extend(data.get("Parameters", []))
    next_token = data.get("NextToken")
    if not next_token:
        break

with open(out_path, "w", encoding="utf-8") as f:
    for p in sorted(params, key=lambda x: x["Name"]):
        key = p["Name"][len(prefix):].strip("/")
        val = p["Value"].replace("\r\n", "\n").replace("\n", "\\n")
        f.write(f"{key}={val}\n")

print(f"Loaded {len(params)} parameters into {out_path}")
PYEOF

mv "${ENV_TMP}" "${ENV_FILE}"

if [[ -f "${STATE_DIR}/.current_tag" ]]; then
  cp "${STATE_DIR}/.current_tag" "${STATE_DIR}/.previous_tag"
fi

export ENV_NAME IMAGE_TAG ECR_REGISTRY AWS_REGION DOMAIN_NAME
export CERT_DOMAIN="${DOMAIN_NAME}"
export BACKEND_PORT CUSTOMER_PORT INTERNAL_PORT ENV_FILE

echo "==> [${ENV_NAME}] Logging in to ECR (${ECR_REGISTRY})..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"

echo "==> [${ENV_NAME}] Pulling images for tag ${IMAGE_TAG}..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" pull

# Protect low-memory hosts (<2600 MB RAM, e.g. t3.small) from running prod + staging concurrently
HOST_MEM_MB="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)"
if [[ "${ENV_NAME}" == "prod" && "${HOST_MEM_MB}" -gt 0 && "${HOST_MEM_MB}" -lt 2600 && "${ALLOW_SHARED_LOW_MEM_HOST:-false}" != "true" ]]; then
  if docker ps --format '{{.Names}}' | grep -q '^car-service-staging'; then
    echo "==> [prod] Host RAM is ${HOST_MEM_MB}MB (<2600MB); stopping car-service-staging to prevent swap thrashing/OOM..."
    docker compose -f "${COMPOSE_FILE}" -p "car-service-staging" down || true
  fi
fi

echo "==> [${ENV_NAME}] Running Prisma database migrations..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" run --rm --no-deps backend node ./node_modules/prisma/build/index.js migrate deploy

PROFILE_ARGS=()
if [[ "${ENV_NAME}" == "prod" ]]; then
  if [[ -f "/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" ]]; then
    PROFILE_ARGS=(--profile proxy)
  else
    echo "WARNING: SSL cert /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem not found; starting prod without nginx proxy profile." >&2
  fi
fi

echo "==> [${ENV_NAME}] Starting containers..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" "${PROFILE_ARGS[@]}" up -d --remove-orphans

if [[ "${ENV_NAME}" == "staging" ]]; then
  NGINX_CONTAINER="$(docker ps --format '{{.Names}}' | grep '^car-service-prod-nginx' | head -n1 || true)"
  if [[ -n "${NGINX_CONTAINER}" ]]; then
    echo "==> [staging] Refreshing nginx config from updated template..."
    docker exec "${NGINX_CONTAINER}" sh -c 'cp /etc/nginx/conf.d/app.conf /tmp/app.conf.bak 2>/dev/null || true; envsubst "\$DOMAIN_NAME \$CERT_DOMAIN" < /etc/nginx/templates/app.conf.template > /etc/nginx/conf.d/app.conf && nginx -t && nginx -s reload || { cp /tmp/app.conf.bak /etc/nginx/conf.d/app.conf 2>/dev/null || true; exit 1; }'
  fi
fi

echo "==> [${ENV_NAME}] Running health checks (timeout 60s)..."
healthy=false
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
    customer_code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${CUSTOMER_PORT}/" || echo "000")
    internal_code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${INTERNAL_PORT}/" || echo "000")
    if [[ "${customer_code}" =~ ^[234][0-9]{2}$ && "${internal_code}" =~ ^[234][0-9]{2}$ ]]; then
      healthy=true
      echo "==> [${ENV_NAME}] Healthy on attempt ${i}/30 (backend=200, customer=${customer_code}, internal=${internal_code})"
      break
    fi
  fi
  sleep 2
done

if [[ "${healthy}" == "true" ]]; then
  printf '%s\n' "${IMAGE_TAG}" > "${STATE_DIR}/.current_tag"
  echo "==> [${ENV_NAME}] Deploy succeeded (${IMAGE_TAG})"
  exit 0
fi

echo "ERROR: [${ENV_NAME}] Health check failed after 60s!" >&2
if [[ -s "${STATE_DIR}/.previous_tag" ]]; then
  PREV_TAG="$(cat "${STATE_DIR}/.previous_tag")"
  echo "==> [${ENV_NAME}] Auto-rolling back to previous tag ${PREV_TAG}..." >&2
  export IMAGE_TAG="${PREV_TAG}"
  docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" "${PROFILE_ARGS[@]}" up -d --remove-orphans || true
else
  echo "WARNING: No .previous_tag found for auto-rollback." >&2
fi

exit 1
