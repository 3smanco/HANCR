# HANCR — تحليل التصاميم وخطة إعادة التصميم

> **مصدر التحليل:** مكتبة `E:\UI` (40+ ملف Figma + PDF + 9 screenshots)
> **التاريخ:** 2026-05-27
> **الهدف:** استخراج أفضل أنماط Uber/Bolt/Careem ودمجها مع هوية HANCR

---

## 🔍 الأنماط المُستخرَجة من التصاميم

### 1️⃣ شاشة Home — Tab-Based Navigation
**ما رأيناه (Uber Home):**
- شريط علوي بـ tabs (Rides | Delivery) — كل tab له أيقونة + label
- شريط بحث كبير "Where to?" مع زر "Now ▾" لاختيار الوقت
- قائمة "Suggestions" أفقية بـ 4 خدمات (Ride, Scooter, Helicopter, Rental Cars) — كل واحدة بصورة + اسم
- بطاقات "More ways to use" — promo cards كبيرة بصور حقيقية
- Bottom Nav 4 tabs: Home, Browse, Activity, Account

**أفضل ما فيه:**
✅ Service icons أفقية = اكتشاف فوري للخدمات
✅ Search bar مركزي = الفعل الأهم
✅ Promo cards = upsell طبيعي
✅ "Now ▾" = جدولة سهلة بدون شاشة منفصلة

**ضعفه:**
❌ بعض الصور تبدو غير متناسقة الحجم
❌ المسافات بين الـ sections ضيقة

---

### 2️⃣ شاشة Pickup — Map-Focused
**ما رأيناه:**
- خريطة كاملة بـ route polyline (لون بنفسجي)
- pin نقطة الالتقاء (circle مع تموجات pulse animation)
- "Fastest route" tooltip فوق الـ route
- "4 min" badge ملوَّن بجانب البديل
- Bottom Sheet بـ "Confirm the pickup spot" + اسم النقطة + زر "Search"
- زر "Confirm Pickup" أسود ممتد بالعرض الكامل

**أفضل ما فيه:**
✅ الـ pulse animation حول الـ pin = جذب الانتباه بدون إزعاج
✅ بديل المسار "4 min slower" = شفافية كاملة
✅ Bottom sheet بسيط + CTA واحد واضح
✅ زر "Search" بجانب اسم النقطة = تصحيح سريع

---

### 3️⃣ شاشة Trip in Progress
**ما رأيناه:**
- نفس الخريطة + route
- Bottom Sheet: صورة السائق + صورة السيارة + رقم اللوحة + موديل
- شريط "Send a message" + 4 أيقونات (مصباح، بحث، شات، Report)
- زر "Complete" أسود
- Popup بـ 3 أزرار (في trip-end-3button-popup): "Send a message", "Report"

**أفضل ما فيه:**
✅ صور حقيقية للسائق والسيارة = ثقة
✅ Quick actions في صف واحد = وصول سريع
✅ زر Report مدمج = أمان دائم

**نقطة قوية جداً:**
- نظام "Incident Report" كامل مع submitting إلى Personal Case Representative
- زر "Uber Safety Report 2022" → شفافية وثقة

---

### 4️⃣ شاشة Settings — قائمة مجموعة
**ما رأيناه:**
- مجموعتان: "Profile Settings" و "Ride Settings"
- كل صف: title + chevron > على اليمين
- Subtitle رمادي تحت بعض الصفوف ("Quickly share your location...")
- "Sign Out" بالأحمر في الأسفل

**أفضل ما فيه:**
✅ تجميع منطقي للإعدادات (Profile vs Ride)
✅ Subtitle يشرح الميزة قبل أن يفتحها
✅ Sign Out بالأحمر في مكان واضح

---

### 5️⃣ Emergency Contact — Form Pattern
**ما رأيناه:**
- زر رجوع دائري ✕ في الزاوية
- عنوان "Add Emergency Contact"
- حقول: First Name, Last Name, Phone Number, Additional Information
- زر "Save" في الأسفل (بدون لون = secondary)

**أفضل ما فيه:**
✅ Form بسيط بدون تشتيت
✅ مساحات واسعة بين الحقول
✅ placeholder واضح "(000)-0120-1000"

---

### 6️⃣ Incident Report — Safety-First Design
**ما رأيناه:**
- شعار Uber + "Incident Report" في الأعلى
- Hero illustration (شخص يبلِّغ في شارع مظلم) = empathy
- "Confirm Trip Details" بـ thumbnails صغيرة (driver photo, car photo)
- "Your Personal Case Representative" = إنسانية في الردّ
- شعار "We at Uber promise to keep our users safe at all..."
- زر "Submit Report" أسود ممتد

**هذا أهم نمط رأيته** — الأمان هنا ليس "feature" بل تجربة كاملة بـ:
1. Illustration → empathy
2. Real human rep → ثقة
3. Promise statement → التزام
4. Confirmation screen → "Your Safety is our #1 importance"

---

## 🎨 هوية HANCR — البصمة الخاصة

### الألوان (Color System)

```dart
class HancrColors {
  // Primary — الهوية الأساسية
  static const navy    = Color(0xFF22223B);  // الأساس — خلفيات داكنة، headers
  static const violet  = Color(0xFFB048FF);  // الإجراء الأساسي — primary CTAs
  static const purple  = Color(0xFF4A4E69);  // ثانوي — subtitles, dividers
  static const cream   = Color(0xFFF2E9E4);  // الخلفية الفاتحة — clean canvas

  // Functional
  static const success    = Color(0xFF10B981);  // online، طلب مقبول
  static const warning    = Color(0xFFF59E0B);  // pending approval
  static const danger     = Color(0xFFEF4444);  // ban, cancel, SOS
  static const onlineGlow = Color(0xFF34D399);  // pulse animation للسائق online

  // Surface
  static const surface     = Color(0xFFFFFFFF);
  static const surfaceMute = Color(0xFFF8F9FB);
  static const border      = Color(0xFFE5E7EB);
  static const textPrimary = Color(0xFF111827);
  static const textMuted   = Color(0xFF6B7280);
}
```

### الفروقات عن Uber:
| العنصر | Uber | **HANCR** |
|--------|------|----------|
| CTA Color | أسود | **بنفسجي #B048FF** |
| Header | أبيض | **Navy داكن مع violet accents** |
| Personality | محايد قاسي | **دافئ بـ cream + violet** |
| Brand | حروف bold uppercase | **logo حرف H + Cairo Arabic font** |
| Identity | corporate | **Gulf-friendly مع RTL أولوية** |

---

## 📱 شاشات HANCR المُعاد تصميمها

### 1. Splash Screen
```
Background: Linear gradient (navy → violet)
Center: H logo (96x96) — animated scale from 0.8 → 1.0
Below logo: "HANCR" Cairo Bold 32sp white
Bottom: Loader violet (Lottie animation)
Tagline (after 1s fade-in): "نقل ذكي، توصيل سريع"
```

### 2. Onboarding — 3 Screens
**Screen 1: Rides** (illustration: شخص يستقل سيارة)
- العنوان: "اطلب سيارتك بضغطة زر"
- الوصف: "سائقون موثوقون، أسعار شفافة، وصول سريع"

**Screen 2: Delivery** (illustration: طرد مع موقع GPS)
- العنوان: "وصِّل أي شيء في أي مكان"
- الوصف: "من الطعام للأدوية للهدايا — تتبَّع لحظياً"

**Screen 3: Loyalty** (illustration: تاج مع مكافآت)
- العنوان: "اربح Hancr Miles مع كل رحلة"
- الوصف: "ترقَّى للمستوى الذهبي واحصل على مزايا حصرية"

CTA: زر "ابدأ الآن" violet + "تخطَّ" أبيض شفاف

### 3. Login (OTP-First)
```
الشكل:
┌─────────────────────────┐
│  ← (دائري شفاف)         │
│                         │
│    [H logo big violet]  │
│                         │
│    أهلاً بك في HANCR    │
│    سجِّل دخولك للمتابعة │
│                         │
│  ┌───────────────────┐  │
│  │ 🇸🇦 +966 |         │  │
│  │ 5XX XXX XXX        │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  متابعة            │ ← violet
│  └───────────────────┘  │
│                         │
│  بتسجيلك توافق على     │
│  الشروط وسياسة الخصوصية│
└─────────────────────────┘
```

### 4. Home (Rider) — Hybrid Pattern
**الجزء العلوي (Hero):**
- Greeting: "صباح الخير، أحمد 👋" مع avatar
- Notification bell بنقطة violet إذا فيه جديد

**شريط البحث الكبير:**
```
┌────────────────────────────────────┐
│ 🔍  إلى أين؟              ⏰ الآن ▾│
└────────────────────────────────────┘
```

**Service Grid (4 خدمات أساسية):**
```
🚗 Ride       🛵 Delivery
📦 Parcel     🏥 Medical
```
أيقونات كبيرة (72x72) مع violet glow عند الـ tap

**"اقتراحات لك" — Smart Suggestions:**
- بطاقات أفقية scrollable: "العودة للمنزل", "المكتب", "آخر وجهة"
- كل بطاقة بـ icon + اسم + متوسط الوقت

**Promotional Banner Carousel:**
- 3 بطاقات: "Hancr Miles", "ادعُ صديقاً واربح", "خدمة جديدة بمنطقتك"
- Auto-scroll كل 5 ثوان

**Bottom Nav (4 tabs):**
- 🏠 الرئيسية | 🎫 رحلاتي | 🏆 المكافآت | 👤 الحساب

### 5. Pickup Confirmation — Map + Bottom Sheet
**التحسينات على Uber:**
✅ Bottom sheet بـ rounded corners 24px فوق (دفء أكثر)
✅ Pin animation: pulse violet بدل أزرق
✅ "Confirm Pickup" زر violet بدل أسود
✅ زرّ شفاف "تعديل" بدل زرّ "Search" نصّي

```
[ MAP بـ route violet ]
┌────────────────────────────┐
│         ⬇️ drag handle      │
│                            │
│ 📍 نقطة الالتقاء          │
│ شارع الملك فهد، طابق 1    │
│                          ✏️│
│                            │
│ 💰 السعر التقديري: 25 ر.س │
│                            │
│ ┌────────────────────────┐ │
│ │   تأكيد الالتقاط       │ │ ← violet
│ └────────────────────────┘ │
└────────────────────────────┘
```

### 6. Service Picker — Choose Tier
**Pattern: Horizontal scroll cards (مثل Uber)**
```
┌──────┬──────┬──────┬──────┐
│ Eco  │ Reg  │ Plus │ XL   │
│ 🚗   │ 🚙   │ 🚘   │ 🚐   │
│ 18ر  │ 25ر  │ 35ر  │ 50ر  │
│ 3 min│ 2 min│ 4 min│ 6 min│
└──────┴──────┴──────┴──────┘
```
البطاقة المختارة: border violet + background فاتح violet
استخدام promo code link "أضف كود خصم"

### 7. Trip in Progress — Live Tracking
**التحسين الكبير:**
- صورة السائق دائرية كبيرة (64px) مع ring violet للـ "verified driver"
- "Send a message" tap → ينفتح inline chat (مثل WhatsApp lite)
- Quick Actions في صف: 📞 اتصال | 💬 رسالة | 🚨 طوارئ | ⭐ تقييم مُسبَق

**Dynamic Island Pattern (iOS):**
"AX451AX • 4 دقائق متبقية" مع ETA indicator — من Uber Dynamic Island reference

### 8. Trip End + Rating
**Layout:**
- Hero: صورة السيارة + "كيف كانت رحلتك مع جونسون؟"
- Star rating بـ 5 نجوم (tap to rate)
- إذا 4+ نجوم: "ما الذي أعجبك؟" tags (وقت، نظافة، قيادة)
- إذا 3 نجوم أو أقل: "ساعدنا في التحسين" + textarea
- Tip optional: 5ر، 10ر، 15ر، مخصص
- زر "إرسال التقييم" violet

### 9. Loyalty Tab (HANCR Miles) — البصمة المميزة
**هذا هو ما يميِّز HANCR عن Uber:**
```
┌────────────────────────────────┐
│ [Tier Badge: Gold 🥇]          │
│                                │
│ Hancr Miles: 2,450             │
│ ▓▓▓▓▓▓░░░░ 550 للماس           │
│                                │
└────────────────────────────────┘

🎁 المكافآت المتاحة:
┌─────────────┬─────────────┐
│ خصم 10%     │ ترقية مجانية│
│ على الرحلة  │ للـ Plus    │
│ 500 ميل     │ 800 ميل     │
└─────────────┴─────────────┘

📈 المستويات:
Bronze → Silver → Gold ✓ → Platinum → Diamond

⏳ آخر المعاملات:
- +50 ميل (رحلة من المطار)
- -300 ميل (خصم استُخدم)
```

### 10. Driver App — Captain Home
**الفرق الرئيسي:**
- Toggle "Online" كبير في الأعلى (مثل Uber Driver) — green glow عندما online
- بطاقة "أرباح اليوم": 125 ر.س + 8 رحلات
- بطاقة "Captain Stars": ⭐⭐⭐⭐ → "تبقَّى 12 رحلة للنجمة الذهبية"
- خريطة في الخلفية تُظهر heatmap للطلبات (demand zones)

### 11. Incoming Order Sheet (Driver)
**Pattern من Uber Driver:**
- Bottom sheet ينزل من الأسفل بسرعة + sound
- Countdown 15 ثانية (دائري violet)
- Pickup → Dropoff بـ map preview صغير
- المبلغ كبير: "32 ر.س"
- زرّان: "قبول" violet ممتد | "تجاهل" خفيف

### 12. Emergency / SOS — Safety-First (HANCR Identity)
**ما نأخذه من Uber Incident Report:**
✅ Hero illustration للـ empathy
✅ Personal Case Representative
✅ Safety promise statement

**ما نضيفه نحن:**
✅ زر SOS دائري أحمر متوهج (دائماً في أعلى الشاشة أثناء الرحلة)
✅ تكامل فوري مع 911 السعودية
✅ مشاركة الموقع الحي مع جهة الطوارئ المختارة
✅ "أنا بأمان" check-in كل 10 دقائق في الرحلات الليلية

```
┌──────────────────────────────────┐
│ 🚨 الطوارئ                       │
│                                  │
│ [Illustration: empathetic scene] │
│                                  │
│ هل أنت بأمان؟                   │
│                                  │
│ ┌────────────────────────────┐  │
│ │ 📞 اتصل بالشرطة (911)      │  │ ← أحمر كبير
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ 👨‍👩 شارك موقعي مع العائلة │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌────────────────────────────┐  │
│ │ 📝 إبلاغ عن حادثة          │  │
│ └────────────────────────────┘  │
│                                  │
│ مسؤولك الشخصي: محمد العتيبي     │
│ يرد خلال 3 دقائق ✓              │
└──────────────────────────────────┘
```

---

## 🎯 العناصر المميِّزة لـ HANCR (لا توجد في Uber)

### 1. **Server-Driven Theme**
كل لون وخط وأيقونة يأتي من admin-panel — تغيير الهوية لحظياً بدون تحديث التطبيق

### 2. **RTL Native**
كل المسافات والـ flex direction معكوسة تلقائياً للعربية — Uber لا يفعل ذلك بشكل جيد

### 3. **Loyalty First-Class**
Tab مستقل (مثل Apple Health) — في Uber مدفون في القائمة الجانبية

### 4. **Bid Mode Toggle**
خاصية HANCR الفريدة: في بعض المناطق، الراكب يقترح سعراً والسائقون يتقدمون بعروضهم
- Toggle في شاشة Service Picker: "🎯 Bid Mode"
- شاشة جديدة تعرض العروض الواردة في real-time

### 5. **Multi-Region & Multi-Currency**
العملة تتغير تلقائياً حسب المنطقة (SAR/QAR/AED/KWD)
شاشة "تغيير المنطقة" في Settings

---

## 🧭 خريطة الطريق للتطبيق

### المرحلة 1 (الآن — تحديث Flutter apps)
- [ ] إعادة بناء `lib/core/theme/app_theme.dart` بألوان HANCR المُحدَّثة
- [ ] إضافة `HancrIconography` كلاس يحتوي custom icons
- [ ] بناء `HancrComponents` library:
  - `HancrButton` (primary/secondary/danger/icon)
  - `HancrCard` (with shadows + rounded 16px)
  - `HancrBadge` (tier badges + status badges)
  - `HancrBottomSheet` (with violet drag handle)
  - `HancrInput` (with floating label)

### المرحلة 2 — Home Screens
- [ ] إعادة تصميم RiderHomeScreen بنمط Hero + Service Grid + Promo Carousel
- [ ] إعادة تصميم DriverHomeScreen بـ Online Toggle + Earnings + Heatmap

### المرحلة 3 — Trip Flow
- [ ] PickupConfirmationScreen (map-focused مع pulse animation)
- [ ] ServicePickerScreen (horizontal cards بـ tier selection)
- [ ] TripInProgressScreen (مع driver photo + quick actions)
- [ ] TripEndScreen (rating + tip + tags)

### المرحلة 4 — Safety & Loyalty
- [ ] SafetyHubScreen (SOS + emergency contacts + share location)
- [ ] LoyaltyTab (tier card + rewards + transactions)

### المرحلة 5 — Admin Panel
- [ ] إعادة تصميم Admin Panel بنفس الـ design system
- [ ] إضافة "Theme Editor" — color picker + live preview
- [ ] "Service Manager" — drag-and-drop لإضافة خدمات

---

## ✅ القرارات النهائية

| القرار | الاختيار |
|-------|---------|
| Primary Action Color | **Violet #B048FF** (بدل أسود Uber) |
| Header Style | **Navy gradient** مع violet accents |
| Card Radius | **16px** (بدل 8px Uber) — دفء أكثر |
| Typography | **Cairo (Arabic) + Inter (Latin)** |
| Animation Library | **Lottie + Rive** للـ illustrations |
| Map Style | **Custom Mapbox** بـ violet route line |
| Bottom Sheet | **24px rounded** مع violet drag handle |
| Empty States | **Custom illustrations** (مثل Uber Incident) |
| Safety Brand | **#1 Priority** — مرئي دائماً، ليس مخبأ |

---

## 🚀 الخطوة التالية المقترحة

**ابدأ بـ:**
1. `libs/flutter_common/lib/theme/hancr_theme.dart` — يحتوي كل الـ tokens
2. `libs/flutter_common/lib/widgets/` — مكتبة المكونات
3. إعادة بناء `rider-app/lib/screens/home/` كأول شاشة محدَّثة
4. اختبارها على المحاكي بصرياً
5. الانتقال للشاشات التالية بنفس النمط
