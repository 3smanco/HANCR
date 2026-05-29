# ─────────────────────────────────────────────────────────────────
# HANCR — ProGuard / R8 Rules لـ release builds
# ─────────────────────────────────────────────────────────────────

# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }
-dontwarn io.flutter.embedding.**

# ─── Firebase / FCM ───
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**

# ─── Google Maps ───
-keep class com.google.android.gms.maps.** { *; }
-keep interface com.google.android.gms.maps.** { *; }

# ─── Sentry ───
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# ─── GraphQL / WebSocket ───
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ─── Geolocator ───
-keep class com.baseflow.geolocator.** { *; }

# ─── Secure Storage ───
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# ─── Image picker / Camera ───
-keep class io.flutter.plugins.imagepicker.** { *; }

# ─── Reflection / Annotations ───
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes Exceptions

# ─── HTTP / JSON ───
-keepclassmembers,allowobfuscation class * {
  @com.google.gson.annotations.SerializedName <fields>;
}

# ─── Native methods ───
-keepclasseswithmembernames class * {
    native <methods>;
}

# ─── Custom App classes (نطاق HANCR) ───
-keep class com.zancr.hancr_rider.** { *; }
