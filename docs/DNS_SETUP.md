# HANCR — DNS Setup (hancr.com)

## ⚙️ التهيئة الموصى بها: Cloudflare

### لماذا Cloudflare؟
- ✅ DDoS protection مجاني
- ✅ SSL تلقائي (Universal SSL) — لا حاجة لـ Let's Encrypt
- ✅ CDN عالمي مجاني
- ✅ Rate limiting إضافي
- ✅ Bot protection
- ✅ يدعم Argo Tunnel للنشر بدون فتح ports

### الخطوات:
1. سجِّل في cloudflare.com
2. أضف `hancr.com`
3. حدِّث الـ nameservers في nic.com (أو حيث اشتريت الدومين) إلى ما يعطيك Cloudflare (مثلاً: `kate.ns.cloudflare.com`, `tom.ns.cloudflare.com`)

---

## 📋 DNS Records المطلوبة

استبدل `YOUR_SERVER_IP` بـ IP الفعلي للسيرفر الذي تستضيف عليه HANCR.

| Type | Name | Content | Proxy | TTL | الغرض |
|------|------|---------|-------|-----|------|
| `A` | `@` | `YOUR_SERVER_IP` | 🟧 Proxied | Auto | الـ apex (hancr.com) |
| `A` | `www` | `YOUR_SERVER_IP` | 🟧 Proxied | Auto | www.hancr.com |
| `A` | `api` | `YOUR_SERVER_IP` | 🟧 Proxied | Auto | api.hancr.com (3 APIs مدمجة) |
| `A` | `admin` | `YOUR_SERVER_IP` | 🟧 Proxied | Auto | admin.hancr.com (Admin Panel) |
| `CNAME` | `cdn` | `your-r2-bucket.r2.cloudflarestorage.com` | 🟧 Proxied | Auto | (مستقبلاً) static assets |

### Records اختيارية:

| Type | Name | Content | الغرض |
|------|------|---------|-------|
| `MX` | `@` | mail-server.com (10) | لو تحتاج email (admin@hancr.com) — استخدم Cloudflare Email Routing |
| `TXT` | `@` | `v=spf1 include:_spf.firebaseapp.com ~all` | SPF (لـ Firebase emails) |
| `TXT` | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:admin@hancr.com` | DMARC |

---

## 🔒 SSL/TLS Configuration

في Cloudflare → SSL/TLS:

| Setting | Value |
|---------|-------|
| Encryption mode | **Full (strict)** — يتطلب cert على origin، لكن آمن |
| Edge Certificates | Always Use HTTPS: **ON** |
| Edge Certificates | HSTS: **Enable** (max-age: 6 months) |
| Edge Certificates | Minimum TLS Version: **1.2** |
| Edge Certificates | Opportunistic Encryption: **ON** |

### للسيرفر (origin):
لو اخترت **Full (strict)**، تحتاج cert على السيرفر. الخيارات:
- **(أ) Origin Certificate من Cloudflare**: مجاني، صالح 15 سنة، يقبله Cloudflare فقط
- **(ب) Let's Encrypt مع certbot**: عام، صالح 90 يوم، يحتاج auto-renew

لو اخترت **Flexible** (CF → origin بـ HTTP): أبسط لكن أقل أماناً.

---

## 🌐 Page Rules / Configuration Rules (Cloudflare)

| Rule | Match | Action |
|------|-------|--------|
| API caching disabled | `api.hancr.com/*` | Cache Level: Bypass |
| Admin Panel caching | `admin.hancr.com/*` | Cache Level: Standard |
| Force HTTPS | `*hancr.com/*` | Always Use HTTPS: ON |
| Strict Security | `admin.hancr.com/*` | Security Level: High |

---

## 🛡️ WAF Rules (مُوصى بها)

في Security → WAF → Custom rules:

1. **Block obvious attacks**:
   - Match: `http.request.uri.path contains "/wp-admin"` OR `contains ".php"`
   - Action: Block

2. **Rate limit GraphQL introspection**:
   - Match: `http.request.uri.path eq "/rider/graphql"` AND `http.request.body contains "__schema"`
   - Action: Challenge (يَمنع scraping للـ schema)

3. **Geo block (اختياري)**:
   - Match: `not ip.geoip.country in {"SA" "AE" "QA" "KW" "BH" "OM"}`
   - Action: Block (لو خدمتك خليجية فقط)

---

## 📊 Health Monitoring

أضف uptime monitor (مجاني عبر Cloudflare أو UptimeRobot):

| Monitor | URL | Interval |
|---------|-----|----------|
| API health | `https://api.hancr.com/health` | 1 min |
| Admin panel | `https://admin.hancr.com/` | 5 min |
| GraphQL endpoint | `https://api.hancr.com/rider/graphql` (POST {"query":"{__typename}"}) | 5 min |

---

## ✅ التحقق من التهيئة

بعد إضافة الـ records، اختبر:

```bash
# تحقق من DNS resolution
dig hancr.com
dig api.hancr.com
dig admin.hancr.com

# تحقق من SSL
curl -I https://api.hancr.com/health
curl -I https://admin.hancr.com/

# تحقق من GraphQL endpoint
curl -X POST https://api.hancr.com/rider/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{__typename}"}'
```

النتيجة المتوقَّعة:
- DNS يحلّ إلى IP السيرفر (أو Cloudflare IPs لو proxied)
- HTTPS يعمل بدون أخطاء certificate
- GraphQL يرجع `{"data":{"__typename":"Query"}}`
