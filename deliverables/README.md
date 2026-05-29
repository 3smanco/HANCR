# HANCR — APKs للاختبار

## 📦 الملفات

| الملف | الحجم | الوصف |
|------|-------|------|
| `hancr-rider.apk` | 92 MB | تطبيق الراكب (Aurora) |
| `hancr-driver.apk` | 91 MB | تطبيق السائق (Aurora) |

## 📱 تثبيت على الجوال

### الطريقة (أ) — USB / ADB
```bash
adb install hancr-rider.apk
adb install hancr-driver.apk
```

### الطريقة (ب) — نقل مباشر
1. انقل الملفات للجوال (Bluetooth/USB/Google Drive)
2. اضغط على الملف من Files app
3. اسمح بـ "تثبيت من مصادر غير معروفة"
4. ثبّت

---

## 🔐 بيانات الدخول التجريبية

| التطبيق | الهاتف | OTP |
|---------|--------|-----|
| **Rider 1** (أحمد الراكب) | `+966500000001` | `1234` |
| **Rider 2** (سارة العتيبي) | `+966500000002` | `1234` |
| **Driver 1** (محمد السائق) | `+966500000010` | `1234` |
| **Driver 2** (خالد المطيري) | `+966500000011` | `1234` |

---

## 🚀 قبل التشغيل — جهّز السيرفر

### 1. شغّل Docker (Postgres + Redis)
```powershell
cd E:/HANCR
docker-compose -f docker/docker-compose.yml up -d postgres redis
```

### 2. أضف الـ demo users
```powershell
Get-Content "scripts/seed-demo-users.sql" | docker exec -i hancr_postgres psql -U hancr -d hancr
```

### 3. شغّل الـ APIs (في terminals منفصلة)
```powershell
# Terminal 1
cd E:/HANCR
npx nx serve rider-api

# Terminal 2
cd E:/HANCR
npx nx serve driver-api
```

---

## 🌐 ضبط الشبكة

التطبيقات مبنية بـ `API_HOST=10.0.2.2` (للـ Android emulator).

### للجهاز الفعلي:
1. اكتشف IP الكمبيوتر:
   ```powershell
   ipconfig | findstr IPv4
   # مثال: 192.168.1.100
   ```

2. اسمح في الـ firewall بـ ports 3000 + 3001

3. أعد بناء APK مع IP الكمبيوتر:
   ```powershell
   cd E:/HANCR/apps/rider-app
   flutter build apk --debug --target-platform android-arm64 --dart-define=API_HOST=192.168.1.100
   ```

### استخدام emulator:
لا تحتاج تغيير. شغّل Android Studio emulator وثبّت الـ APK.

---

## ⚠️ ملاحظات مهمة

### تم تعطيل (مؤقتاً) للـ demo:
- **Sentry** — مشكلة Kotlin compile مع `sentry_flutter`
- **R8/ProGuard** — لتسريع البناء (debug APK)
- **Google Maps key** — يحتاج إضافة في AndroidManifest قبل ظهور الخريطة

### قبل النشر على Play Store:
1. أعد تفعيل Sentry (`apps/*-app/pubspec.yaml`)
2. أعد تفعيل minification في `android/app/build.gradle.kts`
3. أضف Google Maps API key الحقيقي
4. ولّد keystore + `key.properties`
5. ابنِ App Bundle بدل APK: `flutter build appbundle --release`

---

## 🐛 Troubleshooting

| المشكلة | الحل |
|---------|------|
| "Connection refused" | تأكد APIs شغّالة + firewall مفتوح |
| "OTP لم يصل" | OTP الثابت `1234` يعمل دائماً للأرقام التجريبية |
| الخريطة رمادية | تحتاج Google Maps API key |
| Login فشل | شغّل seed script أولاً |
| التطبيق يفتح ثم يقفل | تحقق من logs الـ rider-api/driver-api |

---

## 📊 ما الذي يعمل في الـ Demo

### ✅ يعمل:
- Login بـ OTP `1234`
- Bottom navigation (4 tabs)
- شاشة Home + Services + Profile + Wallet
- إدارة جهات الطوارئ
- مشاهدة الرصيد + المعاملات (لو موجودة)
- شاشة SOS button + dialogs
- شاشة Earnings للسائق
- Online toggle للسائق
- كل الـ navigation الداخلي

### ⚠️ "قريباً" (snackbar):
- Call / Message / Share في tracking
- Send في wallet
- Statement PDF
- Edit profile
- Add device

### 🚧 يحتاج Google Maps key:
- شاشة Home map للراكب
- شاشة Map للسائق
- Tracking screen خريطة

### 🚧 يحتاج إعدادات إضافية:
- Push notifications (يحتاج Firebase config)
- Payment gateways (HyperPay/Moyasar — حسابات production)

---

## 🎨 خصائص تصميم Aurora

تجربتك الأولى ستلاحظ:
- 🌑 خلفية obsidian سوداء dense
- 🟠 accent برتقالي ember mit glow effect
- ✨ Border glow على الـ cards الـ selected
- 🌟 Cinematic premium feel
- 📱 RTL Arabic كامل
- ⚡ Animations smooth في كل interactions
