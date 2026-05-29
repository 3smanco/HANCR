# App Icon Assets — Rider App

ضع هذه الملفات هنا قبل تشغيل `dart run flutter_launcher_icons`:

| File | Size | Format | Notes |
|------|------|--------|-------|
| `icon.png` | 1024×1024 | PNG (no transparency) | Main icon — يظهر في Home screen |
| `icon-foreground.png` | 1024×1024 | PNG (with transparency) | Foreground layer للـ Adaptive Icon Android |
| `splash.png` | 512×512 | PNG (with transparency) | Logo للـ splash screen — على خلفية navy |

## Design Specs

- **Background**: HANCR Navy `#22223B`
- **Logo**: حرف "H" أو لوغو HANCR بـ Violet `#B048FF`
- **Padding**: ضع الـ logo في 60% من الإطار (Adaptive icon يقص 30% من الحواف)
- **Style**: modern, minimal, lots of glow

## Tools لتوليد الـ icons

### Figma (موصى)
1. أنشئ frame 1024x1024
2. اعمل export PNG @1x
3. Ensure no transparency (لـ iOS)

### بدائل
- [appicon.co](https://appicon.co/) — رفع icon واحد، يولِّد كل الأحجام
- [makeappicon.com](https://makeappicon.com/)
- Sketch/Adobe XD

## بعد إضافة الملفات

```bash
cd apps/rider-app
flutter pub get
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```

سيُولِّد:
- Android: `android/app/src/main/res/mipmap-*/`
- iOS: `ios/Runner/Assets.xcassets/AppIcon.appiconset/`
