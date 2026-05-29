# HANCR Aurora — Premium Cinematic Design System

> v3 — تصميم مستوحى من رؤية المستخدم الجديدة (مايو 2026).
> **الـ Mood**: Premium luxury car app + neon glow + cinematic dark.

---

## 🎨 Color Tokens

### Background Layers (الأعمق → الأفتح)
| Token | Hex | Usage |
|-------|-----|-------|
| `obsidian` | `#0A0807` | الـ scaffold الرئيسي |
| `coal` | `#13100E` | bottom nav + sticky surfaces |
| `ash` | `#1F1A17` | cards عادية |
| `smoke` | `#2A2421` | cards فاتحة قليلاً + tiles |
| `stone` | `#3D3530` | hover/elevated |

### Brand — Ember Orange Glow
| Token | Hex | Usage |
|-------|-----|-------|
| `ember` | `#FF7A1A` | Primary CTA + selected states |
| `emberLight` | `#FF9D4D` | Glow halos + accents |
| `emberDeep` | `#E55F00` | Pressed states |
| `emberMute` | `#6B3920` | Backgrounds للـ selected tiles |

### Text Hierarchy
| Token | Hex | Usage |
|-------|-----|-------|
| `pearl` | `#FFF5EE` | Headlines + high-contrast |
| `textPrimary` | `#F5EDE7` | Body text |
| `textSecondary` | `#A89B96` | Subtitles + captions |
| `textHint` | `#6F635E` | Placeholders |
| `textDisabled` | `#4D4441` | Disabled states |

### Status & Promo
| Token | Hex | Usage |
|-------|-----|-------|
| `success` / `successGlow` | `#10B981` / `#34D399` | Success + Promo badges |
| `warning` | `#FFB547` | Warnings |
| `danger` / `dangerGlow` | `#FF4D4D` / `#FF6B6B` | SOS + destructive |
| `gold` | `#FFB547` | Loyalty premium tier |

---

## ✨ Shadows / Glows

| Shadow | Use case |
|--------|----------|
| `AuroraShadows.emberGlow` | Primary buttons, FAB |
| `AuroraShadows.selectionGlow` | Selected ride cards |
| `AuroraShadows.iconGlow` | Icon backgrounds, tab indicators |
| `AuroraShadows.dangerGlow` | SOS button |
| `AuroraShadows.cardDepth` | Elevated cards |
| `AuroraShadows.floatingNav` | Bottom nav bar |

---

## 📐 Spacing & Radius

```
xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, xxxl=32, huge=48
radius: xs=8, sm=12, md=16, lg=20, xl=24, xxl=32, pill=999
```

---

## 🧩 Aurora Widgets

| Widget | Description |
|--------|-------------|
| `AuroraButton` | Primary/secondary/ghost/danger + glow |
| `AuroraCard` | Normal/glass/elevated + selected ring |
| `AuroraIconTile` | Outlined orange icon + label + promo badge |
| `AuroraBottomNav` | 4 items + center FAB |
| `AuroraSearchBar` | "Where to?" pill |
| `AuroraTabSwitcher` | Animated tab switcher with glow |
| `AuroraBackground` | Page background with ember halo |
| `AuroraPromoCard` | Large promo card مع icon + gradient |

---

## 🖼️ Screens Migrated

### Rider App
| Screen | Status |
|--------|--------|
| Login (Phone) | ✅ `aurora_phone_screen.dart` |
| Home Tab | ✅ `aurora_home_tab.dart` |
| Main Navigation | ✅ `aurora_main_screen.dart` |
| Add Funds Sheet | ✅ `aurora_add_funds_sheet.dart` |
| Ride Picker | ✅ `aurora_ride_picker.dart` |
| Services Tab | ✅ (داخل main) |
| OTP Screen | ⏳ يحتاج port |
| Tracking | ⏳ يحتاج port |
| Profile | ⏳ يحتاج port |
| Wallet Screen | ⏳ يحتاج port |

### Driver App
| Screen | Status |
|--------|--------|
| All screens | ⏳ يحتاج تطبيق نفس الـ Aurora theme |

### Admin Panel
| Page | Status |
|------|--------|
| Dashboard | ⏳ يحتاج إعادة تصميم بـ dark cinematic theme |

---

## 📋 خطة الـ Migration الكاملة

### Phase A — Rider App (الأولوية الأعلى)
1. ✅ Theme + Widgets + Login + Home
2. ⏳ OTP Screen (مطابق للـ login)
3. ⏳ Booking flow (route selection + ride picker موجود)
4. ⏳ Tracking screen (driver location على map)
5. ⏳ Wallet screen (تطبيق نمط Add Funds)
6. ⏳ Profile + Loyalty
7. ⏳ SOS + Emergency contacts

### Phase B — Driver App
1. ⏳ Theme migration (نسخ aurora_theme.dart)
2. ⏳ Home/Online screen + driver SOS button
3. ⏳ Earnings + Wallet
4. ⏳ Order flow

### Phase C — Admin Panel
1. ⏳ Dark cinematic theme في Tailwind
2. ⏳ Dashboard مع ember accents
3. ⏳ SOS dashboard (مهم — يستفيد كثيراً من cinematic style)
4. ⏳ Live tracking dashboard

---

## 🚀 كيفية الاستخدام (للمطوِّر)

### استيراد الكل بسطر واحد
```dart
import 'package:hancr_rider/core/widgets/aurora/aurora.dart';
```

### مثال شاشة كاملة
```dart
@override
Widget build(BuildContext context) {
  return Scaffold(
    backgroundColor: AuroraColors.obsidian,
    body: AuroraBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AuroraSpacing.lg),
          children: [
            Text('عنواني', style: AuroraText.displayMedium),
            const SizedBox(height: AuroraSpacing.lg),
            AuroraCard(
              child: Text('محتوى البطاقة'),
            ),
            const SizedBox(height: AuroraSpacing.xl),
            AuroraButton.primary(
              label: 'متابعة',
              icon: Icons.arrow_forward,
              onPressed: () {},
            ),
          ],
        ),
      ),
    ),
  );
}
```

### Best Practices

1. **استخدم `AuroraText.*` بدل GoogleFonts** — يضمن consistency
2. **استخدم `AuroraSpacing.*` بدل أرقام hardcoded** — Grid 4pt
3. **في الـ glow**، استخدم `AuroraShadows.*` predefined — لا تنشئ shadows مخصصة
4. **Selected states** دائماً بـ `AuroraColors.ember + AuroraShadows.selectionGlow`
5. **Cards** افتراضياً `AuroraCardVariant.normal`. استخدم `glass` للـ overlays فقط.

---

## 🎯 الفرق عن التصميم القديم (HANCR Twilight)

| Aspect | Twilight v2 | Aurora v3 |
|--------|-------------|-----------|
| Primary | Violet `#B048FF` | Ember `#FF7A1A` |
| Background | Off-white `#FAFAFC` | Obsidian `#0A0807` |
| Mood | Modern, cool | Premium, cinematic, warm |
| Icons | Filled colored | Outlined neon glow |
| Cards | White بحدود | Dark بـ glassmorphism |
| Buttons | Flat | Glowing gradient |
| Style ref | Uber redesign 2024 | Luxury car premium apps |

---

## 🖼️ المراجع البصرية (من المستخدم)

الصور التي ألهمت هذا التصميم محفوظة في `E:/صور التطبيق/`:
- تسجيل الدخول.jpg → Login screen
- الصفحة الرئيسية 1+2.jpg → Home tab
- اختيار السيارة 1+2.jpg → Ride picker
- المحفظة.jpg → Add funds
- صفحة الخدمات.jpg → Services tab
- صفحة حساب المستخدم.jpg → Profile
- لوحة التحكم.jpg → Admin dashboard
