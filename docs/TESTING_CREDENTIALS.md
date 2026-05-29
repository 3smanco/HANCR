# HANCR — Demo Credentials للاختبار

## 📱 أرقام تجريبية + OTP ثابت

### Rider App (تطبيق الراكب)

| الاسم | رقم الهاتف | OTP | الرصيد |
|-------|-----------|------|--------|
| أحمد الراكب | `+966500000001` | `1234` | 150.00 SAR |
| سارة العتيبي | `+966500000002` | `1234` | 75.50 SAR |

### Driver App (تطبيق السائق)

| الاسم | رقم الهاتف | OTP | السيارة | الرصيد |
|-------|-----------|------|---------|--------|
| محمد السائق | `+966500000010` | `1234` | تويوتا كامري 2023 | 540.00 SAR |
| خالد المطيري | `+966500000011` | `1234` | هيونداي سوناتا 2024 | 320.00 SAR |

---

## 🚀 كيفية التطبيق

### 1. تأكد من تشغيل Postgres
```bash
docker-compose -f docker/docker-compose.yml up -d postgres redis
```

### 2. شغّل الـ APIs
```bash
cd E:/HANCR

# Terminal 1: Rider API
npx nx serve rider-api

# Terminal 2: Driver API
npx nx serve driver-api
```

### 3. أضف المستخدمين التجريبيين
```bash
# في PowerShell
Get-Content "scripts/seed-demo-users.sql" | docker exec -i hancr_postgres psql -U hancr -d hancr

# أو في bash
docker exec -i hancr_postgres psql -U hancr -d hancr < scripts/seed-demo-users.sql
```

ستحصل على إخراج يؤكد إضافة المستخدمين + قائمة بياناتهم.

### 4. ثبّت APK على هاتفك Android

#### Rider App
```
apps/rider-app/build/app/outputs/flutter-apk/app-release.apk
```

#### Driver App
```
apps/driver-app/build/app/outputs/flutter-apk/app-release.apk
```

**طرق التثبيت:**
- **ADB**: `adb install app-release.apk`
- **Direct**: انقل الـ APK للهاتف وثبّته (اسمح بـ Unknown Sources)
- **Google Drive**: ارفع للـ Drive ثم حمّل من الهاتف

### 5. سجّل دخول

1. افتح التطبيق
2. أدخل رقم الهاتف من الجدول أعلاه (مع `+966`)
3. اضغط "إرسال OTP"
4. أدخل OTP: `1234`
5. ستدخل التطبيق مباشرة 🎉

---

## ⚙️ ضبط الشبكة (مهم!)

التطبيقات في dev mode تستهدف `10.0.2.2:3000` (للـ Android emulator).
لاستخدام جهاز فعلي:

### الخيار (أ) — emulator
لا حاجة لأي تغيير. شغّل Android Studio emulator.

### الخيار (ب) — جهاز فعلي على نفس الـ WiFi
استخدم IP الكمبيوتر:

```bash
# اكتشف IP
ipconfig | findstr "IPv4"
# مثال: 192.168.1.100

# ابنِ APK مع IP الكمبيوتر
cd apps/rider-app
flutter build apk --release --dart-define=API_HOST=192.168.1.100

# نفس الشيء لـ driver-app
cd ../driver-app
flutter build apk --release --dart-define=API_HOST=192.168.1.100
```

### الخيار (ج) — Production server (لاحقاً)
```bash
flutter build apk --release --dart-define=ENV=production
# سيستخدم https://api.hancr.com تلقائياً
```

---

## 🔍 Troubleshooting

### "Connection refused"
- تأكد من أن الـ APIs شغّالة (`nx serve rider-api` و `driver-api`)
- تحقق من firewall windows: اسمح بـ port 3000 و 3001
- في الجهاز الفعلي: استخدم `--dart-define=API_HOST=YOUR_PC_IP`

### "OTP لم يصل"
- في dev mode: الـ OTP يظهر في الـ response مباشرة (devOtp field) + console السيرفر
- الأرقام التجريبية تستخدم `1234` دائماً

### "خطأ في الـ login"
- تأكد من تشغيل seed script
- تحقق من logs الـ rider-api/driver-api

### "Maps لا تعمل"
- يحتاج Google Maps API key — أضفه في `apps/rider-app/android/app/src/main/AndroidManifest.xml`
- بدون key، الخريطة ستظهر رمادية لكن باقي التطبيق سيعمل

---

## 📋 سيناريو اختبار كامل

### السيناريو 1: حجز رحلة
1. سجّل دخول كـ **رacker** `+966500000001`
2. اذهب لشاشة Home → "إلى أين؟"
3. اختر وجهة
4. اختر نوع السيارة
5. تأكيد الحجز
6. ستبدأ شاشة Tracking

### السيناريو 2: قبول رحلة (سائق)
1. سجّل دخول كـ **سائق** `+966500000010`
2. اضغط زر "ابدأ الاستقبال" (يصبح أخضر)
3. انتظر طلب جديد (من الراكب)
4. اقبل الطلب
5. اتبع المسار: Arrived → Start → Finish

### السيناريو 3: محفظة + شحن
1. الراكب: Profile → محفظة
2. شاهد الرصيد 150 SAR
3. اضغط "شحن" → اختر مبلغ → "اشحن"
4. ستظهر معاملة Pending

### السيناريو 4: SOS
1. أي مستخدم: Profile → جهات الطوارئ
2. أضف جهة (الاسم + الرقم)
3. خلال الرحلة: اضغط زر SOS (الأحمر)
4. أكّد التفعيل
5. ستصلك رسالة "تم إشعار X جهة"
