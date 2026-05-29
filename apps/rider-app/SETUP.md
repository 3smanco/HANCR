# HANCR Rider App — Setup Guide

## Prerequisites
- Flutter 3.41.7+ / Dart 3.11.5+
- Google Maps API Key (from Google Cloud Console)
- Android Studio or VS Code with Flutter extension

---

## Step 1 — Generate native platform code

Run this from `apps/rider-app/`:
```bash
flutter create --project-name hancr_rider --org com.zancr . --platforms android,ios
```
> This generates `android/`, `ios/`, and native boilerplate without overwriting `lib/`.

---

## Step 2 — Install dependencies
```bash
flutter pub get
```

---

## Step 3 — Configure Google Maps API Key

### Android
Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<application ...>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

### iOS
Edit `ios/Runner/AppDelegate.swift`:
```swift
import GoogleMaps
// In application(_:didFinishLaunchingWithOptions:):
GMSServices.provideAPIKey("YOUR_GOOGLE_MAPS_API_KEY")
```

Also add to `ios/Runner/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>HANCR uses your location to find nearby drivers.</string>
```

### Android permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

---

## Step 4 — Configure API endpoint

Default: connects to `10.0.2.2:3000` (Android emulator → host machine)

For physical device, set your machine's LAN IP:
```bash
flutter run --dart-define=API_HOST=192.168.1.xxx
```

For iOS simulator, change `app_config.dart`:
```dart
defaultValue: 'localhost',  // iOS simulator
```

---

## Step 5 — Run

Make sure Docker containers are running:
```powershell
cd E:\HANCR\docker
docker compose up -d
```

Start rider-api:
```powershell
cd E:\HANCR
npm run rider-api:dev
```

Run the app:
```bash
flutter run
```

---

## Architecture

```
lib/
├── main.dart              # Entry point
├── app.dart               # BlocProviders + GoRouter
├── core/
│   ├── config/            # API URLs, constants
│   ├── graphql/           # GraphQL client + GQL strings
│   ├── models/            # Rider, Order, Loyalty, Service
│   ├── router/            # Navigator key
│   ├── services/          # Secure token storage
│   └── theme/             # Colors, typography, component styles
├── blocs/
│   ├── auth/              # OTP → JWT flow
│   ├── order/             # Create/track/rate orders + subscription
│   └── rider/             # Profile load/update
└── screens/
    ├── auth/              # Phone + OTP screens
    ├── home/              # Map + destination/service/options sheets
    ├── tracking/          # Live tracking + driver rating
    ├── rides/             # Ride history
    ├── loyalty/           # Hancr Miles
    └── profile/           # Profile + settings + logout
```

## Navigation flow

```
SplashScreen
  ├── [no token] → PhoneScreen → OtpScreen → HomeScreen
  └── [has token] → HomeScreen
       ├── Destination selected → (service sheet → options sheet) → createOrder
       │    └── TrackingScreen (orderUpdated subscription)
       │         └── RateDriverScreen
       ├── Rides tab → ride history
       ├── Loyalty tab → Hancr Miles
       └── Profile tab → edit profile / logout
```
