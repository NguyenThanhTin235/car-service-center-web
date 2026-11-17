#!/usr/bin/env bash
set -euo pipefail

DOMAIN_NAME="${1:-${DOMAIN_NAME:-carservice.id.vn}}"
CERTBOT_EMAIL="${2:-${CERTBOT_EMAIL:-admin@${DOMAIN_NAME}}}"
WEBROOT_DIR="/var/www/certbot"

DOMAINS=(
  "${DOMAIN_NAME}"
  "api.${DOMAIN_NAME}"
  "admin.${DOMAIN_NAME}"
  "staging.${DOMAIN_NAME}"
  "staging-api.${DOMAIN_NAME}"
  "staging-admin.${DOMAIN_NAME}"
)

DOMAIN_ARGS=()
for d in "${DOMAINS[@]}"; do
  DOMAIN_ARGS+=(-d "${d}")
done

sudo mkdir -p "${WEBROOT_DIR}" /etc/letsencrypt

if ! command -v certbot >/dev/null 2>&1; then
  echo "ERROR: certbot is not installed. On Amazon Linux 2023, install with: sudo dnf install -y certbot" >&2
  exit 1
fi

echo "==> Requesting Let's Encrypt certificate for: ${DOMAINS[*]}"

if docker ps --format '{{.Names}}' | grep -q '^car-service-prod-nginx'; then
  echo "==> Detected running prod nginx; using --webroot (${WEBROOT_DIR})..."
  sudo certbot certonly \
    --webroot \
    -w "${WEBROOT_DIR}" \
    --email "${CERTBOT_EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --expand \
    "${DOMAIN_ARGS[@]}"

  echo "==> Reloading prod nginx..."
  NGINX_CONTAINER="$(docker ps --format '{{.Names}}' | grep '^car-service-prod-nginx' | head -n1)"
  docker exec "${NGINX_CONTAINER}" nginx -s reload
else
  echo "==> No running prod nginx detected; using --standalone on port 80..."
  sudo certbot certonly \
    --standalone \
    --email "${CERTBOT_EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --expand \
    "${DOMAIN_ARGS[@]}"
fi

echo "==> Certificate issued at /etc/letsencrypt/live/${DOMAIN_NAME}/"
echo "    Set up auto-renewal cron/systemd timer, e.g.:"
echo "    0 3 * * * certbot renew --quiet --webroot -w ${WEBROOT_DIR} --deploy-hook \"docker exec car-service-prod-nginx-1 nginx -s reload || true\""
