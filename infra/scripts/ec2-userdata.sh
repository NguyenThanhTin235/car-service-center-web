#!/bin/bash
set -euxo pipefail

# Configure 2GB swapfile for t3.small memory headroom
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=128M count=16
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
fi

# Install Docker, Docker Compose v2, and Amazon CloudWatch Agent
dnf update -y
dnf install -y docker amazon-cloudwatch-agent
systemctl enable --now docker
usermod -aG docker ec2-user || true

mkdir -p /usr/local/lib/docker/cli-plugins
if ! dnf install -y docker-compose-plugin 2>/dev/null; then
  ARCH=$(uname -m)
  curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${ARCH}" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# Create application directories for staging and production
mkdir -p /opt/car-service/staging /opt/car-service/prod
chown -R ec2-user:ec2-user /opt/car-service

# Start Amazon CloudWatch Agent
systemctl enable amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start || systemctl start amazon-cloudwatch-agent
