#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Qatar Traffic Violations — One-shot deploy script
#  Runs ON the EC2 server (fees2 · 16.170.158.159)
#
#  Usage:
#    chmod +x deploy.sh
#    ./deploy.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_DIR="$HOME/qatar"
REPO_URL="https://github.com/AlfaizFlipr/Qatar-Traffic.git"   # update if private

# ── 1. System packages ──────────────────────────────────────
echo "▶ Installing system packages..."
sudo apt-get update -y
sudo apt-get install -y \
  ca-certificates curl gnupg lsb-release git ufw

# ── 2. Docker (official repo) ───────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "▶ Installing Docker..."
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

  # Run docker without sudo
  sudo usermod -aG docker "$USER"
  echo "WARNING: Docker installed. You may need to log out and back in for group changes."
else
  echo "Docker already installed."
fi

# ── 3. Clone / pull project ─────────────────────────────────
if [ -d "$PROJECT_DIR/.git" ]; then
  echo "▶ Pulling latest code..."
  git -C "$PROJECT_DIR" pull
else
  echo "▶ Cloning repo..."
  git clone "$REPO_URL" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# ── 4. Ensure .env.production exists ────────────────────────
if [ ! -f backend/.env.production ]; then
  echo ""
  echo "ACTION REQUIRED: backend/.env.production not found!"
  echo "  cp backend/.env.production.example backend/.env.production"
  echo "  nano backend/.env.production"
  exit 1
fi

# ── 5. Firewall ─────────────────────────────────────────────
echo "▶ Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# ── 6. Build & start containers ─────────────────────────────
echo "▶ Building and starting Docker containers..."
docker compose pull --ignore-buildable 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

echo ""
echo "Containers started. Status:"
docker compose ps
echo ""
echo "Next step: run certbot to get SSL certificates (see deployment guide)."
