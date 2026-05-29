# HANCR — Flutter Release Builds

دليل بناء وتوزيع تطبيقات Android + iOS.

## 🔐 1. توليد Android Signing Keys

**مرة واحدة فقط** — هذه المفاتيح ثابتة طوال عمر التطبيق.

```bash
# rider-app
keytool -genkey -v \
    -keystore ~/hancr-keystores/hancr-rider-release.jks \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -alias hancr-rider \
    -storetype JKS

# driver-app
keytool -genkey -v \
    -keystore ~/hancr-keystores/hancr-driver-release.jks \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -alias hancr-driver \
    -storetype JKS
```

**أسئلة Keytool**:
- First and last name: `HANCR Platform`
- Organizational unit: `Mobile`
- Organization: `Zancr LLC`
- City: `Riyadh`
- State: `KSA`
- Country code: `SA`

**🚨 احتفظ بالـ keystore في 3 أماكن**:
1. Local machine (مُشفَّر)
2. 1Password / AWS Secrets Manager
3. Offline backup (USB في مكان آمن)

**لو فقدتَ الـ keystore → لا يمكنك تحديث التطبيق على Play Store مطلقاً.**

## 🔧 2. إعداد `key.properties`

```bash
cp apps/rider-app/android/key.properties.example apps/rider-app/android/key.properties
nano apps/rider-app/android/key.properties
# املأ القيم الفعلية

cp apps/driver-app/android/key.properties.example apps/driver-app/android/key.properties
nano apps/driver-app/android/key.properties
```

⚠ تأكَّد أن `key.properties` و `*.jks` في `.gitignore` (تم بالفعل).

## 🎨 3. App Icons + Splash Screens

```bash
# تثبيت أدوات Flutter
flutter pub global activate flutter_launcher_icons
flutter pub global activate flutter_native_splash

# rider-app
cd apps/rider-app
# 1. ضع icon.png (1024x1024) في assets/icon.png
# 2. أضف في pubspec.yaml:
#    flutter_icons:
#      android: true
#      ios: true
#      image_path: "assets/icon.png"
#      adaptive_icon_background: "#22223B"
#      adaptive_icon_foreground: "assets/icon-foreground.png"
flutter pub run flutter_launcher_icons

# Splash screen
# في pubspec.yaml أضف:
#    flutter_native_splash:
#      color: "#22223B"
#      image: assets/splash.png
flutter pub run flutter_native_splash:create
```

تكرَّر نفس الخطوات لـ `driver-app`.

## 📦 4. بناء Release Builds

### الطريقة (أ): سكريبت تلقائي

```bash
# Linux/macOS
chmod +x scripts/build-flutter-release.sh

# مع env vars
export ENV=production
export GOOGLE_MAPS_API_KEY="AIzaXXX"
export SENTRY_DSN_RIDER_APP="https://..."
export SENTRY_DSN_DRIVER_APP="https://..."

./scripts/build-flutter-release.sh all
```

### الطريقة (ب): يدوي

```bash
cd apps/rider-app

# APK للتجربة المحلية (split per ABI — أصغر)
flutter build apk --release --split-per-abi \
    --dart-define=ENV=production \
    --dart-define=SENTRY_DSN=https://... \
    --dart-define=MAPS_API_KEY=AIzaXXX

# App Bundle للـ Play Store
flutter build appbundle --release \
    --dart-define=ENV=production \
    --dart-define=SENTRY_DSN=https://... \
    --dart-define=MAPS_API_KEY=AIzaXXX

# iOS IPA (macOS فقط)
flutter build ipa --release \
    --dart-define=ENV=production \
    --dart-define=SENTRY_DSN=https://... \
    --dart-define=MAPS_API_KEY=AIzaXXX
```

## 📂 5. مواقع المخرجات

```
apps/rider-app/build/app/outputs/
├── flutter-apk/
│   ├── app-arm64-v8a-release.apk     ← لأجهزة 64-bit (الأكثر)
│   ├── app-armeabi-v7a-release.apk   ← لأجهزة 32-bit القديمة
│   ├── app-x86_64-release.apk        ← للـ emulators
│   └── app-release.apk               ← universal (يشمل كل ABIs)
├── bundle/release/
│   └── app-release.aab               ← لـ Play Store ★
└── ios/
    └── Runner.ipa                    ← لـ App Store
```

## 🚀 6. النشر على المتاجر

### Google Play Store
1. اذهب إلى [Play Console](https://play.google.com/console)
2. Create app → اسم: "HANCR — رحلتك"
3. Set up app:
   - App access: full access
   - Ads: لا
   - Content rating: استكمل النموذج
   - Target audience: 18+
   - Privacy policy: `https://hancr.com/privacy`
4. Production track → Create new release
5. Upload `app-release.aab`
6. Release notes: "النسخة الأولى من HANCR — منصة التنقل الذكي"
7. Review → Start rollout

**Internal testing track أولاً** (يصلح للـ team):
- Internal testing → Upload AAB
- Add testers emails
- تحصل على رابط مباشر للتثبيت في دقائق

### Apple App Store
1. [App Store Connect](https://appstoreconnect.apple.com)
2. My Apps → "+" → New App
3. Bundle ID: `com.zancr.hancr_rider`
4. SKU: `hancr-rider`
5. Upload IPA عبر Transporter app أو Xcode → Archive → Distribute
6. TestFlight أولاً للتجريب

## 🔄 7. CI/CD للـ Release Builds

أضف في `.github/workflows/mobile-release.yml`:

```yaml
name: Mobile Release
on:
  push:
    tags: ['mobile-v*.*.*']
jobs:
  android-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with: { flutter-version: '3.27.0' }
      - name: Decode keystore
        run: echo "${{ secrets.RIDER_KEYSTORE_BASE64 }}" | base64 -d > rider.jks
      - name: Build AAB
        run: |
          cd apps/rider-app
          flutter pub get
          flutter build appbundle --release \
            --dart-define=ENV=production \
            --dart-define=SENTRY_DSN=${{ secrets.SENTRY_DSN_RIDER_APP }} \
            --dart-define=MAPS_API_KEY=${{ secrets.GOOGLE_MAPS_API_KEY }}
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: com.zancr.hancr_rider
          releaseFiles: apps/rider-app/build/app/outputs/bundle/release/app-release.aab
          track: internal
```

## 📊 8. قياس الأداء

بعد الـ release:
- **Play Console** → Vitals → ANR rate, crash rate
- **Sentry** → Issues + Performance
- **Firebase Analytics** (لو فعَّلتها)

أهداف الـ MVP:
- Crash rate < 1%
- ANR rate < 0.5%
- App startup time < 2s
- Install size < 25 MB (APK لكل ABI)

## 🐛 Troubleshooting

### Gradle build فشل
```bash
cd apps/rider-app/android
./gradlew clean
cd .. && flutter clean && flutter pub get
flutter build apk --release
```

### Keystore not found
- تحقَّق من `apps/rider-app/android/key.properties`
- تأكَّد أن `storeFile` مسار صحيح absolute

### iOS provisioning errors
- Xcode → Signing & Capabilities → Team + auto-manage
- لو مستمرَّة: أعد إنشاء certificates في developer.apple.com

### "App not installed" على Android
- Uninstall النسخة السابقة (signature تغيَّر)
- تحقَّق من `minSdkVersion` متوافق مع جهاز الاختبار
