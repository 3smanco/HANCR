#!/bin/bash
# G4 — رؤوس أمان (CSP + الباقي) على موقع hancr.com عبر snippet مُضمَّن.
set -e

sudo tee /etc/nginx/snippets/hancr-security.conf >/dev/null <<'CONF'
# G4 hardening — security headers for hancr.com
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(self), camera=(), microphone=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://accounts.google.com https://apis.google.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://maps.gstatic.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.hancr.com https://maps.googleapis.com https://accounts.google.com; frame-src https://accounts.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'" always;
CONF

# أدرِج الـ snippet داخل أول server block للموقع (بعد index index.html;)
if ! grep -q "hancr-security.conf" /etc/nginx/sites-available/hancr; then
  sudo sed -i '0,/index index.html;/s//index index.html;\n    include snippets\/hancr-security.conf;/' /etc/nginx/sites-available/hancr
fi

echo "--- nginx test ---"
sudo nginx -t
echo "--- reload ---"
sudo systemctl reload nginx
echo "DONE-CSP"
