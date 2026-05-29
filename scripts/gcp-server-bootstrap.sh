#!/bin/bash
# HANCR — Server bootstrap for GCP VM (Ubuntu 22.04)
set -e

echo "═══════════════════════════════════════════════════"
echo "  HANCR — Server Setup (Google Cloud)"
echo "═══════════════════════════════════════════════════"

# ─── 1. System update ───
echo "[1/8] System update..."
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

# ─── 2. Essential tools ───
echo "[2/8] Installing essential tools..."
sudo apt-get install -y -qq \
    curl wget git \
    ufw fail2ban \
    htop \
    ca-certificates gnupg lsb-release \
    apt-transport-https \
    postgresql-client-14 \
    jq

# ─── 3. Docker ───
if ! command -v docker &> /dev/null; then
    echo "[3/8] Installing Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✓ Docker installed"
else
    echo "[3/8] ✓ Docker already installed"
fi

# ─── 4. Node 20 (للـ migrations CLI) ───
if ! command -v node &> /dev/null || [[ $(node --version | cut -c2-3) -lt 20 ]]; then
    echo "[4/8] Installing Node 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - > /dev/null 2>&1
    sudo apt-get install -y -qq nodejs
fi
echo "✓ Node $(node --version)"

# ─── 5. Firewall (UFW) ───
echo "[5/8] Configuring firewall..."
sudo ufw --force reset > /dev/null
sudo ufw default deny incoming > /dev/null
sudo ufw default allow outgoing > /dev/null
sudo ufw allow 22/tcp comment 'SSH' > /dev/null
sudo ufw allow 80/tcp comment 'HTTP' > /dev/null
sudo ufw allow 443/tcp comment 'HTTPS' > /dev/null
sudo ufw --force enable > /dev/null
echo "✓ UFW enabled (22, 80, 443)"

# ─── 6. fail2ban ───
echo "[6/8] Configuring fail2ban..."
sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
EOF
sudo systemctl enable fail2ban > /dev/null 2>&1
sudo systemctl restart fail2ban
echo "✓ fail2ban active"

# ─── 7. Docker log rotation ───
echo "[7/8] Docker log rotation..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
EOF
sudo systemctl restart docker

# ─── 8. Project directory ───
echo "[8/8] Setting up /opt/hancr..."
sudo mkdir -p /opt/hancr
sudo chown -R $USER:$USER /opt/hancr

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✓ Server setup complete!"
echo "═══════════════════════════════════════════════════"
echo "  Docker: $(docker --version)"
echo "  Node:   $(node --version)"
echo "  User:   $USER"
echo "  Dir:    /opt/hancr (owner: $USER)"
echo "═══════════════════════════════════════════════════"
