#!/bin/bash
# =============================================
# HANCR — Production Server Setup Script
#
# يُشغَّل مرَّة واحدة على سيرفر Ubuntu 22.04 جديد لتجهيزه للنشر.
#
# الاستخدام:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_USER/hancr/main/scripts/server-setup.sh | sudo bash
#   أو:
#   wget -O setup.sh https://...; chmod +x setup.sh; sudo ./setup.sh
#
# ما يفعله:
#   1. تحديث النظام + تثبيت Docker + Compose
#   2. تثبيت أدوات (git, curl, ufw, fail2ban, htop)
#   3. إنشاء user `hancr` غير root + إعداد SSH key
#   4. ضبط firewall (UFW)
#   5. تفعيل fail2ban
#   6. ضبط swap لو الـ RAM < 8GB
#   7. تحسين Docker logging (rotation)
#   8. تجهيز مجلد /opt/hancr
#   9. تثبيت Node 20 (للـ migrations CLI)
#  10. إعداد cron للـ backups
#
# Safety: idempotent — يمكن إعادة تشغيله بأمان.
# =============================================

set -e # exit on any error
set -u # error on unset variables

# ─── الألوان ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # no color

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok()  { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err() { echo -e "${RED}✗${NC} $1" >&2; }

# ─── الـ root check ───
if [[ $EUID -ne 0 ]]; then
    err "هذا السكريبت يحتاج صلاحيات root. شغِّله بـ sudo."
    exit 1
fi

# ─── الـ OS check ───
if ! grep -q "Ubuntu" /etc/os-release; then
    err "هذا السكريبت مُصمَّم لـ Ubuntu. النظام الحالي غير مدعوم."
    exit 1
fi

UBUNTU_VERSION=$(grep VERSION_ID /etc/os-release | cut -d'"' -f2)
log "Ubuntu ${UBUNTU_VERSION} detected"

# ═══════════════════════════════════════════════════════════════
# 1. System update
# ═══════════════════════════════════════════════════════════════
log "تحديث النظام..."
apt-get update -qq
apt-get upgrade -y -qq
ok "النظام مُحدَّث"

# ═══════════════════════════════════════════════════════════════
# 2. Install essential tools
# ═══════════════════════════════════════════════════════════════
log "تثبيت الأدوات الأساسية..."
apt-get install -y -qq \
    curl wget git \
    ufw fail2ban \
    htop iotop \
    unzip \
    ca-certificates gnupg lsb-release \
    apt-transport-https software-properties-common \
    jq \
    postgresql-client-14 \
    > /dev/null
ok "الأدوات الأساسية مُثبَّتة"

# ═══════════════════════════════════════════════════════════════
# 3. Install Docker + Docker Compose
# ═══════════════════════════════════════════════════════════════
if ! command -v docker &> /dev/null; then
    log "تثبيت Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null
    systemctl enable docker
    systemctl start docker
    ok "Docker مُثبَّت ($(docker --version | head -c 30))"
else
    ok "Docker مُثبَّت مسبقاً ($(docker --version | head -c 30))"
fi

# ═══════════════════════════════════════════════════════════════
# 4. Install Node.js 20 (للـ migrations CLI فقط)
# ═══════════════════════════════════════════════════════════════
if ! command -v node &> /dev/null || [[ $(node --version | cut -c2-3) -lt 20 ]]; then
    log "تثبيت Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs > /dev/null
    ok "Node $(node --version) مُثبَّت"
else
    ok "Node $(node --version) موجود"
fi

# ═══════════════════════════════════════════════════════════════
# 5. Create hancr user
# ═══════════════════════════════════════════════════════════════
if ! id -u hancr &> /dev/null; then
    log "إنشاء user 'hancr'..."
    useradd -m -s /bin/bash hancr
    usermod -aG docker hancr
    usermod -aG sudo hancr
    # SSH keys
    mkdir -p /home/hancr/.ssh
    chmod 700 /home/hancr/.ssh
    # نسخ authorized_keys من root لو موجود
    if [[ -f /root/.ssh/authorized_keys ]]; then
        cp /root/.ssh/authorized_keys /home/hancr/.ssh/authorized_keys
        chmod 600 /home/hancr/.ssh/authorized_keys
        chown -R hancr:hancr /home/hancr/.ssh
        ok "User 'hancr' أُنشئ + SSH keys منقولة"
    else
        warn "User 'hancr' أُنشئ لكن لا يوجد SSH keys. أضفها يدوياً في /home/hancr/.ssh/authorized_keys"
    fi
else
    ok "User 'hancr' موجود مسبقاً"
fi

# ═══════════════════════════════════════════════════════════════
# 6. Firewall (UFW)
# ═══════════════════════════════════════════════════════════════
log "إعداد Firewall..."
ufw --force reset > /dev/null
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null
ufw allow 22/tcp comment 'SSH' > /dev/null
ufw allow 80/tcp comment 'HTTP' > /dev/null
ufw allow 443/tcp comment 'HTTPS' > /dev/null
ufw --force enable > /dev/null
ok "UFW مُفعَّل (22, 80, 443 مفتوحة)"

# ═══════════════════════════════════════════════════════════════
# 7. fail2ban (حماية SSH من brute force)
# ═══════════════════════════════════════════════════════════════
log "إعداد fail2ban..."
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOF
systemctl enable fail2ban > /dev/null
systemctl restart fail2ban
ok "fail2ban مُفعَّل (5 محاولات → ban ساعة)"

# ═══════════════════════════════════════════════════════════════
# 8. Swap setup (للـ servers بـ RAM < 8GB)
# ═══════════════════════════════════════════════════════════════
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/ {print $2}')
if [[ $TOTAL_RAM_MB -lt 8000 ]] && [[ ! -f /swapfile ]]; then
    log "إنشاء swap file (RAM = ${TOTAL_RAM_MB}MB)..."
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile > /dev/null
    swapon /swapfile
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    sysctl -p > /dev/null
    ok "Swap 4GB مُفعَّل"
elif [[ -f /swapfile ]]; then
    ok "Swap موجود مسبقاً"
else
    ok "RAM كافٍ (${TOTAL_RAM_MB}MB) — لا حاجة لـ swap"
fi

# ═══════════════════════════════════════════════════════════════
# 9. Docker logging rotation (لمنع امتلاء الـ disk)
# ═══════════════════════════════════════════════════════════════
log "إعداد Docker log rotation..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker
ok "Docker logging: max 10MB × 3 files per container"

# ═══════════════════════════════════════════════════════════════
# 10. Project directory
# ═══════════════════════════════════════════════════════════════
log "إعداد /opt/hancr..."
mkdir -p /opt/hancr
mkdir -p /opt/hancr/backups
chown -R hancr:hancr /opt/hancr
ok "/opt/hancr جاهز"

# ═══════════════════════════════════════════════════════════════
# 11. Backup script
# ═══════════════════════════════════════════════════════════════
log "إنشاء سكريبت backup..."
cat > /opt/hancr/scripts/backup-db.sh <<'BACKUP_EOF'
#!/bin/bash
# HANCR — Daily DB Backup
set -e

BACKUP_DIR=/opt/hancr/backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
FILE="hancr_${DATE}.sql.gz"

cd /opt/hancr

docker compose -f docker/docker-compose.prod.yml exec -T postgres \
    pg_dump -U "${DATABASE_USER:-hancr_prod}" "${DATABASE_NAME:-hancr_prod}" | gzip > "$BACKUP_DIR/$FILE"

# احتفظ بآخر 30 يوم فقط
find $BACKUP_DIR -name "hancr_*.sql.gz" -mtime +30 -delete

echo "[$(date)] Backup created: $BACKUP_DIR/$FILE ($(du -h $BACKUP_DIR/$FILE | cut -f1))"

# Upload to S3 (اختياري — أضف AWS creds)
# aws s3 cp "$BACKUP_DIR/$FILE" "s3://hancr-backups/db/"
BACKUP_EOF
mkdir -p /opt/hancr/scripts
mv /opt/hancr/scripts/backup-db.sh /opt/hancr/scripts/backup-db.sh.tmp 2>/dev/null || true
chmod +x /opt/hancr/scripts/backup-db.sh 2>/dev/null || true
chown -R hancr:hancr /opt/hancr/scripts
ok "Backup script في /opt/hancr/scripts/backup-db.sh"

# Cron للـ backup يومياً الساعة 3 صباحاً
(crontab -u hancr -l 2>/dev/null | grep -v 'backup-db.sh'; \
 echo "0 3 * * * /opt/hancr/scripts/backup-db.sh >> /opt/hancr/backups/backup.log 2>&1") | crontab -u hancr -
ok "Cron: backup يومياً الساعة 3:00 صباحاً"

# ═══════════════════════════════════════════════════════════════
# 12. SSH hardening
# ═══════════════════════════════════════════════════════════════
log "تشديد SSH..."
SSH_CONFIG=/etc/ssh/sshd_config
cp $SSH_CONFIG $SSH_CONFIG.backup-$(date +%s)

sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' $SSH_CONFIG
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' $SSH_CONFIG
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' $SSH_CONFIG
sed -i 's/^#*X11Forwarding.*/X11Forwarding no/' $SSH_CONFIG

systemctl restart sshd
ok "SSH: PasswordAuth معطَّل، فقط SSH keys"
warn "تأكَّد من أن SSH keys تعمل قبل تسجيل الخروج!"

# ═══════════════════════════════════════════════════════════════
# 13. Summary
# ═══════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ HANCR Server Setup مكتمل!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "الخطوات التالية:"
echo ""
echo "  1. سجِّل دخول كـ hancr:"
echo "     ssh hancr@$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""
echo "  2. Clone المشروع:"
echo "     cd /opt/hancr"
echo "     git clone https://github.com/YOUR_USERNAME/hancr.git ."
echo ""
echo "  3. إعداد .env.prod:"
echo "     cp .env.prod.example .env.prod"
echo "     nano .env.prod"
echo ""
echo "  4. أول build:"
echo "     docker compose -f docker/docker-compose.prod.yml --env-file .env.prod build"
echo "     docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d"
echo ""
echo "  5. تطبيق migrations:"
echo "     cd /opt/hancr && npm install --legacy-peer-deps"
echo "     TS_NODE_PROJECT=tsconfig.base.json npx typeorm-ts-node-commonjs migration:run -d libs/database/src/lib/data-source.ts"
echo ""
echo "  معلومات مفيدة:"
echo "    - تكوين Firewall: ufw status"
echo "    - Docker containers: docker ps"
echo "    - Logs: docker compose logs -f"
echo "    - Backup يدوي: /opt/hancr/scripts/backup-db.sh"
echo ""
echo "════════════════════════════════════════════════════════════"
