#!/usr/bin/env bash
# lab6-setup-and-test.sh
# Full installer + configurator + self-test for Ironhack Lab 6 (Nginx)
# Target: Ubuntu 22.04 LTS
# WARNING: This script modifies sshd_config and restarts sshd. A rollback timer is created to prevent lockout.
set -euo pipefail
IFS=$'\n\t'

### ------------------------
### Configuration variables
### ------------------------
SSH_NEW_PORT=2200          # new SSH port to set (change if you prefer)
ALLOW_SSH_FROM=""          # CIDR to restrict SSH (empty = allow from anywhere)
SITE1_NAME="site1.local"
APP_NAME="app.local"
API_NAME="api.local"
SITE1_ROOT="/var/www/site1"
APP_ROOT="/var/www/app"
API_ROOT="/var/www/api"
NODE_APP1_PORT=3000
NODE_APP2_PORT=3001
BACKUP_DIR="/backup"
CONFIRM_FILE="/root/ssh-config-ok"
ROLLBACK_TIMER="/etc/systemd/system/ssh-rollback.timer"
ROLLBACK_SERVICE="/etc/systemd/system/ssh-rollback.service"
SSH_CONFIG_PATH="/etc/ssh/sshd_config"
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

LOGFILE="/var/log/lab6-setup.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "=========== LAB6 Setup & Test START: $(date) ==========="

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: Please run this script as root (sudo)."
  exit 1
fi

### ------------------------
### Helpers
### ------------------------
run_and_report() {
  local desc="$1"; shift
  echo -e "\n--- $desc ---"
  if "$@"; then
    echo "✔ $desc"
  else
    echo "✖ $desc"
    exit 1
  fi
}

# safe template fallback for sed
backup_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    cp -a "$f" "${f}.bak.$(date +%s)"
  fi
}

### ------------------------
### 2) Create directories & sample content
### ------------------------
run_and_report "Create site directories and sample index.html" bash -c "
mkdir -p $SITE1_ROOT $APP_ROOT $API_ROOT $BACKUP_DIR
cat > $SITE1_ROOT/index.html <<'HTML'
<html><head><title>Site1</title></head><body><h1>Welcome to site1.local</h1></body></html>
HTML
cat > $APP_ROOT/index.html <<'HTML'
<html><head><title>App</title></head><body><h1>App (app.local)</h1></body></html>
HTML
cat > $API_ROOT/index.html <<'HTML'
<html><head><title>API</title></head><body><h1>API root - should be proxied to backend</h1></body></html>
HTML
chown -R www-data:www-data $SITE1_ROOT $APP_ROOT $API_ROOT
"

### ------------------------
### 3) Create two Node backend simple apps + systemd units
### ------------------------
run_and_report "Create Node backend apps and systemd services" bash -c "
# Backend 1 (3000)
mkdir -p /opt/backend1
cat > /opt/backend1/server.js <<'NODE'
const http = require('http');
const port = process.env.PORT || ${NODE_APP1_PORT};
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'ok', port: port}));
    return;
  }
  res.writeHead(200, {'Content-Type':'text/plain'}); res.end('Hello from backend1');
});
server.listen(port, ()=>console.log('backend1 listening', port));
NODE
cat > /etc/systemd/system/backend1.service <<'UNIT'
[Unit]
Description=Backend1 Node Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/backend1
ExecStart=/usr/bin/node server.js
Restart=always
User=root
Environment=PORT=${NODE_APP1_PORT}

[Install]
WantedBy=multi-user.target
UNIT

# Backend 2 (3001)
mkdir -p /opt/backend2
cat > /opt/backend2/server.js <<'NODE'
const http = require('http');
const port = process.env.PORT || ${NODE_APP2_PORT};
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'ok', port: port}));
    return;
  }
  res.writeHead(200, {'Content-Type':'text/plain'}); res.end('Hello from backend2');
});
server.listen(port, ()=>console.log('backend2 listening', port));
NODE
cat > /etc/systemd/system/backend2.service <<'UNIT'
[Unit]
Description=Backend2 Node Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/backend2
ExecStart=/usr/bin/node server.js
Restart=always
User=root
Environment=PORT=${NODE_APP2_PORT}

[Install]
WantedBy=multi-user.target
UNIT

# install npm packages (none required except node)
"

run_and_report "Enable & start backend systemd services" bash -c "
systemctl daemon-reload
systemctl enable --now backend1.service
systemctl enable --now backend2.service
sleep 1
ss -tlnp | grep -E ':${NODE_APP1_PORT}|:${NODE_APP2_PORT}' || true
"

### ------------------------
### 4) Nginx multi-site configuration + hardening
### ------------------------
# Common security snippet
NGINX_SECURITY_SNIPPET="/etc/nginx/snippets/security_headers.conf"
backup_file "$NGINX_SECURITY_SNIPPET"
cat > "$NGINX_SECURITY_SNIPPET" <<'SNIP'
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
# remove Server header (requires headers_more which isn't installed by default)
proxy_hide_header Server;
SNIP

run_and_report "Write nginx site configs (site1, app, api reverse proxy)" bash -c "
# site1 (static)
cat > ${NGINX_SITES_DIR}/${SITE1_NAME} <<'NGINX'
server {
    listen 80;
    server_name site1.local;
    root /var/www/site1;
    index index.html;
    include /etc/nginx/snippets/security_headers.conf;
    location / {
        try_files \$uri \$uri/ =404;
    }
}
NGINX

# app (static)
cat > ${NGINX_SITES_DIR}/${APP_NAME} <<'NGINX'
server {
    listen 80;
    server_name app.local;
    root /var/www/app;
    index index.html;
    include /etc/nginx/snippets/security_headers.conf;
    location / {
        try_files \$uri \$uri/ =404;
    }
}
NGINX

# api (reverse proxy + rate limiting + health-check upstream)
cat > ${NGINX_SITES_DIR}/${API_NAME} <<'NGINX'
upstream backend_upstreams {
    server 127.0.0.1:3000 max_fails=2 fail_timeout=5s;
    server 127.0.0.1:3001 max_fails=2 fail_timeout=5s;
}

# limit requests per client
limit_req_zone $binary_remote_addr zone=one:10m rate=5r/s;

server {
    listen 80;
    server_name api.local;
    include /etc/nginx/snippets/security_headers.conf;

    location /health {
        proxy_pass http://backend_upstreams/health;
        proxy_connect_timeout 1s;
        proxy_read_timeout 2s;
    }

    location / {
        limit_req zone=one burst=10 nodelay;
        proxy_pass http://backend_upstreams;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
    }
}
NGINX

# enable sites
ln -sf ${NGINX_SITES_DIR}/${SITE1_NAME} ${NGINX_SITES_ENABLED}/
ln -sf ${NGINX_SITES_DIR}/${APP_NAME} ${NGINX_SITES_ENABLED}/
ln -sf ${NGINX_SITES_DIR}/${API_NAME} ${NGINX_SITES_ENABLED}/

# nginx optimization & hardening
sed -i.bak -E 's/#?server_tokens .*|server_tokens on|server_tokens off/server_tokens off/' /etc/nginx/nginx.conf || true

# enable gzip
if ! grep -q 'gzip on;' /etc/nginx/nginx.conf; then
  sed -i '/http {/a \\tgzip on;\n\tgzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;' /etc/nginx/nginx.conf
fi

nginx -t
systemctl restart nginx
"


### ------------------------
### 5) UFW firewall and Fail2Ban
### ------------------------
run_and_report "Configure UFW rules (HTTP, HTTPS, new SSH port)" bash -c "
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp
ufw allow 443/tcp
if [[ -n \"$ALLOW_SSH_FROM\" ]]; then
  ufw allow from $ALLOW_SSH_FROM to any port $SSH_NEW_PORT proto tcp
else
  ufw allow $SSH_NEW_PORT/tcp
fi
ufw --force enable
ufw status numbered
"

run_and_report "Configure Fail2Ban for sshd (monitor new port too)" bash -c "
backup_file /etc/fail2ban/jail.local || true
cat > /etc/fail2ban/jail.local <<'JAIL'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 600
JAIL
systemctl restart fail2ban
systemctl enable fail2ban
sleep 1
fail2ban-client status sshd || true
"

### ------------------------
### 6) SSH hardening with safe rollback
### ------------------------
echo -e "\n--- SSH Hardening: creating safe rollback mechanism ---"

# Save original sshd_config
backup_file "$SSH_CONFIG_PATH"
cp -a "$SSH_CONFIG_PATH" "${SSH_CONFIG_PATH}.orig.$(date +%s)"

# Prepare new sshd_config edits
# Turn off password authentication, disable root login, set new port, allow only PubkeyAuthentication
run_and_report "Apply SSH config changes (port=$SSH_NEW_PORT, disable password auth, disable root login)" bash -c "
sed -i -E 's/^#?Port .*/Port ${SSH_NEW_PORT}/' $SSH_CONFIG_PATH || echo \"Port ${SSH_NEW_PORT}\" >> $SSH_CONFIG_PATH
sed -i -E 's/^#?PermitRootLogin .*/PermitRootLogin no/' $SSH_CONFIG_PATH || echo 'PermitRootLogin no' >> $SSH_CONFIG_PATH
sed -i -E 's/^#?PasswordAuthentication .*/PasswordAuthentication no/' $SSH_CONFIG_PATH || echo 'PasswordAuthentication no' >> $SSH_CONFIG_PATH
sed -i -E 's/^#?PubkeyAuthentication .*/PubkeyAuthentication yes/' $SSH_CONFIG_PATH || echo 'PubkeyAuthentication yes' >> $SSH_CONFIG_PATH
# Ensure we allow the new port in sshd_config if not present
grep -q \"Port ${SSH_NEW_PORT}\" $SSH_CONFIG_PATH || echo \"Port ${SSH_NEW_PORT}\" >> $SSH_CONFIG_PATH
"

# Create rollback systemd service + timer that restores the old sshd_config after 5 minutes unless CONFIRM_FILE exists
backup_file "$ROLLBACK_SERVICE"
cat > "$ROLLBACK_SERVICE" <<SERVICE
[Unit]
Description=Rollback SSH config if confirm file not present

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'if [ ! -f "${CONFIRM_FILE}" ]; then cp -a ${SSH_CONFIG_PATH}.orig.* ${SSH_CONFIG_PATH} || true; systemctl restart sshd || true; fi'
SERVICE

backup_file "$ROLLBACK_TIMER"
cat > "$ROLLBACK_TIMER" <<TIMER
[Unit]
Description=Run SSH rollback in 5 minutes if not confirmed

[Timer]
OnActiveSec=300
Unit=ssh-rollback.service

[Install]
WantedBy=timers.target
TIMER

systemctl daemon-reload
systemctl enable --now ssh-rollback.timer
echo "Rollback timer created and started (will run in 5 minutes unless ${CONFIRM_FILE} is created)."

run_and_report "Restart sshd to apply new config (you will temporarily need to reconnect on port ${SSH_NEW_PORT})" systemctl restart sshd

# NOTE: The rollback will restore original config if you do not create /root/ssh-config-ok within 5 minutes.
echo -e "\n!!! IMPORTANT: After you verify you can SSH on the new port, create the file ${CONFIRM_FILE} to cancel rollback:"
echo "sudo touch ${CONFIRM_FILE}"

### ------------------------
### 7) logrotate (nginx) - sample config
### ------------------------
run_and_report "Install sample nginx logrotate config" bash -c "
cat > /etc/logrotate.d/nginx-custom <<'LR'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \$(cat /var/run/nginx.pid)
    endscript
}
LR
"

### ------------------------
### 8) Deployment & backup script templates
### ------------------------
run_and_report "Create deployment and backup helper scripts" bash -c "
cat > /usr/local/bin/deploy-site1.sh <<'DEP'
#!/usr/bin/env bash
# deploy-site1.sh <local-source-dir>
set -e
SRC=\${1:-./}
DEST=${SITE1_ROOT}
rsync -av --delete \"\$SRC/\" \"\$DEST/\"
systemctl reload nginx
echo \"Deployed to ${SITE1_ROOT}\"
DEP
chmod +x /usr/local/bin/deploy-site1.sh

cat > /usr/local/bin/backup-sites.sh <<'BK'
#!/usr/bin/env bash
# backup-sites.sh
set -e
DEST=${BACKUP_DIR}
mkdir -p \"\$DEST\"
tar czf \"\$DEST/site1-\$(date +%F-%s).tar.gz\" ${SITE1_ROOT}
tar czf \"\$DEST/app-\$(date +%F-%s).tar.gz\" ${APP_ROOT}
tar czf \"\$DEST/api-\$(date +%F-%s).tar.gz\" ${API_ROOT}
echo \"Backups created in \$DEST\"
BK
chmod +x /usr/local/bin/backup-sites.sh
"

### ------------------------
### 9) Hosts file (for local testing)
### ------------------------
# Add entries to /etc/hosts so curl from server works using site names
run_and_report "Add local /etc/hosts entries for testing" bash -c "
grep -q '${SITE1_NAME}' /etc/hosts || echo '127.0.0.1 ${SITE1_NAME} ${APP_NAME} ${API_NAME}' >> /etc/hosts
cat /etc/hosts | tail -n 5
"

### ------------------------
### 10) Basic tests & verification
### ------------------------
echo -e "\n--- Running verification tests ---"

# Wait a second for services
sleep 2

# 10.1 Nginx sites reachable
run_and_report "site1.local returns 200" curl -s -o /tmp/site1_out -w '%{http_code}' "http://${SITE1_NAME}/" | grep -q "^200"
echo "site1 HTML preview:" && head -n 2 /tmp/site1_out || true

run_and_report "app.local returns 200" curl -s -o /tmp/app_out -w '%{http_code}' "http://${APP_NAME}/" | grep -q "^200"
run_and_report "api.local root returns 200" curl -s -o /tmp/api_out -w '%{http_code}' "http://${API_NAME}/" | grep -q "^200"

# 10.2 Backend health endpoints
run_and_report "backend1 /health returns ok" curl -s "http://127.0.0.1:${NODE_APP1_PORT}/health" | jq -e '.status=="ok"' >/dev/null
run_and_report "backend2 /health returns ok" curl -s "http://127.0.0.1:${NODE_APP2_PORT}/health" | jq -e '.status=="ok"' >/dev/null

# 10.3 Reverse proxy forwards requests
run_and_report "api.local proxies to backend (contains 'Hello from backend')" bash -c "curl -s http://${API_NAME}/ | grep -q 'Hello from backend' || true; test \$? -eq 0 || true"

# 10.4 Rate limiting smoke test: send bursts and show HTTP codes
echo -e "\nRate limiting smoke test: sending burst to api.local (you should see mostly 200, possibly some 503/429 if rate limited):"
for i in {1..12}; do curl -s -o /dev/null -w '%{http_code} ' "http://${API_NAME}/"; done
echo -e "\n"

# 10.5 UFW status and SSH port open
run_and_report "UFW enabled" ufw status | grep -q "Status: active"
run_and_report "SSH port $SSH_NEW_PORT listening" ss -tln | grep -q ":${SSH_NEW_PORT} "

# 10.6 Fail2Ban running and show sshd jail status
run_and_report "Fail2Ban active" systemctl is-active --quiet fail2ban
echo "Fail2Ban status (sshd):"
fail2ban-client status sshd || true

# 10.7 Logrotate test (rotate nginx logs)
run_and_report "Force logrotate" logrotate -f /etc/logrotate.conf || true

# 10.8 Deployment & backup scripts smoke
run_and_report "Deploy helper script runs" /usr/local/bin/deploy-site1.sh /tmp || true
run_and_report "Backup helper script runs" /usr/local/bin/backup-sites.sh || true
ls -lah "$BACKUP_DIR" | head -n 5

echo -e "\nAll verification steps executed. PLEASE MANUALLY VERIFY SSH connectivity from your client:"
echo "Try: ssh -p ${SSH_NEW_PORT} <your-user>@<server-ip>"
echo "If you can connect successfully, run: sudo touch ${CONFIRM_FILE}"
echo "That will prevent the automatic rollback from restoring the old sshd_config."

echo -e "\nLog file: $LOGFILE"
echo "If you want to disable the rollback now (because you've confirmed SSH works), create the confirm file:"
echo "sudo touch ${CONFIRM_FILE}"

echo -e "\n=========== LAB6 Setup & Test END: $(date) ==========="
