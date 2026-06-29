#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Qatar Traffic Violations — One-shot deploy script
#  Runs ON the EC2 server (fees2 · 16.170.158.159)
#
#  Usage:
#    chmod +x deploy.sh
#    ./deploy.sh
#
#  VPN PRE-REQUISITE (do once before first deploy):
#    1. Get a free VPNjantit account at https://www.vpnjantit.com
#    2. Download a Qatar (QA) or UAE (AE) OpenVPN config
#    3. Place it at $PROJECT_DIR/vpn/server.ovpn
#    4. Export credentials:
#         export OPENVPN_USER=your_vpnjantit_username
#         export OPENVPN_PASSWORD=your_vpnjantit_password
#    5. Re-run this script — the gluetun container will handle the tunnel.
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

# ── 6. Enable /dev/net/tun for gluetun VPN container ────────
echo "▶ Ensuring /dev/net/tun exists (required by gluetun VPN)..."
if [ ! -c /dev/net/tun ]; then
  sudo mkdir -p /dev/net
  sudo mknod /dev/net/tun c 10 200
  sudo chmod 600 /dev/net/tun
fi

# ── 7. Root .env for docker-compose variable substitution ───
# If root .env doesn't exist, pull VPN credentials from backend/.env.production
if [ ! -f "$PROJECT_DIR/.env" ] && [ -f "$PROJECT_DIR/backend/.env.production" ]; then
  echo "▶ Creating root .env from backend/.env.production..."
  OVPN_USER=$(grep "^OPENVPN_USER=" "$PROJECT_DIR/backend/.env.production" 2>/dev/null | cut -d= -f2- || true)
  OVPN_PASS=$(grep "^OPENVPN_PASSWORD=" "$PROJECT_DIR/backend/.env.production" 2>/dev/null | cut -d= -f2- || true)
  if [ -n "$OVPN_USER" ] && [ -n "$OVPN_PASS" ]; then
    printf "OPENVPN_USER=%s\nOPENVPN_PASSWORD=%s\n" "$OVPN_USER" "$OVPN_PASS" > "$PROJECT_DIR/.env"
    echo "  Root .env created with VPN credentials."
  fi
fi

# ── 8. VPN config check ─────────────────────────────────────
if [ ! -f "$PROJECT_DIR/vpn/server.ovpn" ]; then
  echo ""
  echo "WARNING: vpn/server.ovpn not found!"
  echo "  The scraper will NOT work without a VPN (MOI portal requires a Qatar/UAE IP)."
  echo ""
  echo "  To fix:"
  echo "    1. Get a free account at https://www.vpnjantit.com"
  echo "    2. Download a Qatar (QA) or UAE (AE) OpenVPN config"
  echo "    3. Copy it:  cp your-config.ovpn $PROJECT_DIR/vpn/server.ovpn"
  echo "    4. Export:   export OPENVPN_USER=<username> OPENVPN_PASSWORD=<password>"
  echo "    5. Re-run:   ./deploy.sh"
  echo ""
  echo "  Continuing deploy (other services will still start)..."
fi

# ── 9. Build & start containers ─────────────────────────────
echo "▶ Building and starting Docker containers..."
docker compose pull --ignore-buildable 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

echo ""
echo "Containers started. Status:"
docker compose ps
echo ""
echo "To check VPN tunnel:  docker logs qatar_gluetun"
echo "Next step: run certbot to get SSL certificates (see deployment guide)."
