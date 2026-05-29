# HANCR — Payment Gateways Setup

دليل تفعيل بوابات الدفع الثلاث (HyperPay, Moyasar, Stripe) في الإنتاج.

## 📐 Architecture

```
Frontend (Flutter/Web)
   │ 1. selectGateway() + startWalletRecharge mutation
   ▼
Rider API (GraphQL)
   │ 2. PaymentGatewayService.createCheckout()
   ▼
Gateway Implementation (HyperPay/Moyasar/Stripe)
   │ 3. HTTP POST to gateway
   ▼
External Gateway API
   │ 4. returns { gatewayRef, redirectUrl OR clientSecret }
   ▼
Frontend
   │ 5. Customer completes payment (widget/Apple Pay sheet)
   ▼
Gateway → Webhook → POST /wallet/webhook/:gateway
   │ 6. HMAC verification (CRITICAL)
   ▼
PaymentGatewayService.verifyAndParseWebhook()
   │ 7. WalletService.credit (Completed)
```

---

## 1️⃣ HyperPay (الأكثر استخداماً في الخليج)

### تسجيل الحساب
1. اذهب إلى [hyperpay.com](https://www.hyperpay.com/) وقدِّم طلب تجاري
2. التحقق التجاري (سجل تجاري + IBAN) — قد يأخذ أسبوع
3. ستحصل على:
   - **Access Token** — في dashboard
   - **Entity ID** — كل عملة لها entity منفصل (SAR entity ≠ AED entity)

### الإعداد

```bash
# .env.prod
HYPERPAY_ACCESS_TOKEN=OGFjZGE0Y2I3...
HYPERPAY_ENTITY_ID=8a8294174b7ecb28014b9699220015ca
HYPERPAY_BASE_URL=https://eu-prod.oppwa.com   # eu-test.oppwa.com للاختبار
HYPERPAY_WEBHOOK_SECRET=YOUR_HMAC_SECRET_FROM_DASHBOARD
```

### Webhook URL
في HyperPay dashboard → Webhooks:
```
https://api.hancr.com/rider/wallet/webhook/hyperpay
```

### اختبار في sandbox
```bash
# امنح Test entity ID:
HYPERPAY_ENTITY_ID=8a8294174b7ecb28014b9699220015ca  # test
HYPERPAY_BASE_URL=https://eu-test.oppwa.com

# Test card:
# Number: 4200 0000 0000 0000
# CVV: 123
# Expiry: 12/30
# 3DS: success (يعتمد على bin)
```

### Test cards
| Card Number | Result |
|-------------|--------|
| 4200 0000 0000 0000 | نجاح |
| 5454 5454 5454 5454 | نجاح (Mastercard) |
| 4000 0000 0000 0002 | فشل |

---

## 2️⃣ Moyasar (السعودية)

### تسجيل الحساب
1. [dashboard.moyasar.com](https://dashboard.moyasar.com/)
2. التحقق التجاري (سجل سعودي + Tax ID)
3. تفعيل live mode بعد المراجعة

### الإعداد

```bash
# .env.prod
MOYASAR_API_KEY=sk_live_xxx              # أو sk_test_xxx
MOYASAR_WEBHOOK_SECRET=whsec_xxx
```

### Webhook
```
https://api.hancr.com/rider/wallet/webhook/moyasar
```
أضِفه في Moyasar dashboard → Webhooks.

### Test cards
```
# Sandbox (sk_test_...)
# Number: 4111 1111 1111 1111
# CVV: 123
# Expiry: 12/30
# OTP (mada): 1111
```

---

## 3️⃣ Stripe (international + Apple Pay + Google Pay)

### تسجيل الحساب
1. [dashboard.stripe.com](https://dashboard.stripe.com/)
2. activate live mode (يأخذ يوم-يومين للمراجعة)

### الإعداد

```bash
# .env.prod
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx        # للـ Flutter app
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Webhook
```
https://api.hancr.com/rider/wallet/webhook/stripe
```

في Stripe dashboard → Developers → Webhooks → Add endpoint:
- URL: above
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Save → احفظ الـ signing secret في `STRIPE_WEBHOOK_SECRET`

### Apple Pay setup
1. في Stripe dashboard → Settings → Payment methods → Apple Pay
2. Register domain: `hancr.com`
3. سيُعطيك associate file → ضعه في `apps/landing/public/.well-known/apple-developer-merchantid-domain-association`
4. في Flutter:
   ```dart
   // pubspec.yaml
   stripe_platform_interface: ^11.5.0
   flutter_stripe: ^11.5.0
   ```

### Google Pay setup
- Google Pay يعمل تلقائياً مع Stripe (لا حاجة لـ extra setup)
- يحتاج Android signed APK (debug = test mode)

### Test cards
```
# Success: 4242 4242 4242 4242
# Auth required: 4000 0025 0000 3155
# Decline: 4000 0000 0000 0002
```

---

## 🛡️ Webhook Security (CRITICAL)

كل webhook **يجب أن يُتحقَّق توقيعه** قبل الـ trust. الـ HANCR code يفعل ذلك تلقائياً عبر `WalletWebhookController`:

```ts
event = paymentGateway.verifyAndParseWebhook(gateway, headers, body);
// يرمي WebhookVerificationError لو signature غلط
```

### Whitelist IPs (إضافي — في Nginx/Cloudflare)

#### HyperPay IPs
```
185.103.196.0/22
209.171.226.0/24
```

#### Moyasar IPs
```
35.205.213.91/32
35.241.36.96/32
```

#### Stripe IPs
انظر [stripe.com/files/ips/ips_webhooks.json](https://stripe.com/files/ips/ips_webhooks.json) (يتغيَّر دورياً).

### في Cloudflare WAF
```
Rule: webhook IP whitelist
Match: http.host eq "api.hancr.com" AND http.request.uri.path contains "/wallet/webhook/"
Action: لو ip.src NOT in known_webhook_ips → Block
```

---

## 🧪 الاختبار النهائي قبل launch

### 1. اختبار Sandbox flow كامل
```bash
# 1. startWalletRecharge
curl -X POST https://api.hancr.com/rider/graphql \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"query":"mutation { startWalletRecharge(amount: 10, gateway: HyperPay) { redirectUrl gatewayRef } }"}'

# 2. اذهب لـ redirectUrl، ادفع بالـ test card

# 3. تحقق من الـ transaction
curl -X POST https://api.hancr.com/rider/graphql \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"query":"query { myWalletTransactions { id status amount } }"}'
```

### 2. اختبار webhook (يدوياً)
```bash
# Stripe CLI
stripe listen --forward-to https://api.hancr.com/rider/wallet/webhook/stripe
stripe trigger payment_intent.succeeded
```

### 3. اختبار رصيد غير كافٍ
- اشحن بـ 0.01 SAR
- حاول رحلة 5 SAR
- يجب أن يفشل بـ InsufficientBalanceError

---

## 📊 Reconciliation (للمحاسبة الشهرية)

كل شهر:
1. اطلب CSV من dashboards الـ 3 gateways (transactions الشهر)
2. قارن مع `hancr_wallet_transaction` table:
   ```sql
   SELECT gateway, gateway_ref, amount, status, created_at
   FROM hancr_wallet_transaction
   WHERE type = 'Recharge'
     AND created_at >= '2026-05-01'
   ORDER BY gateway, created_at;
   ```
3. أي فرق → investigate (ربما webhook فاتت + لم تُعالَج)

استخدم `walletService.getLedgerTotal()` للتحقق من تطابق الـ ledger مع cached balances.
