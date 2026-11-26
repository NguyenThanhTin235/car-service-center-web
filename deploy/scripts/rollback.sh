#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-${ENV_NAME:-}}"
TARGET_TAG="${2:-${TARGET_TAG:-}}"
ECR_REGISTRY="${3:-${ECR_REGISTRY:-}}"
AWS_REGION="${4:-${AWS_REGION:-ap-southeast-1}}"
DOMAIN_NAME="${5:-${DOMAIN_NAME:-carservice.id.vn}}"

if [[ "${ENV_NAME}" != "prod" && "${ENV_NAME}" != "staging" ]]; then
  echo "ERROR: ENV_NAME must be 'prod' or 'staging' (got '${ENV_NAME}')" >&2
  exit 1
fi

STATE_DIR="/opt/car-service/${ENV_NAME}"
ENV_FILE="${STATE_DIR}/.env.runtime"

if [[ -z "${TARGET_TAG}" ]]; then
  if [[ -s "${STATE_DIR}/.previous_tag" ]]; then
    TARGET_TAG="$(cat "${STATE_DIR}/.previous_tag")"
  else
    echo "ERROR: TARGET_TAG not provided and ${STATE_DIR}/.previous_tag does not exist." >&2
    exit 1
  fi
fi

if [[ -z "${ECR_REGISTRY}" ]]; then
  echo "ERROR: ECR_REGISTRY is required" >&2
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

export ENV_NAME IMAGE_TAG="${TARGET_TAG}"
export ECR_REGISTRY AWS_REGION DOMAIN_NAME
export CERT_DOMAIN="${DOMAIN_NAME}"
export BACKEND_PORT CUSTOMER_PORT INTERNAL_PORT ENV_FILE

echo "==> [${ENV_NAME}] Logging in to ECR (${ECR_REGISTRY})..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"

echo "==> [${ENV_NAME}] Pulling images for rollback tag ${TARGET_TAG}..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" pull

PROFILE_ARGS=()
if [[ "${ENV_NAME}" == "prod" && -f "/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" ]]; then
  PROFILE_ARGS=(--profile proxy)
fi

echo "==> [${ENV_NAME}] Rolling back to tag ${TARGET_TAG}..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" "${PROFILE_ARGS[@]}" up -d --remove-orphans

if [[ "${ENV_NAME}" == "staging" ]]; then
  NGINX_CONTAINER="$(docker ps --format '{{.Names}}' | grep '^car-service-prod-nginx' | head -n1 || true)"
  if [[ -n "${NGINX_CONTAINER}" ]]; then
    echo "==> [staging] Refreshing nginx config from updated template..."
    docker exec "${NGINX_CONTAINER}" sh -c 'cp /etc/nginx/conf.d/app.conf /tmp/app.conf.bak 2>/dev/null || true; envsubst "\$DOMAIN_NAME \$CERT_DOMAIN" < /etc/nginx/templates/app.conf.template > /etc/nginx/conf.d/app.conf && nginx -t && nginx -s reload || { cp /tmp/app.conf.bak /etc/nginx/conf.d/app.conf 2>/dev/null || true; exit 1; }'
  fi
fi

echo "==> [${ENV_NAME}] Running health checks (timeout 60s)..."
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
    customer_code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${CUSTOMER_PORT}/" || echo "000")
    internal_code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${INTERNAL_PORT}/" || echo "000")
    if [[ "${customer_code}" =~ ^[234][0-9]{2}$ && "${internal_code}" =~ ^[234][0-9]{2}$ ]]; then
      printf '%s\n' "${TARGET_TAG}" > "${STATE_DIR}/.current_tag"
      echo "==> [${ENV_NAME}] Rollback to ${TARGET_TAG} succeeded on attempt ${i}/30 (backend=200, customer=${customer_code}, internal=${internal_code})."
      exit 0
    fi
  fi
  sleep 2
done

echo "ERROR: [${ENV_NAME}] Rollback health check failed after 60s!" >&2
exit 1
