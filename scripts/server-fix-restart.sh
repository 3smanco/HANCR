#!/usr/bin/env bash
# إصلاح إعداد pm2 وإعادة التشغيل الصحيحة للـ APIs على الخادم.
# - يضيف JWT_DRIVER_SECRET لـ ecosystem (كتلة السائق تقرأه الآن، fail-fast بدونه)
# - يعيد التشغيل ببيئة مضيف صحيحة (postgres/redis → 127.0.0.1، خارج شبكة docker)
set -euo pipefail
cd /opt/hancr

ECO=ecosystem.config.js

# 1) أضف JWT_DRIVER_SECRET بعد كل سطر JWT_SECRET (السائق يحتاجه؛ الراكب يتجاهله) — مرّة واحدة
if ! grep -q "JWT_DRIVER_SECRET" "$ECO"; then
  cp "$ECO" "${ECO}.bak.$(date +%s)"
  sed -i 's#\(JWT_SECRET: process.env.JWT_SECRET,\)#\1\n        JWT_DRIVER_SECRET: process.env.JWT_DRIVER_SECRET,#g' "$ECO"
  echo "added JWT_DRIVER_SECRET to ecosystem ($(grep -c JWT_DRIVER_SECRET "$ECO") occurrences)"
else
  echo "JWT_DRIVER_SECRET already in ecosystem"
fi

# 2) حمّل أسرار .env.prod ثم صحّح المضيفين (pm2 يعمل على المضيف لا داخل docker)
set -a
. ./.env.prod
set +a
export DATABASE_HOST=127.0.0.1
export REDIS_HOST=127.0.0.1

echo "DB target: ${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}  Redis: ${REDIS_HOST}:${REDIS_PORT}"

# 3) أعد التشغيل عبر ecosystem (يلتقط JWT_DRIVER_SECRET + المنافذ الصحيحة 3000/3001/3002)
pm2 restart "$ECO" --update-env
pm2 save
