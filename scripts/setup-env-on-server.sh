#!/bin/bash
# يُشغَّل على السيرفر — يُنشئ .env.prod مع قيم demo
set -e
cd /opt/hancr

# توليد passwords قوية
DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
REDIS_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
JWT_SECRET=$(openssl rand -base64 48)
ADMIN_JWT_SECRET=$(openssl rand -base64 48)
ADMIN_PASS=$(openssl rand -base64 16 | tr -d '/+=' | head -c 16)

cat > .env.prod <<EOF
NODE_ENV=production
RIDER_API_PORT=3000
DRIVER_API_PORT=3000
ADMIN_API_PORT=3000

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=hancr_prod
DATABASE_USER=hancr_prod
DATABASE_PASSWORD=$DB_PASS

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASS

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET

# Admin
ADMIN_DEFAULT_EMAIL=admin@hancr.com
ADMIN_DEFAULT_PASSWORD=$ADMIN_PASS

# URLs (مؤقتاً IP — سيُغيَّر بعد DNS)
PUBLIC_BASE_URL=http://34.18.212.201
PUBLIC_API_URL=http://34.18.212.201
PUBLIC_ADMIN_URL=http://34.18.212.201/admin
CORS_ORIGINS=http://34.18.212.201,https://hancr.com,https://www.hancr.com,https://admin.hancr.com
ADMIN_CORS_ORIGINS=http://34.18.212.201,https://admin.hancr.com
PAYMENT_WEBHOOK_URL=http://34.18.212.201/rider/wallet/webhook/{gateway}

# Default region
DEFAULT_LAT=24.7136
DEFAULT_LNG=46.6753
DEFAULT_REGION=SA
DEFAULT_CURRENCY=SAR

# Placeholders — fill before going live
GOOGLE_MAPS_API_KEY=
MAPBOX_TOKEN=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
HYPERPAY_ACCESS_TOKEN=
MOYASAR_API_KEY=
STRIPE_SECRET_KEY=
SENTRY_DSN=
EOF

chmod 600 .env.prod
echo "✓ .env.prod created"
echo ""
echo "═══════════════════════════════════════════════════"
echo "  IMPORTANT — SAVE THESE CREDENTIALS:"
echo "═══════════════════════════════════════════════════"
echo "  DB_PASS:        $DB_PASS"
echo "  REDIS_PASS:     $REDIS_PASS"
echo "  ADMIN_PASS:     $ADMIN_PASS"
echo "  ADMIN_EMAIL:    admin@hancr.com"
echo "═══════════════════════════════════════════════════"
