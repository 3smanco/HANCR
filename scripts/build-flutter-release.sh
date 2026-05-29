#!/bin/bash
# =============================================
# HANCR — Build Flutter Release APKs/AABs
#
# الاستخدام:
#   ./scripts/build-flutter-release.sh rider        # rider-app فقط
#   ./scripts/build-flutter-release.sh driver       # driver-app فقط
#   ./scripts/build-flutter-release.sh all          # كلاهما
#
# Outputs:
#   apps/{app}/build/app/outputs/flutter-apk/         → APK لكل ABI + universal
#   apps/{app}/build/app/outputs/bundle/release/      → AAB للـ Play Store
# =============================================

set -e

APP="${1:-all}"

# ─── متطلَّبات الـ env ───
SENTRY_DSN_RIDER="${SENTRY_DSN_RIDER_APP:-}"
SENTRY_DSN_DRIVER="${SENTRY_DSN_DRIVER_APP:-}"
MAPS_KEY="${GOOGLE_MAPS_API_KEY:-}"
ENV_NAME="${ENV:-production}"

if [[ -z "$MAPS_KEY" ]]; then
    echo "⚠ GOOGLE_MAPS_API_KEY غير معرَّفة. Maps لن يعمل في الـ release build."
fi

build_app() {
    local APP_NAME=$1
    local SENTRY_DSN=$2
    local APP_DIR="apps/${APP_NAME}-app"

    if [[ ! -d "$APP_DIR" ]]; then
        echo "✗ لا يوجد مجلد $APP_DIR"
        return 1
    fi

    echo ""
    echo "════════════════════════════════════════════════"
    echo "Building HANCR ${APP_NAME^^} (env: $ENV_NAME)"
    echo "════════════════════════════════════════════════"

    cd "$APP_DIR"

    # تأكَّد من الـ deps
    flutter pub get

    # ─── Android APK (split per ABI) ───
    echo ""
    echo "▸ Building Android APKs..."
    flutter build apk --release \
        --split-per-abi \
        --dart-define=ENV="$ENV_NAME" \
        --dart-define=SENTRY_DSN="$SENTRY_DSN" \
        --dart-define=MAPS_API_KEY="$MAPS_KEY" \
        --dart-define=MAPS_KEY="$MAPS_KEY"

    # ─── Android App Bundle (للـ Play Store) ───
    echo ""
    echo "▸ Building Android App Bundle (AAB)..."
    flutter build appbundle --release \
        --dart-define=ENV="$ENV_NAME" \
        --dart-define=SENTRY_DSN="$SENTRY_DSN" \
        --dart-define=MAPS_API_KEY="$MAPS_KEY" \
        --dart-define=MAPS_KEY="$MAPS_KEY"

    # ─── (اختياري) iOS ───
    if [[ "$(uname -s)" == "Darwin" ]]; then
        echo ""
        echo "▸ Building iOS IPA..."
        flutter build ipa --release \
            --dart-define=ENV="$ENV_NAME" \
            --dart-define=SENTRY_DSN="$SENTRY_DSN" \
            --dart-define=MAPS_API_KEY="$MAPS_KEY" \
            --dart-define=MAPS_KEY="$MAPS_KEY" \
            --export-options-plist=ios/ExportOptions.plist || \
            echo "⚠ iOS build فشل — تأكَّد من Xcode + provisioning"
    else
        echo "ℹ iOS build مُتخطَّى (يحتاج macOS)"
    fi

    cd - > /dev/null

    # ─── Summary ───
    echo ""
    echo "✓ ${APP_NAME^^} build مكتمل!"
    echo ""
    echo "Output:"
    find "$APP_DIR/build/app/outputs" -name "*.apk" -o -name "*.aab" 2>/dev/null | while read f; do
        SIZE=$(du -h "$f" | cut -f1)
        echo "  ${SIZE}  $f"
    done
}

case "$APP" in
    rider)
        build_app "rider" "$SENTRY_DSN_RIDER"
        ;;
    driver)
        build_app "driver" "$SENTRY_DSN_DRIVER"
        ;;
    all)
        build_app "rider" "$SENTRY_DSN_RIDER"
        build_app "driver" "$SENTRY_DSN_DRIVER"
        ;;
    *)
        echo "الاستخدام: $0 {rider|driver|all}"
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════"
echo "✓ كل البناءات مكتملة"
echo "════════════════════════════════════════════════"
echo ""
echo "الخطوات التالية:"
echo "  1. APK للتجربة: نقل ملف .apk للجوال وثبَّته"
echo "  2. للنشر على Play Store: ارفع .aab في Play Console"
echo "  3. للنشر على App Store: ارفع .ipa عبر Transporter أو Xcode"
