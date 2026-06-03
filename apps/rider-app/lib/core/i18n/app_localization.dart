import 'dart:ui';
import 'package:flutter/material.dart';
import '../services/storage_service.dart';

/// نظام تعدد اللغات لـ HANCR — 8 لغات.
/// البنية: مفتاح → { رمز اللغة: النص }.

class AppLanguage {
  final String code;
  final String nativeName;
  final String englishName;
  final bool rtl;
  const AppLanguage(this.code, this.nativeName, this.englishName, this.rtl);
}

const List<AppLanguage> kSupportedLanguages = [
  AppLanguage('ar', 'العربية', 'Arabic', true),
  AppLanguage('en', 'English', 'English', false),
  AppLanguage('ur', 'اردو', 'Urdu', true),
  AppLanguage('hi', 'हिन्दी', 'Hindi', false),
  AppLanguage('bn', 'বাংলা', 'Bengali', false),
  AppLanguage('fil', 'Filipino', 'Filipino', false),
  AppLanguage('fr', 'Français', 'French', false),
  AppLanguage('tr', 'Türkçe', 'Turkish', false),
];

List<Locale> get kSupportedLocales =>
    kSupportedLanguages.map((l) => Locale(l.code)).toList();

class LocaleController extends ValueNotifier<Locale> {
  LocaleController._() : super(const Locale('ar'));
  static final LocaleController instance = LocaleController._();

  Future<void> load() async {
    final saved = await StorageService.getLanguage();
    if (saved != null && _isSupported(saved)) {
      value = Locale(saved);
      return;
    }
    final deviceCode = PlatformDispatcher.instance.locale.languageCode;
    value = Locale(_isSupported(deviceCode) ? deviceCode : 'en');
  }

  Future<void> setLanguage(String code) async {
    if (!_isSupported(code)) return;
    value = Locale(code);
    await StorageService.saveLanguage(code);
  }

  bool _isSupported(String code) =>
      kSupportedLanguages.any((l) => l.code == code);

  AppLanguage get currentLanguage =>
      kSupportedLanguages.firstWhere((l) => l.code == value.languageCode,
          orElse: () => kSupportedLanguages.first);
}

/// دالة الترجمة: tr('key').
String tr(String key) {
  final code = LocaleController.instance.value.languageCode;
  final entry = _t[key];
  if (entry == null) return key;
  return entry[code] ?? entry['en'] ?? key;
}

// ════════════════════════════════════════════════════════════════
// جداول الترجمة (مفتاح → 8 لغات): ar, en, ur, hi, bn, fil, fr, tr
// ════════════════════════════════════════════════════════════════
const Map<String, Map<String, String>> _t = {
  // ─── Navigation ───
  'nav_home': {'ar': 'الرئيسية', 'en': 'Home', 'ur': 'ہوم', 'hi': 'होम', 'bn': 'হোম', 'fil': 'Home', 'fr': 'Accueil', 'tr': 'Ana Sayfa'},
  'nav_services': {'ar': 'الخدمات', 'en': 'Services', 'ur': 'خدمات', 'hi': 'सेवाएं', 'bn': 'সেবা', 'fil': 'Serbisyo', 'fr': 'Services', 'tr': 'Hizmetler'},
  'nav_activity': {'ar': 'النشاط', 'en': 'Activity', 'ur': 'سرگرمی', 'hi': 'गतिविधि', 'bn': 'কার্যকলাপ', 'fil': 'Aktibidad', 'fr': 'Activité', 'tr': 'Etkinlik'},
  'nav_account': {'ar': 'حسابي', 'en': 'Account', 'ur': 'اکاؤنٹ', 'hi': 'खाता', 'bn': 'অ্যাকাউন্ট', 'fil': 'Account', 'fr': 'Compte', 'tr': 'Hesap'},

  // ─── Common ───
  'confirm': {'ar': 'تأكيد', 'en': 'Confirm', 'ur': 'تصدیق کریں', 'hi': 'पुष्टि करें', 'bn': 'নিশ্চিত করুন', 'fil': 'Kumpirmahin', 'fr': 'Confirmer', 'tr': 'Onayla'},
  'cancel': {'ar': 'إلغاء', 'en': 'Cancel', 'ur': 'منسوخ', 'hi': 'रद्द करें', 'bn': 'বাতিল', 'fil': 'Kanselahin', 'fr': 'Annuler', 'tr': 'İptal'},
  'save': {'ar': 'حفظ', 'en': 'Save', 'ur': 'محفوظ کریں', 'hi': 'सहेजें', 'bn': 'সংরক্ষণ', 'fil': 'I-save', 'fr': 'Enregistrer', 'tr': 'Kaydet'},
  'retry': {'ar': 'إعادة المحاولة', 'en': 'Retry', 'ur': 'دوبارہ کوشش', 'hi': 'पुनः प्रयास', 'bn': 'আবার চেষ্টা', 'fil': 'Subukan ulit', 'fr': 'Réessayer', 'tr': 'Tekrar dene'},
  'ok': {'ar': 'حسناً', 'en': 'OK', 'ur': 'ٹھیک ہے', 'hi': 'ठीक है', 'bn': 'ঠিক আছে', 'fil': 'OK', 'fr': 'OK', 'tr': 'Tamam'},
  'comingSoon': {'ar': 'قريباً', 'en': 'Coming soon', 'ur': 'جلد آ رہا ہے', 'hi': 'जल्द आ रहा है', 'bn': 'শীঘ্রই আসছে', 'fil': 'Malapit na', 'fr': 'Bientôt', 'tr': 'Yakında'},
  'delete': {'ar': 'حذف', 'en': 'Delete', 'ur': 'حذف', 'hi': 'हटाएं', 'bn': 'মুছুন', 'fil': 'Tanggalin', 'fr': 'Supprimer', 'tr': 'Sil'},
  'skip': {'ar': 'تخطّي', 'en': 'Skip', 'ur': 'چھوڑ دیں', 'hi': 'छोड़ें', 'bn': 'এড়িয়ে যান', 'fil': 'Laktawan', 'fr': 'Passer', 'tr': 'Atla'},
  'driver': {'ar': 'السائق', 'en': 'Driver', 'ur': 'ڈرائیور', 'hi': 'ड्राइवर', 'bn': 'চালক', 'fil': 'Drayber', 'fr': 'Chauffeur', 'tr': 'Sürücü'},
  'loadError': {'ar': 'حدث خطأ في تحميل البيانات', 'en': 'Failed to load data', 'ur': 'ڈیٹا لوڈ کرنے میں خرابی', 'hi': 'डेटा लोड करने में त्रुटि', 'bn': 'ডেটা লোড করতে ব্যর্থ', 'fil': 'Nabigong i-load ang data', 'fr': 'Échec du chargement', 'tr': 'Veri yüklenemedi'},

  // ─── Home ───
  'greeting': {'ar': 'مرحباً بك 👋', 'en': 'Welcome 👋', 'ur': 'خوش آمدید 👋', 'hi': 'स्वागत है 👋', 'bn': 'স্বাগতম 👋', 'fil': 'Maligayang pagdating 👋', 'fr': 'Bienvenue 👋', 'tr': 'Hoş geldiniz 👋'},
  'whereToGo': {'ar': 'إلى أين تريد الذهاب؟', 'en': 'Where do you want to go?', 'ur': 'آپ کہاں جانا چاہتے ہیں؟', 'hi': 'आप कहाँ जाना चाहते हैं?', 'bn': 'আপনি কোথায় যেতে চান?', 'fil': 'Saan mo gustong pumunta?', 'fr': 'Où voulez-vous aller ?', 'tr': 'Nereye gitmek istiyorsunuz?'},
  'whereTo': {'ar': 'إلى أين؟', 'en': 'Where to?', 'ur': 'کہاں جانا ہے؟', 'hi': 'कहाँ जाना है?', 'bn': 'কোথায় যাবেন?', 'fil': 'Saan?', 'fr': 'Où aller ?', 'tr': 'Nereye?'},
  'now': {'ar': 'الآن', 'en': 'Now', 'ur': 'ابھی', 'hi': 'अभी', 'bn': 'এখন', 'fil': 'Ngayon', 'fr': 'Maintenant', 'tr': 'Şimdi'},
  'homePlace': {'ar': 'المنزل', 'en': 'Home', 'ur': 'گھر', 'hi': 'घर', 'bn': 'বাড়ি', 'fil': 'Bahay', 'fr': 'Maison', 'tr': 'Ev'},
  'suggestions': {'ar': 'اقتراحات', 'en': 'Suggestions', 'ur': 'تجاویز', 'hi': 'सुझाव', 'bn': 'পরামর্শ', 'fil': 'Mga mungkahi', 'fr': 'Suggestions', 'tr': 'Öneriler'},
  'viewAll': {'ar': 'عرض الكل', 'en': 'View all', 'ur': 'سب دیکھیں', 'hi': 'सभी देखें', 'bn': 'সব দেখুন', 'fil': 'Tingnan lahat', 'fr': 'Voir tout', 'tr': 'Tümünü gör'},
  'ride': {'ar': 'رحلة', 'en': 'Ride', 'ur': 'سواری', 'hi': 'राइड', 'bn': 'রাইড', 'fil': 'Sakay', 'fr': 'Course', 'tr': 'Yolculuk'},
  'bike': {'ar': 'دراجة', 'en': 'Bike', 'ur': 'بائیک', 'hi': 'बाइक', 'bn': 'বাইক', 'fil': 'Bisikleta', 'fr': 'Vélo', 'tr': 'Bisiklet'},
  'parcel': {'ar': 'طرد', 'en': 'Parcel', 'ur': 'پارسل', 'hi': 'पार्सल', 'bn': 'পার্সেল', 'fil': 'Parcel', 'fr': 'Colis', 'tr': 'Paket'},
  'rental': {'ar': 'تأجير', 'en': 'Rental', 'ur': 'کرایہ', 'hi': 'किराया', 'bn': 'ভাড়া', 'fil': 'Rental', 'fr': 'Location', 'tr': 'Kiralama'},
  'otherWays': {'ar': 'طرق أخرى للتنقل', 'en': 'More ways to move', 'ur': 'سفر کے مزید طریقے', 'hi': 'यात्रा के अन्य तरीके', 'bn': 'চলাচলের আরও উপায়', 'fil': 'Iba pang paraan', 'fr': 'Autres moyens', 'tr': 'Diğer ulaşım yolları'},
  'luxury': {'ar': 'سفر فاخر', 'en': 'Luxury travel', 'ur': 'پُرتعیش سفر', 'hi': 'लक्ज़री यात्रा', 'bn': 'বিলাসবহুল ভ্রমণ', 'fil': 'Luxury na biyahe', 'fr': 'Voyage de luxe', 'tr': 'Lüks yolculuk'},
  'luxurySub': {'ar': 'سيارات فخمة عالية الفئة', 'en': 'High-end premium cars', 'ur': 'اعلیٰ درجے کی گاڑیاں', 'hi': 'उच्च श्रेणी की कारें', 'bn': 'উচ্চমানের গাড়ি', 'fil': 'Mga high-end na sasakyan', 'fr': 'Voitures haut de gamme', 'tr': 'Üst sınıf araçlar'},
  'electric': {'ar': 'كهربائية', 'en': 'Electric', 'ur': 'الیکٹرک', 'hi': 'इलेक्ट्रिक', 'bn': 'বৈদ্যুতিক', 'fil': 'Electric', 'fr': 'Électrique', 'tr': 'Elektrikli'},
  'electricSub': {'ar': 'دلِّل نفسك بسيارة EV', 'en': 'Treat yourself to an EV', 'ur': 'EV کا لطف اٹھائیں', 'hi': 'EV का आनंद लें', 'bn': 'একটি EV উপভোগ করুন', 'fil': 'Subukan ang EV', 'fr': 'Offrez-vous un VE', 'tr': 'Kendinize bir EV ısmarlayın'},

  // ─── Commuter (اشتراك يومي/شهري للموظفين والطلاب) ───
  'commuter': {'ar': 'اشتراك يومي', 'en': 'Commuter', 'ur': 'یومیہ سواری', 'hi': 'दैनिक राइड', 'bn': 'নিয়মিত যাত্রা', 'fil': 'Pang-araw-araw na biyahe', 'fr': 'Trajets quotidiens', 'tr': 'Günlük yolculuk'},
  'commuterSub': {'ar': 'للموظفين والطلاب — حجز تلقائي', 'en': 'For workers & students — auto-book', 'ur': 'ملازمین/طلبہ کے لیے — خودکار', 'hi': 'कर्मचारी/छात्रों के लिए — ऑटो', 'bn': 'কর্মী/ছাত্রদের জন্য — স্বয়ংক্রিয়', 'fil': 'Para sa empleyado/estudyante', 'fr': 'Employés & étudiants — auto', 'tr': 'Çalışan/öğrenci — otomatik'},
  'commuterEmpty': {'ar': 'لا توجد اشتراكات بعد', 'en': 'No subscriptions yet', 'ur': 'ابھی کوئی سبسکرپشن نہیں', 'hi': 'अभी कोई सदस्यता नहीं', 'bn': 'এখনও কোনো সাবস্ক্রিপশন নেই', 'fil': 'Wala pang subscription', 'fr': 'Aucun abonnement', 'tr': 'Henüz abonelik yok'},
  'commuterEmptyHint': {'ar': 'أنشئ اشتراكاً يحجز رحلاتك تلقائياً كل يوم', 'en': 'Create a subscription that auto-books your daily rides', 'ur': 'اشتراک بنائیں جو روزانہ سواری خودکار بک کرے', 'hi': 'दैनिक राइड को ऑटो-बुक करने वाली सदस्यता बनाएं', 'bn': 'প্রতিদিনের রাইড অটো-বুক করার সাবস্ক্রিপশন তৈরি করুন', 'fil': 'Gumawa ng auto-book na biyahe araw-araw', 'fr': 'Créez un abonnement qui réserve vos trajets quotidiens', 'tr': 'Yolculuğunuzu otomatik rezerve eden bir abonelik oluşturun'},
  'createCommuter': {'ar': 'إنشاء اشتراك', 'en': 'Create subscription', 'ur': 'سبسکرپشن بنائیں', 'hi': 'सदस्यता बनाएं', 'bn': 'সাবস্ক্রিপশন তৈরি করুন', 'fil': 'Lumikha ng subscription', 'fr': 'Créer un abonnement', 'tr': 'Abonelik oluştur'},
  'locations': {'ar': 'المواقع', 'en': 'Locations', 'ur': 'مقامات', 'hi': 'स्थान', 'bn': 'অবস্থান', 'fil': 'Mga lokasyon', 'fr': 'Lieux', 'tr': 'Konumlar'},
  'home': {'ar': 'المنزل', 'en': 'Home', 'ur': 'گھر', 'hi': 'घर', 'bn': 'বাড়ি', 'fil': 'Bahay', 'fr': 'Domicile', 'tr': 'Ev'},
  'work': {'ar': 'العمل/الدراسة', 'en': 'Work/School', 'ur': 'کام/تعلیم', 'hi': 'काम/स्कूल', 'bn': 'কাজ/স্কুল', 'fil': 'Trabaho/Paaralan', 'fr': 'Travail/École', 'tr': 'İş/Okul'},
  'pickPlace': {'ar': 'اختر مكاناً', 'en': 'Pick a place', 'ur': 'جگہ منتخب کریں', 'hi': 'स्थान चुनें', 'bn': 'একটি স্থান বাছুন', 'fil': 'Pumili ng lugar', 'fr': 'Choisir un lieu', 'tr': 'Bir yer seç'},
  'chooseHome': {'ar': 'اختر المنزل', 'en': 'Choose home', 'ur': 'گھر منتخب کریں', 'hi': 'घर चुनें', 'bn': 'বাড়ি বাছুন', 'fil': 'Piliin ang bahay', 'fr': 'Choisir domicile', 'tr': 'Evi seç'},
  'chooseWork': {'ar': 'اختر العمل', 'en': 'Choose work', 'ur': 'کام منتخب کریں', 'hi': 'काम चुनें', 'bn': 'কাজ বাছুন', 'fil': 'Piliin ang trabaho', 'fr': 'Choisir travail', 'tr': 'İşi seç'},
  'pickHomeAndWork': {'ar': 'اختر المنزل والعمل أولاً', 'en': 'Pick home and work first', 'ur': 'پہلے گھر اور کام منتخب کریں', 'hi': 'पहले घर और काम चुनें', 'bn': 'আগে বাড়ি ও কাজ বাছুন', 'fil': 'Pumili muna ng bahay at trabaho', 'fr': 'Choisissez d\'abord domicile et travail', 'tr': 'Önce ev ve işi seç'},
  'legsAndTimes': {'ar': 'الاتجاهات والأوقات', 'en': 'Legs & times', 'ur': 'سمت اور اوقات', 'hi': 'दिशा और समय', 'bn': 'দিক ও সময়', 'fil': 'Direksiyon at oras', 'fr': 'Trajets et heures', 'tr': 'Yön ve saatler'},
  'outbound': {'ar': 'ذهاب', 'en': 'Outbound', 'ur': 'جانا', 'hi': 'जाना', 'bn': 'যাওয়া', 'fil': 'Pagpunta', 'fr': 'Aller', 'tr': 'Gidiş'},
  'returnLeg': {'ar': 'عودة', 'en': 'Return', 'ur': 'واپسی', 'hi': 'वापसी', 'bn': 'ফেরা', 'fil': 'Pag-uwi', 'fr': 'Retour', 'tr': 'Dönüş'},
  'pickAtLeastOneLeg': {'ar': 'فعّل ذهاباً أو عودةً على الأقل', 'en': 'Enable at least outbound or return', 'ur': 'کم از کم ایک سمت فعال کریں', 'hi': 'कम से कम एक दिशा सक्षम करें', 'bn': 'অন্তত একটি দিক সক্রিয় করুন', 'fil': 'Buksan kahit isa', 'fr': 'Activez aller ou retour', 'tr': 'En az birini etkinleştir'},
  'daysOfWeek': {'ar': 'أيام الأسبوع', 'en': 'Days of week', 'ur': 'دنوں', 'hi': 'सप्ताह के दिन', 'bn': 'সপ্তাহের দিন', 'fil': 'Mga araw', 'fr': 'Jours', 'tr': 'Günler'},
  'pickAtLeastOneDay': {'ar': 'اختر يوماً واحداً على الأقل', 'en': 'Pick at least one day', 'ur': 'کم از کم ایک دن منتخب کریں', 'hi': 'कम से कम एक दिन चुनें', 'bn': 'অন্তত একটি দিন বাছুন', 'fil': 'Pumili ng kahit isang araw', 'fr': 'Choisissez au moins un jour', 'tr': 'En az bir gün seç'},
  'planType': {'ar': 'نوع الخطة', 'en': 'Plan type', 'ur': 'پلان قسم', 'hi': 'योजना', 'bn': 'প্ল্যান', 'fil': 'Uri ng plano', 'fr': 'Type d\'abonnement', 'tr': 'Plan türü'},
  'plan_daily': {'ar': 'يومي', 'en': 'Daily', 'ur': 'یومیہ', 'hi': 'दैनिक', 'bn': 'দৈনিক', 'fil': 'Araw-araw', 'fr': 'Quotidien', 'tr': 'Günlük'},
  'plan_monthly': {'ar': 'شهري', 'en': 'Monthly', 'ur': 'ماہانہ', 'hi': 'मासिक', 'bn': 'মাসিক', 'fil': 'Buwanan', 'fr': 'Mensuel', 'tr': 'Aylık'},
  'active': {'ar': 'مفعّل', 'en': 'Active', 'ur': 'فعال', 'hi': 'सक्रिय', 'bn': 'সক্রিয়', 'fil': 'Aktibo', 'fr': 'Actif', 'tr': 'Aktif'},
  'paused': {'ar': 'موقوف', 'en': 'Paused', 'ur': 'روک دیا', 'hi': 'रुका हुआ', 'bn': 'বিরতিতে', 'fil': 'Naka-pause', 'fr': 'En pause', 'tr': 'Duraklatıldı'},
  'noServiceAvailable': {'ar': 'لا توجد خدمة متاحة', 'en': 'No service available', 'ur': 'کوئی سروس دستیاب نہیں', 'hi': 'कोई सेवा उपलब्ध नहीं', 'bn': 'কোনো সেবা নেই', 'fil': 'Walang serbisyo', 'fr': 'Aucun service disponible', 'tr': 'Hizmet yok'},
  'commuterLeadHint': {'ar': 'سيتم إنشاء الطلب تلقائياً قبل الموعد بـ 10 دقائق', 'en': 'A ride will be auto-booked 10 minutes before the time', 'ur': 'وقت سے 10 منٹ پہلے سواری خودکار بُک ہو گی', 'hi': '10 मिनट पहले राइड ऑटो-बुक होगी', 'bn': '১০ মিনিট আগে রাইড স্বয়ংক্রিয়ভাবে বুক হবে', 'fil': 'I-aauto-book ang biyahe 10 minuto bago ang oras', 'fr': 'Une course sera réservée 10 min avant', 'tr': 'Yolculuk 10 dakika önceden otomatik ayarlanır'},

  // ─── Phase D: subscription types ───
  'subType_commuter': {'ar': 'اشتراك يومي', 'en': 'Commuter', 'ur': 'یومیہ سواری', 'hi': 'दैनिक राइड', 'bn': 'নিয়মিত যাত্রা', 'fil': 'Pang-araw-araw', 'fr': 'Trajets quotidiens', 'tr': 'Günlük yolculuk'},
  'subType_school': {'ar': 'النقل المدرسي', 'en': 'School Ride', 'ur': 'اسکول سواری', 'hi': 'स्कूल राइड', 'bn': 'স্কুল রাইড', 'fil': 'Sakay sa paaralan', 'fr': 'Transport scolaire', 'tr': 'Okul yolculuğu'},
  'subType_campus': {'ar': 'النقل الجامعي', 'en': 'Campus Pass', 'ur': 'یونیورسٹی سواری', 'hi': 'कॉलेज राइड', 'bn': 'ক্যাম্পাস রাইড', 'fil': 'Sakay sa kampus', 'fr': 'Transport universitaire', 'tr': 'Kampüs yolculuğu'},
  'subType_medical': {'ar': 'النقل الطبي', 'en': 'Medical Rides', 'ur': 'طبی سواری', 'hi': 'मेडिकल राइड', 'bn': 'মেডিকেল রাইড', 'fil': 'Medikal na sakay', 'fr': 'Transport médical', 'tr': 'Tıbbi yolculuk'},
  'subType_vip': {'ar': 'VIP', 'en': 'VIP', 'ur': 'وی آئی پی', 'hi': 'VIP', 'bn': 'ভিআইপি', 'fil': 'VIP', 'fr': 'VIP', 'tr': 'VIP'},

  'childInfo': {'ar': 'بيانات الطفل', 'en': 'Child info', 'ur': 'بچے کی معلومات', 'hi': 'बच्चे की जानकारी', 'bn': 'শিশুর তথ্য', 'fil': 'Impormasyon ng bata', 'fr': 'Infos enfant', 'tr': 'Çocuk bilgileri'},
  'childName': {'ar': 'اسم الطفل', 'en': 'Child name', 'ur': 'بچے کا نام', 'hi': 'बच्चे का नाम', 'bn': 'শিশুর নাম', 'fil': 'Pangalan ng bata', 'fr': 'Nom de l\'enfant', 'tr': 'Çocuk adı'},
  'parentPhone': {'ar': 'هاتف وليّ الأمر (احتياطي)', 'en': 'Parent phone (backup)', 'ur': 'سرپرست کا فون', 'hi': 'अभिभावक फ़ोन', 'bn': 'অভিভাবকের ফোন', 'fil': 'Telepono ng magulang', 'fr': 'Téléphone parent', 'tr': 'Veli telefonu'},

  'medicalInfo': {'ar': 'البيانات الطبية', 'en': 'Medical info', 'ur': 'طبی معلومات', 'hi': 'चिकित्सा जानकारी', 'bn': 'চিকিৎসা তথ্য', 'fil': 'Impormasyong medikal', 'fr': 'Infos médicales', 'tr': 'Tıbbi bilgi'},
  'medicalNotesHint': {'ar': 'ملاحظات للسائق (إعاقة، حالة، …)', 'en': 'Notes for driver (disability, condition, …)', 'ur': 'ڈرائیور کے لیے نوٹس', 'hi': 'ड्राइवर के लिए नोट्स', 'bn': 'ড্রাইভারের জন্য নোট', 'fil': 'Mga tala para sa drayber', 'fr': 'Notes pour le chauffeur', 'tr': 'Sürücüye notlar'},
  'wheelchairNeeded': {'ar': 'يحتاج كرسيّاً متحرّكاً', 'en': 'Wheelchair needed', 'ur': 'وہیل چیئر چاہیے', 'hi': 'व्हीलचेयर चाहिए', 'bn': 'হুইলচেয়ার প্রয়োজন', 'fil': 'Kailangan ng wheelchair', 'fr': 'Fauteuil roulant nécessaire', 'tr': 'Tekerlekli sandalye gerekli'},
  'recurrence': {'ar': 'التكرار', 'en': 'Recurrence', 'ur': 'تکرار', 'hi': 'पुनरावृत्ति', 'bn': 'পুনরাবৃত্তি', 'fil': 'Pag-uulit', 'fr': 'Récurrence', 'tr': 'Yineleme'},
  'recur_daily': {'ar': 'يومياً', 'en': 'Daily', 'ur': 'روزانہ', 'hi': 'दैनिक', 'bn': 'প্রতিদিন', 'fil': 'Araw-araw', 'fr': 'Quotidien', 'tr': 'Günlük'},
  'recur_weekly': {'ar': 'أسبوعياً', 'en': 'Weekly', 'ur': 'ہفتہ وار', 'hi': 'साप्ताहिक', 'bn': 'সাপ্তাহিক', 'fil': 'Lingguhan', 'fr': 'Hebdomadaire', 'tr': 'Haftalık'},
  'recur_biweekly': {'ar': 'كل أسبوعين', 'en': 'Biweekly', 'ur': 'ہر دو ہفتے', 'hi': 'पाक्षिक', 'bn': 'দ্বি-সাপ্তাহিক', 'fil': 'Tuwing dalawang linggo', 'fr': 'Bi-hebdomadaire', 'tr': 'İki haftalık'},
  'recur_monthly': {'ar': 'شهرياً', 'en': 'Monthly', 'ur': 'ماہانہ', 'hi': 'मासिक', 'bn': 'মাসিক', 'fil': 'Buwanan', 'fr': 'Mensuel', 'tr': 'Aylık'},

  // ─── Phase D: Airport Pickup ───
  'airportPickup': {'ar': 'استقبال من المطار', 'en': 'Airport Pickup', 'ur': 'ایئرپورٹ پک اپ', 'hi': 'एयरपोर्ट पिकअप', 'bn': 'বিমানবন্দর পিকআপ', 'fil': 'Pagsundo sa paliparan', 'fr': 'Accueil aéroport', 'tr': 'Havalimanı karşılama'},
  'trackNewFlight': {'ar': 'تتبّع رحلة جديدة', 'en': 'Track a new flight', 'ur': 'نئی پرواز کا ٹریک', 'hi': 'नई फ्लाइट ट्रैक करें', 'bn': 'নতুন ফ্লাইট ট্র্যাক', 'fil': 'I-track ang flight', 'fr': 'Suivre un nouveau vol', 'tr': 'Yeni uçuş takip et'},
  'myTrackings': {'ar': 'تتبّعاتي', 'en': 'My trackings', 'ur': 'میری ٹریکنگ', 'hi': 'मेरी ट्रैकिंग', 'bn': 'আমার ট্র্যাকিং', 'fil': 'Aking trackings', 'fr': 'Mes suivis', 'tr': 'Takiplerim'},
  'noTrackings': {'ar': 'لا توجد تتبّعات حالياً', 'en': 'No active trackings', 'ur': 'کوئی ٹریکنگ نہیں', 'hi': 'कोई ट्रैकिंग नहीं', 'bn': 'কোনো ট্র্যাকিং নেই', 'fil': 'Walang tracking', 'fr': 'Aucun suivi', 'tr': 'Takip yok'},
  'flightNumberInvalid': {'ar': 'رقم الرحلة غير صحيح', 'en': 'Invalid flight number', 'ur': 'پرواز نمبر غلط', 'hi': 'अमान्य फ्लाइट नंबर', 'bn': 'অবৈধ ফ্লাইট নম্বর', 'fil': 'Maling flight number', 'fr': 'Numéro de vol invalide', 'tr': 'Geçersiz uçuş no'},
  'pickPickupPlace': {'ar': 'اختر وجهة التوصيل', 'en': 'Pick pickup destination', 'ur': 'ڈراپ آف منتخب کریں', 'hi': 'ड्रॉप-ऑफ चुनें', 'bn': 'গন্তব্য বাছুন', 'fil': 'Pumili ng destinasyon', 'fr': 'Choisir la destination', 'tr': 'Hedef seç'},
  'startTracking': {'ar': 'ابدأ التتبّع', 'en': 'Start tracking', 'ur': 'ٹریکنگ شروع کریں', 'hi': 'ट्रैकिंग शुरू करें', 'bn': 'ট্র্যাকিং শুরু', 'fil': 'Simulan ang tracking', 'fr': 'Démarrer le suivi', 'tr': 'Takibi başlat'},
  'airportLeadHint': {'ar': 'سنحجز السيارة تلقائياً قبل وصول طائرتك بـ 30 دقيقة', 'en': 'A ride will be auto-booked 30 minutes before your flight arrives', 'ur': 'پرواز کے 30 منٹ پہلے گاڑی خودکار بک ہو گی', 'hi': 'फ्लाइट से 30 मिनट पहले ऑटो-बुक', 'bn': 'ফ্লাইটের ৩০ মিনিট আগে অটো-বুক', 'fil': 'Auto-book 30 minuto bago dumating ang flight', 'fr': 'Une course sera réservée 30 min avant l\'arrivée', 'tr': 'Uçuş varışından 30 dakika önce otomatik rezerve edilir'},
  'flightTracked': {'ar': 'بدأ تتبّع الرحلة', 'en': 'Flight tracking started', 'ur': 'پرواز کی ٹریکنگ شروع', 'hi': 'फ्लाइट ट्रैकिंग शुरू हुई', 'bn': 'ফ্লাইট ট্র্যাকিং শুরু', 'fil': 'Nagsimula ang flight tracking', 'fr': 'Suivi de vol démarré', 'tr': 'Uçuş takibi başlatıldı'},
  'flight_status': {'ar': 'الحالة', 'en': 'Status', 'ur': 'حالت', 'hi': 'स्थिति', 'bn': 'অবস্থা', 'fil': 'Status', 'fr': 'Statut', 'tr': 'Durum'},
  'flight_tracking': {'ar': 'يُتتبَّع', 'en': 'Tracking', 'ur': 'ٹریکنگ', 'hi': 'ट्रैकिंग', 'bn': 'ট্র্যাকিং', 'fil': 'Sinusubaybayan', 'fr': 'Suivi', 'tr': 'Takip ediliyor'},
  'flight_scheduled': {'ar': 'محجوزة', 'en': 'Scheduled', 'ur': 'شیڈول', 'hi': 'अनुसूचित', 'bn': 'নির্ধারিত', 'fil': 'Naka-iskedyul', 'fr': 'Planifié', 'tr': 'Planlandı'},
  'flight_completed': {'ar': 'مكتملة', 'en': 'Completed', 'ur': 'مکمل', 'hi': 'पूर्ण', 'bn': 'সম্পন্ন', 'fil': 'Tapos na', 'fr': 'Terminé', 'tr': 'Tamamlandı'},
  'flight_cancelled': {'ar': 'ملغاة', 'en': 'Cancelled', 'ur': 'منسوخ', 'hi': 'रद्द', 'bn': 'বাতিল', 'fil': 'Kanselado', 'fr': 'Annulé', 'tr': 'İptal'},
  'scheduleTitle': {'ar': 'احجز رحلة\nبجدولك', 'en': 'Schedule\na ride', 'ur': 'سواری شیڈول\nکریں', 'hi': 'राइड\nशेड्यूल करें', 'bn': 'রাইড\nশিডিউল করুন', 'fil': 'Mag-iskedyul\nng sakay', 'fr': 'Planifier\nune course', 'tr': 'Yolculuk\nplanla'},
  'scheduleSub': {'ar': 'حدِّد موعداً مسبقاً لرحلتك', 'en': 'Plan your ride in advance', 'ur': 'اپنی سواری پہلے سے طے کریں', 'hi': 'अपनी राइड पहले से तय करें', 'bn': 'আগে থেকে আপনার রাইড পরিকল্পনা করুন', 'fil': 'Planuhin ang sakay nang maaga', 'fr': 'Planifiez votre course à l\'avance', 'tr': 'Yolculuğunuzu önceden planlayın'},
  'offers': {'ar': 'العروض والتخفيضات', 'en': 'Offers & discounts', 'ur': 'آفرز اور رعایتیں', 'hi': 'ऑफ़र और छूट', 'bn': 'অফার ও ছাড়', 'fil': 'Mga alok at diskwento', 'fr': 'Offres et réductions', 'tr': 'Teklifler ve indirimler'},
  'offersTitle': {'ar': 'العروض', 'en': 'Offers', 'ur': 'آفرز', 'hi': 'ऑफ़र', 'bn': 'অফার', 'fil': 'Mga alok', 'fr': 'Offres', 'tr': 'Teklifler'},

  // ─── Services tab ───
  'goAnywhere': {'ar': 'انتقل لأي مكان', 'en': 'Go anywhere', 'ur': 'کہیں بھی جائیں', 'hi': 'कहीं भी जाएं', 'bn': 'যেকোনো জায়গায় যান', 'fil': 'Pumunta kahit saan', 'fr': 'Allez partout', 'tr': 'Her yere gidin'},
  'deliverAnything': {'ar': 'أوصِل أي شيء', 'en': 'Deliver anything', 'ur': 'کچھ بھی بھیجیں', 'hi': 'कुछ भी भेजें', 'bn': 'যেকোনো কিছু পাঠান', 'fil': 'Maghatid ng kahit ano', 'fr': 'Livrez tout', 'tr': 'Her şeyi gönderin'},
  'scheduledRide': {'ar': 'حجز مسبق', 'en': 'Scheduled', 'ur': 'پیشگی بکنگ', 'hi': 'शेड्यूल्ड', 'bn': 'নির্ধারিত', 'fil': 'Naka-iskedyul', 'fr': 'Planifié', 'tr': 'Planlı'},
  'groupRide': {'ar': 'رحلة جماعية', 'en': 'Group ride', 'ur': 'گروپ سواری', 'hi': 'ग्रुप राइड', 'bn': 'গ্রুপ রাইড', 'fil': 'Group ride', 'fr': 'Course groupée', 'tr': 'Grup yolculuğu'},
  'hourly': {'ar': 'بالساعة', 'en': 'Hourly', 'ur': 'گھنٹہ وار', 'hi': 'घंटे के हिसाब से', 'bn': 'ঘণ্টাভিত্তিক', 'fil': 'Oras-oras', 'fr': 'À l\'heure', 'tr': 'Saatlik'},
  'students': {'ar': 'للطلاب', 'en': 'Students', 'ur': 'طلبہ کے لیے', 'hi': 'छात्रों के लिए', 'bn': 'শিক্ষার্থীদের জন্য', 'fil': 'Para sa estudyante', 'fr': 'Étudiants', 'tr': 'Öğrenciler'},
  'premiumCat': {'ar': 'فاخرة', 'en': 'Premium', 'ur': 'پریمیم', 'hi': 'प्रीमियम', 'bn': 'প্রিমিয়াম', 'fil': 'Premium', 'fr': 'Premium', 'tr': 'Premium'},
  'food': {'ar': 'طعام', 'en': 'Food', 'ur': 'کھانا', 'hi': 'खाना', 'bn': 'খাবার', 'fil': 'Pagkain', 'fr': 'Repas', 'tr': 'Yemek'},
  'grocery': {'ar': 'بقالة', 'en': 'Grocery', 'ur': 'گروسری', 'hi': 'किराना', 'bn': 'মুদি', 'fil': 'Grocery', 'fr': 'Épicerie', 'tr': 'Market'},
  'medicine': {'ar': 'دواء', 'en': 'Medicine', 'ur': 'دوا', 'hi': 'दवा', 'bn': 'ওষুধ', 'fil': 'Gamot', 'fr': 'Pharmacie', 'tr': 'İlaç'},
  'gifts': {'ar': 'هدايا', 'en': 'Gifts', 'ur': 'تحائف', 'hi': 'उपहार', 'bn': 'উপহার', 'fil': 'Regalo', 'fr': 'Cadeaux', 'tr': 'Hediyeler'},
  'supplies': {'ar': 'مستلزمات', 'en': 'Supplies', 'ur': 'سامان', 'hi': 'सामान', 'bn': 'সরবরাহ', 'fil': 'Mga supply', 'fr': 'Fournitures', 'tr': 'Malzemeler'},
  'kids': {'ar': 'أطفال', 'en': 'Kids', 'ur': 'بچے', 'hi': 'बच्चे', 'bn': 'শিশু', 'fil': 'Mga bata', 'fr': 'Enfants', 'tr': 'Çocuklar'},
  'care': {'ar': 'العناية', 'en': 'Care', 'ur': 'نگہداشت', 'hi': 'देखभाल', 'bn': 'যত্ন', 'fil': 'Pangangalaga', 'fr': 'Soins', 'tr': 'Bakım'},
  'coffee': {'ar': 'قهوة', 'en': 'Coffee', 'ur': 'کافی', 'hi': 'कॉफ़ी', 'bn': 'কফি', 'fil': 'Kape', 'fr': 'Café', 'tr': 'Kahve'},

  // ─── Auth ───
  'continueWith': {'ar': 'تابع باستخدام:', 'en': 'Continue with:', 'ur': 'اس کے ساتھ جاری رکھیں:', 'hi': 'इसके साथ जारी रखें:', 'bn': 'চালিয়ে যান:', 'fil': 'Magpatuloy gamit ang:', 'fr': 'Continuer avec :', 'tr': 'Şununla devam et:'},
  'enterPhoneFirst': {'ar': 'أدخل رقم هاتفك للمتابعة', 'en': 'Enter your phone number to continue', 'ur': 'جاری رکھنے کے لیے فون نمبر درج کریں', 'hi': 'जारी रखने के लिए फ़ोन नंबर दर्ज करें', 'bn': 'চালিয়ে যেতে ফোন নম্বর দিন', 'fil': 'Ilagay ang phone number para magpatuloy', 'fr': 'Entrez votre numéro pour continuer', 'tr': 'Devam etmek için telefon numaranızı girin'},
  'existingAccount': {'ar': 'دخول لحساب موجود', 'en': 'Sign in to existing account', 'ur': 'موجودہ اکاؤنٹ میں سائن ان کریں', 'hi': 'मौजूदा खाते में साइन इन करें', 'bn': 'বিদ্যমান অ্যাকাউন্টে সাইন ইন', 'fil': 'Mag-sign in sa account', 'fr': 'Connexion à un compte existant', 'tr': 'Mevcut hesaba giriş yap'},
  'loginSignup': {'ar': 'دخول / تسجيل', 'en': 'Log in / Sign up', 'ur': 'لاگ ان / سائن اپ', 'hi': 'लॉग इन / साइन अप', 'bn': 'লগ ইন / সাইন আপ', 'fil': 'Mag-login / Mag-sign up', 'fr': 'Connexion / Inscription', 'tr': 'Giriş / Kayıt'},
  'tagline': {'ar': 'HANCR — اختيارك المتميِّز', 'en': 'HANCR — your premium choice', 'ur': 'HANCR — آپ کا بہترین انتخاب', 'hi': 'HANCR — आपकी प्रीमियम पसंद', 'bn': 'HANCR — আপনার প্রিমিয়াম পছন্দ', 'fil': 'HANCR — premium mong pinili', 'fr': 'HANCR — votre choix premium', 'tr': 'HANCR — premium tercihiniz'},
  'heroTitle': {'ar': 'تنقل ذكي،\nأعيد تصميمه.', 'en': 'Smart mobility,\nreimagined.', 'ur': 'سمارٹ سفر،\nنئے انداز میں۔', 'hi': 'स्मार्ट गतिशीलता,\nनए सिरे से।', 'bn': 'স্মার্ট চলাচল,\nনতুনভাবে।', 'fil': 'Smart mobility,\nbinagong muli.', 'fr': 'Mobilité intelligente,\nréinventée.', 'tr': 'Akıllı ulaşım,\nyeniden tasarlandı.'},
  'heroSub': {'ar': 'احجز رحلات فاخرة في ثوانٍ، تتبَّع السائقين مباشرة، واستمتع برحلات شخصية في مدينتك.', 'en': 'Book premium rides in seconds, track drivers live, and enjoy personalized trips in your city.', 'ur': 'سیکنڈوں میں پریمیم سواری بک کریں، ڈرائیور کو لائیو ٹریک کریں، اور اپنے شہر میں ذاتی سفر کا لطف اٹھائیں۔', 'hi': 'सेकंडों में प्रीमियम राइड बुक करें, ड्राइवरों को लाइव ट्रैक करें, और अपने शहर में निजी यात्रा का आनंद लें।', 'bn': 'সেকেন্ডে প্রিমিয়াম রাইড বুক করুন, চালক লাইভ ট্র্যাক করুন, এবং আপনার শহরে ব্যক্তিগত ভ্রমণ উপভোগ করুন।', 'fil': 'Mag-book ng premium ride sa ilang segundo, i-track ang drayber nang live, at mag-enjoy ng personalized na biyahe.', 'fr': 'Réservez des courses premium en quelques secondes, suivez les chauffeurs en direct.', 'tr': 'Saniyeler içinde premium yolculuk ayırtın, sürücüleri canlı takip edin.'},
  'signupPhone': {'ar': 'تسجيل برقم الهاتف', 'en': 'Sign up with phone', 'ur': 'فون نمبر سے سائن اپ', 'hi': 'फ़ोन से साइन अप करें', 'bn': 'ফোন দিয়ে সাইন আপ', 'fil': 'Mag-sign up gamit ang telepono', 'fr': 'S\'inscrire avec téléphone', 'tr': 'Telefonla kayıt ol'},
  'continueBtn': {'ar': 'متابعة', 'en': 'Continue', 'ur': 'جاری رکھیں', 'hi': 'जारी रखें', 'bn': 'চালিয়ে যান', 'fil': 'Magpatuloy', 'fr': 'Continuer', 'tr': 'Devam et'},
  'otpTitle': {'ar': 'تحقق من رقمك', 'en': 'Verify your number', 'ur': 'اپنا نمبر تصدیق کریں', 'hi': 'अपना नंबर सत्यापित करें', 'bn': 'আপনার নম্বর যাচাই করুন', 'fil': 'I-verify ang numero mo', 'fr': 'Vérifiez votre numéro', 'tr': 'Numaranızı doğrulayın'},
  'otpSentTo': {'ar': 'أرسلنا رمز التحقق إلى', 'en': 'We sent a code to', 'ur': 'ہم نے کوڈ بھیجا ہے', 'hi': 'हमने कोड भेजा है', 'bn': 'আমরা কোড পাঠিয়েছি', 'fil': 'Nagpadala kami ng code sa', 'fr': 'Nous avons envoyé un code à', 'tr': 'Kodu şu numaraya gönderdik'},
  'verify': {'ar': 'تحقق', 'en': 'Verify', 'ur': 'تصدیق کریں', 'hi': 'सत्यापित करें', 'bn': 'যাচাই করুন', 'fil': 'I-verify', 'fr': 'Vérifier', 'tr': 'Doğrula'},
  'resendCode': {'ar': 'إعادة إرسال الرمز', 'en': 'Resend code', 'ur': 'کوڈ دوبارہ بھیجیں', 'hi': 'कोड फिर से भेजें', 'bn': 'কোড আবার পাঠান', 'fil': 'Ipadala muli ang code', 'fr': 'Renvoyer le code', 'tr': 'Kodu tekrar gönder'},
  'resendInPrefix': {'ar': 'إعادة الإرسال خلال', 'en': 'Resend in', 'ur': 'دوبارہ بھیجیں', 'hi': 'पुनः भेजें', 'bn': 'আবার পাঠান', 'fil': 'Ipadala muli sa', 'fr': 'Renvoyer dans', 'tr': 'Tekrar gönder'},
  'seconds': {'ar': 'ث', 'en': 's', 'ur': 'سیکنڈ', 'hi': 'से', 'bn': 'সে', 'fil': 's', 'fr': 's', 'tr': 'sn'},

  // ─── Booking ───
  'confirmDestination': {'ar': 'تأكيد الوجهة', 'en': 'Confirm destination', 'ur': 'منزل کی تصدیق', 'hi': 'गंतव्य की पुष्टि करें', 'bn': 'গন্তব্য নিশ্চিত করুন', 'fil': 'Kumpirmahin ang destinasyon', 'fr': 'Confirmer la destination', 'tr': 'Varış noktasını onayla'},
  'moveMapHint': {'ar': 'حرِّك الخريطة لتحديد وجهتك', 'en': 'Move the map to set your destination', 'ur': 'منزل منتخب کرنے کے لیے نقشہ حرکت دیں', 'hi': 'गंतव्य चुनने के लिए मानचित्र हिलाएं', 'bn': 'গন্তব্য নির্ধারণে মানচিত্র সরান', 'fil': 'Galawin ang mapa para sa destinasyon', 'fr': 'Déplacez la carte pour la destination', 'tr': 'Varış için haritayı kaydırın'},
  'myLocation': {'ar': 'موقعي الحالي', 'en': 'My current location', 'ur': 'میرا موجودہ مقام', 'hi': 'मेरा वर्तमान स्थान', 'bn': 'আমার বর্তমান অবস্থান', 'fil': 'Aking lokasyon', 'fr': 'Ma position actuelle', 'tr': 'Mevcut konumum'},
  'chooseRideType': {'ar': 'اختر فئة الرحلة', 'en': 'Choose ride type', 'ur': 'سواری کی قسم منتخب کریں', 'hi': 'राइड प्रकार चुनें', 'bn': 'রাইডের ধরন বাছুন', 'fil': 'Pumili ng uri ng sakay', 'fr': 'Choisir le type de course', 'tr': 'Yolculuk türünü seçin'},
  'calculatingRoute': {'ar': 'جارٍ حساب المسار...', 'en': 'Calculating route...', 'ur': 'راستہ شمار ہو رہا ہے...', 'hi': 'मार्ग की गणना हो रही है...', 'bn': 'রুট গণনা হচ্ছে...', 'fil': 'Kinukuwenta ang ruta...', 'fr': 'Calcul de l\'itinéraire...', 'tr': 'Rota hesaplanıyor...'},
  'quietRide': {'ar': 'رحلة هادئة', 'en': 'Quiet ride', 'ur': 'پُرسکون سواری', 'hi': 'शांत राइड', 'bn': 'নিরিবিলি রাইড', 'fil': 'Tahimik na sakay', 'fr': 'Course silencieuse', 'tr': 'Sessiz yolculuk'},
  'noMusic': {'ar': 'بدون موسيقى', 'en': 'No music', 'ur': 'موسیقی کے بغیر', 'hi': 'बिना संगीत', 'bn': 'গান ছাড়া', 'fil': 'Walang musika', 'fr': 'Sans musique', 'tr': 'Müziksiz'},
  'requestNow': {'ar': 'اطلب الآن', 'en': 'Request now', 'ur': 'ابھی منگوائیں', 'hi': 'अभी बुक करें', 'bn': 'এখন অনুরোধ করুন', 'fil': 'Mag-request', 'fr': 'Commander', 'tr': 'Şimdi iste'},
  'bidMode': {'ar': 'اقترح سعرك (مزايدة)', 'en': 'Name your price (Bid)', 'ur': 'اپنی قیمت بتائیں (بولی)', 'hi': 'अपनी कीमत बताएं (बिड)', 'bn': 'আপনার দাম বলুন (বিড)', 'fil': 'Pangalanan ang presyo (Bid)', 'fr': 'Proposez votre prix (Enchère)', 'tr': 'Fiyatını söyle (Teklif)'},
  'yourPrice': {'ar': 'سعرك المقترح', 'en': 'Your proposed price', 'ur': 'آپ کی تجویز کردہ قیمت', 'hi': 'आपकी प्रस्तावित कीमत', 'bn': 'আপনার প্রস্তাবিত দাম', 'fil': 'Iyong inaalok na presyo', 'fr': 'Votre prix proposé', 'tr': 'Önerdiğiniz fiyat'},
  'sendBid': {'ar': 'أرسل المزايدة', 'en': 'Send bid', 'ur': 'بولی بھیجیں', 'hi': 'बिड भेजें', 'bn': 'বিড পাঠান', 'fil': 'Ipadala ang bid', 'fr': 'Envoyer l\'enchère', 'tr': 'Teklifi gönder'},
  'waitingOffers': {'ar': 'بانتظار عروض السائقين...', 'en': 'Waiting for driver offers...', 'ur': 'ڈرائیور کی پیشکش کا انتظار...', 'hi': 'ड्राइवर ऑफ़र की प्रतीक्षा...', 'bn': 'চালকের অফারের অপেক্ষায়...', 'fil': 'Naghihintay ng alok ng drayber...', 'fr': 'En attente des offres...', 'tr': 'Sürücü tekliflerini bekliyor...'},
  'noOffersYet': {'ar': 'لا توجد عروض بعد', 'en': 'No offers yet', 'ur': 'ابھی کوئی پیشکش نہیں', 'hi': 'अभी कोई ऑफ़र नहीं', 'bn': 'এখনও কোনো অফার নেই', 'fil': 'Wala pang alok', 'fr': 'Aucune offre', 'tr': 'Henüz teklif yok'},
  'acceptOffer': {'ar': 'قبول', 'en': 'Accept', 'ur': 'قبول کریں', 'hi': 'स्वीकार करें', 'bn': 'গ্রহণ করুন', 'fil': 'Tanggapin', 'fr': 'Accepter', 'tr': 'Kabul et'},
  'offersReceived': {'ar': 'العروض الواردة', 'en': 'Offers received', 'ur': 'موصولہ پیشکشیں', 'hi': 'प्राप्त ऑफ़र', 'bn': 'প্রাপ্ত অফার', 'fil': 'Mga natanggap na alok', 'fr': 'Offres reçues', 'tr': 'Gelen teklifler'},
  'bidExpired': {'ar': 'انتهت مدة المزايدة', 'en': 'Bid expired', 'ur': 'بولی ختم ہو گئی', 'hi': 'बिड समाप्त', 'bn': 'বিড শেষ', 'fil': 'Nag-expire ang bid', 'fr': 'Enchère expirée', 'tr': 'Teklif süresi doldu'},

  // ─── Scheduled rides ───
  'rideNow': {'ar': 'الآن', 'en': 'Ride now', 'ur': 'ابھی', 'hi': 'अभी', 'bn': 'এখন', 'fil': 'Ngayon', 'fr': 'Maintenant', 'tr': 'Şimdi'},
  'scheduleRide': {'ar': 'جدولة الرحلة', 'en': 'Schedule ride', 'ur': 'سفر شیڈول کریں', 'hi': 'राइड शेड्यूल करें', 'bn': 'রাইড নির্ধারণ করুন', 'fil': 'Iiskedyul ang biyahe', 'fr': 'Planifier le trajet', 'tr': 'Yolculuğu planla'},
  'scheduleTooSoon': {'ar': 'اختر وقتاً بعد 5 دقائق على الأقل', 'en': 'Pick a time at least 5 minutes away', 'ur': 'کم از کم 5 منٹ بعد کا وقت منتخب کریں', 'hi': 'कम से कम 5 मिनट बाद का समय चुनें', 'bn': 'অন্তত ৫ মিনিট পরের সময় বাছুন', 'fil': 'Pumili ng oras na hindi bababa sa 5 minuto', 'fr': 'Choisissez une heure dans au moins 5 minutes', 'tr': 'En az 5 dakika sonrası için bir zaman seçin'},
  'rideScheduledOk': {'ar': 'تم جدولة رحلتك بنجاح', 'en': 'Your ride is scheduled', 'ur': 'آپ کا سفر شیڈول ہو گیا', 'hi': 'आपकी राइड शेड्यूल हो गई', 'bn': 'আপনার রাইড নির্ধারিত হয়েছে', 'fil': 'Naka-iskedyul na ang iyong biyahe', 'fr': 'Votre trajet est planifié', 'tr': 'Yolculuğunuz planlandı'},

  // ─── Parcel delivery & Hourly ───
  'receiverInfo': {'ar': 'بيانات المستلم', 'en': 'Receiver details', 'ur': 'وصول کنندہ کی تفصیلات', 'hi': 'प्राप्तकर्ता विवरण', 'bn': 'প্রাপকের তথ্য', 'fil': 'Detalye ng tatanggap', 'fr': 'Détails du destinataire', 'tr': 'Alıcı bilgileri'},
  'receiverName': {'ar': 'اسم المستلم', 'en': 'Receiver name', 'ur': 'وصول کنندہ کا نام', 'hi': 'प्राप्तकर्ता का नाम', 'bn': 'প্রাপকের নাম', 'fil': 'Pangalan ng tatanggap', 'fr': 'Nom du destinataire', 'tr': 'Alıcı adı'},
  'receiverPhone': {'ar': 'هاتف المستلم', 'en': 'Receiver phone', 'ur': 'وصول کنندہ کا فون', 'hi': 'प्राप्तकर्ता का फ़ोन', 'bn': 'প্রাপকের ফোন', 'fil': 'Telepono ng tatanggap', 'fr': 'Téléphone du destinataire', 'tr': 'Alıcı telefonu'},
  'receiverRequired': {'ar': 'أدخل اسم وهاتف المستلم', 'en': 'Enter receiver name and phone', 'ur': 'وصول کنندہ کا نام اور فون درج کریں', 'hi': 'प्राप्तकर्ता का नाम और फ़ोन दर्ज करें', 'bn': 'প্রাপকের নাম ও ফোন দিন', 'fil': 'Ilagay ang pangalan at telepono ng tatanggap', 'fr': 'Saisissez le nom et le téléphone du destinataire', 'tr': 'Alıcı adı ve telefonunu girin'},
  'requestDelivery': {'ar': 'اطلب توصيل', 'en': 'Request delivery', 'ur': 'ترسیل کی درخواست', 'hi': 'डिलीवरी का अनुरोध', 'bn': 'ডেলিভারি অনুরোধ', 'fil': 'Humiling ng delivery', 'fr': 'Demander une livraison', 'tr': 'Teslimat iste'},
  'bookHourly': {'ar': 'احجز بالساعة', 'en': 'Book hourly', 'ur': 'گھنٹہ وار بک کریں', 'hi': 'घंटे के हिसाब से बुक करें', 'bn': 'ঘণ্টা হিসেবে বুক করুন', 'fil': 'Mag-book kada oras', 'fr': 'Réserver à l\'heure', 'tr': 'Saatlik rezervasyon'},
  'hours': {'ar': 'الساعات', 'en': 'Hours', 'ur': 'گھنٹے', 'hi': 'घंटे', 'bn': 'ঘণ্টা', 'fil': 'Oras', 'fr': 'Heures', 'tr': 'Saat'},
  'estimatedPrice': {'ar': 'السعر التقديري', 'en': 'Estimated price', 'ur': 'تخمینی قیمت', 'hi': 'अनुमानित मूल्य', 'bn': 'আনুমানিক মূল্য', 'fil': 'Tinatayang presyo', 'fr': 'Prix estimé', 'tr': 'Tahmini fiyat'},
  'deliveryCode': {'ar': 'كود التسليم', 'en': 'Delivery code', 'ur': 'ڈیلیوری کوڈ', 'hi': 'डिलीवरी कोड', 'bn': 'ডেলিভারি কোড', 'fil': 'Delivery code', 'fr': 'Code de livraison', 'tr': 'Teslimat kodu'},
  'deliveryCodeHint': {'ar': 'اعطِ هذا الكود للسائق عند التسليم', 'en': 'Give this code to the driver at delivery', 'ur': 'ڈیلیوری پر یہ کوڈ ڈرائیور کو دیں', 'hi': 'डिलीवरी पर यह कोड ड्राइवर को दें', 'bn': 'ডেলিভারিতে এই কোড চালককে দিন', 'fil': 'Ibigay ang code na ito sa drayber sa delivery', 'fr': 'Donnez ce code au chauffeur à la livraison', 'tr': 'Teslimatta bu kodu sürücüye verin'},

  // ─── Coupons ───
  'couponCode': {'ar': 'كود الخصم', 'en': 'Discount code', 'ur': 'ڈسکاؤنٹ کوڈ', 'hi': 'डिस्काउंट कोड', 'bn': 'ডিসকাউন্ট কোড', 'fil': 'Discount code', 'fr': 'Code promo', 'tr': 'İndirim kodu'},
  'apply': {'ar': 'تطبيق', 'en': 'Apply', 'ur': 'لاگو کریں', 'hi': 'लागू करें', 'bn': 'প্রয়োগ', 'fil': 'Ilapat', 'fr': 'Appliquer', 'tr': 'Uygula'},
  'youSaved': {'ar': 'وفّرت', 'en': 'You saved', 'ur': 'آپ نے بچایا', 'hi': 'आपने बचाया', 'bn': 'আপনি সাশ্রয় করেছেন', 'fil': 'Nakatipid ka ng', 'fr': 'Vous avez économisé', 'tr': 'Tasarruf ettiniz'},
  'couponInvalid': {'ar': 'كود الخصم غير صالح', 'en': 'Invalid discount code', 'ur': 'غلط ڈسکاؤنٹ کوڈ', 'hi': 'अमान्य कोड', 'bn': 'অবৈধ কোড', 'fil': 'Di-wastong code', 'fr': 'Code promo invalide', 'tr': 'Geçersiz indirim kodu'},
  'couponWaitFare': {'ar': 'انتظر حساب الأجرة أولاً', 'en': 'Wait for fare calculation first', 'ur': 'پہلے کرایہ کیلکولیشن کا انتظار کریں', 'hi': 'पहले किराया गणना की प्रतीक्षा करें', 'bn': 'আগে ভাড়া হিসাবের অপেক্ষা করুন', 'fil': 'Hintayin muna ang pamasahe', 'fr': 'Attendez le calcul du tarif', 'tr': 'Önce ücret hesabını bekleyin'},

  // ─── Loyalty redeem ───
  'redeemReward': {'ar': 'استبدال المكافأة', 'en': 'Redeem reward', 'ur': 'انعام حاصل کریں', 'hi': 'इनाम भुनाएं', 'bn': 'পুরস্কার রিডিম করুন', 'fil': 'I-redeem ang reward', 'fr': 'Échanger la récompense', 'tr': 'Ödülü kullan'},
  'redeemSuccess': {'ar': 'تم الاستبدال! أُضيف لمحفظتك', 'en': 'Redeemed! Added to your wallet:', 'ur': 'کامیاب! آپ کے والیٹ میں شامل:', 'hi': 'भुनाया गया! वॉलेट में जोड़ा:', 'bn': 'রিডিম হয়েছে! ওয়ালেটে যোগ হয়েছে:', 'fil': 'Na-redeem! Naidagdag sa wallet:', 'fr': 'Échangé ! Ajouté à votre portefeuille :', 'tr': 'Kullanıldı! Cüzdanınıza eklendi:'},
  'redeemFailed': {'ar': 'تعذّر الاستبدال', 'en': 'Redemption failed', 'ur': 'استبدال ناکام', 'hi': 'भुनाना विफल', 'bn': 'রিডিম ব্যর্থ', 'fil': 'Nabigo ang pag-redeem', 'fr': 'Échec de l\'échange', 'tr': 'Kullanım başarısız'},

  // ─── Payment method ───
  'cash': {'ar': 'نقداً', 'en': 'Cash', 'ur': 'نقد', 'hi': 'नकद', 'bn': 'নগদ', 'fil': 'Cash', 'fr': 'Espèces', 'tr': 'Nakit'},

  // ─── Family mode ───
  'familyMode': {'ar': 'وضع العائلة', 'en': 'Family mode', 'ur': 'فیملی موڈ', 'hi': 'फ़ैमिली मोड', 'bn': 'পরিবার মোড', 'fil': 'Family mode', 'fr': 'Mode famille', 'tr': 'Aile modu'},

  // ─── Multi-stop ───
  'stop': {'ar': 'محطة', 'en': 'Stop', 'ur': 'اسٹاپ', 'hi': 'पड़ाव', 'bn': 'স্টপ', 'fil': 'Hintuan', 'fr': 'Arrêt', 'tr': 'Durak'},
  'addStop': {'ar': 'أضف محطة', 'en': 'Add stop', 'ur': 'اسٹاپ شامل کریں', 'hi': 'पड़ाव जोड़ें', 'bn': 'স্টপ যোগ করুন', 'fil': 'Magdagdag ng hintuan', 'fr': 'Ajouter un arrêt', 'tr': 'Durak ekle'},
  'stopAdded': {'ar': 'تمت إضافة المحطة', 'en': 'Stop added', 'ur': 'اسٹاپ شامل ہو گیا', 'hi': 'पड़ाव जोड़ा गया', 'bn': 'স্টপ যোগ হয়েছে', 'fil': 'Naidagdag ang hintuan', 'fr': 'Arrêt ajouté', 'tr': 'Durak eklendi'},

  // ─── Trip share ───
  'shareRideTitle': {'ar': 'رحلتي على HANCR', 'en': 'My HANCR trip', 'ur': 'میری HANCR سواری', 'hi': 'मेरी HANCR यात्रा', 'bn': 'আমার HANCR যাত্রা', 'fil': 'Aking biyahe sa HANCR', 'fr': 'Mon trajet HANCR', 'tr': 'HANCR yolculuğum'},
  'to': {'ar': 'إلى', 'en': 'To', 'ur': 'تک', 'hi': 'तक', 'bn': 'যাচ্ছি', 'fil': 'Patungo', 'fr': 'Vers', 'tr': 'Hedef'},
  'liveLocation': {'ar': 'الموقع المباشر', 'en': 'Live location', 'ur': 'لائیو لوکیشن', 'hi': 'लाइव लोकेशन', 'bn': 'লাইভ অবস্থান', 'fil': 'Live na lokasyon', 'fr': 'Position en direct', 'tr': 'Canlı konum'},

  // ─── Saved places ───
  'addSavedPlace': {'ar': 'أضف مكاناً مفضّلاً', 'en': 'Add a saved place', 'ur': 'پسندیدہ جگہ شامل کریں', 'hi': 'पसंदीदा स्थान जोड़ें', 'bn': 'প্রিয় স্থান যোগ করুন', 'fil': 'Magdagdag ng lugar', 'fr': 'Ajouter un lieu favori', 'tr': 'Favori yer ekle'},
  'savedPlacesHint': {'ar': 'احفظ المنزل والعمل للحجز السريع', 'en': 'Save home & work for quick booking', 'ur': 'گھر اور کام محفوظ کریں', 'hi': 'घर और काम सहेजें', 'bn': 'বাড়ি ও কর্মস্থল সংরক্ষণ করুন', 'fil': 'I-save ang bahay at trabaho', 'fr': 'Enregistrez domicile et travail', 'tr': 'Ev ve işi kaydedin'},
  'savePlace': {'ar': 'حفظ المكان', 'en': 'Save place', 'ur': 'جگہ محفوظ کریں', 'hi': 'स्थान सहेजें', 'bn': 'স্থান সংরক্ষণ', 'fil': 'I-save ang lugar', 'fr': 'Enregistrer le lieu', 'tr': 'Yeri kaydet'},
  'placeLabel': {'ar': 'اسم المكان', 'en': 'Place name', 'ur': 'جگہ کا نام', 'hi': 'स्थान का नाम', 'bn': 'স্থানের নাম', 'fil': 'Pangalan ng lugar', 'fr': 'Nom du lieu', 'tr': 'Yer adı'},
  'place_home': {'ar': 'المنزل', 'en': 'Home', 'ur': 'گھر', 'hi': 'घर', 'bn': 'বাড়ি', 'fil': 'Bahay', 'fr': 'Domicile', 'tr': 'Ev'},
  'place_work': {'ar': 'العمل', 'en': 'Work', 'ur': 'کام', 'hi': 'काम', 'bn': 'কাজ', 'fil': 'Trabaho', 'fr': 'Travail', 'tr': 'İş'},
  'place_other': {'ar': 'آخر', 'en': 'Other', 'ur': 'دیگر', 'hi': 'अन्य', 'bn': 'অন্যান্য', 'fil': 'Iba pa', 'fr': 'Autre', 'tr': 'Diğer'},
  'placeSaved': {'ar': 'تم حفظ المكان', 'en': 'Place saved', 'ur': 'جگہ محفوظ ہو گئی', 'hi': 'स्थान सहेजा गया', 'bn': 'স্থান সংরক্ষিত', 'fil': 'Na-save ang lugar', 'fr': 'Lieu enregistré', 'tr': 'Yer kaydedildi'},
  'saveFailed': {'ar': 'تعذّر الحفظ', 'en': 'Save failed', 'ur': 'محفوظ نہیں ہوا', 'hi': 'सहेजना विफल', 'bn': 'সংরক্ষণ ব্যর্থ', 'fil': 'Nabigo ang pag-save', 'fr': 'Échec de l\'enregistrement', 'tr': 'Kaydedilemedi'},
  'managePlaces': {'ar': 'الأماكن المفضّلة', 'en': 'Saved places', 'ur': 'پسندیدہ مقامات', 'hi': 'सहेजे गए स्थान', 'bn': 'সংরক্ষিত স্থান', 'fil': 'Mga naka-save na lugar', 'fr': 'Lieux enregistrés', 'tr': 'Kayıtlı yerler'},
  'noSavedPlaces': {'ar': 'لا أماكن محفوظة بعد', 'en': 'No saved places yet', 'ur': 'ابھی کوئی محفوظ جگہ نہیں', 'hi': 'अभी कोई सहेजा स्थान नहीं', 'bn': 'এখনও কোনো সংরক্ষিত স্থান নেই', 'fil': 'Wala pang naka-save', 'fr': 'Aucun lieu enregistré', 'tr': 'Henüz kayıtlı yer yok'},

  // ─── Call & external navigation ───
  'noPhoneAvailable': {'ar': 'لا يوجد رقم متاح', 'en': 'No phone available', 'ur': 'کوئی نمبر دستیاب نہیں', 'hi': 'कोई फ़ोन उपलब्ध नहीं', 'bn': 'কোনো ফোন নেই', 'fil': 'Walang telepono', 'fr': 'Aucun numéro disponible', 'tr': 'Telefon yok'},
  'cannotCall': {'ar': 'تعذّر إجراء الاتصال', 'en': 'Cannot place call', 'ur': 'کال نہیں ہو سکی', 'hi': 'कॉल नहीं हो सका', 'bn': 'কল করা যায়নি', 'fil': 'Hindi makatawag', 'fr': 'Appel impossible', 'tr': 'Arama yapılamadı'},
  'navigateWith': {'ar': 'الملاحة عبر', 'en': 'Navigate with', 'ur': 'کے ذریعے راستہ', 'hi': 'के साथ नेविगेट करें', 'bn': 'দিয়ে নেভিগেট করুন', 'fil': 'Mag-navigate gamit ang', 'fr': 'Naviguer avec', 'tr': 'İle yön bul'},
  'googleMaps': {'ar': 'خرائط جوجل', 'en': 'Google Maps', 'ur': 'گوگل میپس', 'hi': 'गूगल मैप्स', 'bn': 'গুগল ম্যাপস', 'fil': 'Google Maps', 'fr': 'Google Maps', 'tr': 'Google Haritalar'},
  'waze': {'ar': 'ويز', 'en': 'Waze', 'ur': 'ویز', 'hi': 'वेज़', 'bn': 'ওয়েজ', 'fil': 'Waze', 'fr': 'Waze', 'tr': 'Waze'},
  'cannotOpenMaps': {'ar': 'تعذّر فتح تطبيق الخرائط', 'en': 'Cannot open maps app', 'ur': 'میپس ایپ نہیں کھل سکی', 'hi': 'मैप्स ऐप नहीं खुला', 'bn': 'ম্যাপস খোলা যায়নি', 'fil': 'Hindi mabuksan ang maps', 'fr': 'Impossible d\'ouvrir les cartes', 'tr': 'Harita açılamadı'},

  // ─── Chat ───
  'chatWithDriver': {'ar': 'الدردشة مع السائق', 'en': 'Chat with driver', 'ur': 'ڈرائیور سے بات کریں', 'hi': 'ड्राइवर से चैट करें', 'bn': 'চালকের সাথে চ্যাট', 'fil': 'Makipag-chat sa drayber', 'fr': 'Discuter avec le chauffeur', 'tr': 'Sürücüyle sohbet'},
  'noMessagesYet': {'ar': 'لا رسائل بعد — ابدأ المحادثة', 'en': 'No messages yet — say hello', 'ur': 'ابھی کوئی پیغام نہیں', 'hi': 'अभी कोई संदेश नहीं', 'bn': 'এখনও কোনো বার্তা নেই', 'fil': 'Wala pang mensahe', 'fr': 'Aucun message — dites bonjour', 'tr': 'Henüz mesaj yok'},
  'typeMessage': {'ar': 'اكتب رسالة…', 'en': 'Type a message…', 'ur': 'پیغام لکھیں…', 'hi': 'संदेश लिखें…', 'bn': 'বার্তা লিখুন…', 'fil': 'Mag-type ng mensahe…', 'fr': 'Écrivez un message…', 'tr': 'Mesaj yazın…'},

  // ─── Referral ───
  'inviteDesc': {'ar': 'يحصل صديقك على مكافأة عند أول رحلة، وتحصل أنت على رصيد محفظة أيضاً.', 'en': 'Your friend gets a bonus on their first ride, and you get wallet credit too.', 'ur': 'آپ کے دوست کو پہلی سواری پر انعام ملے گا، اور آپ کو بھی والیٹ کریڈٹ۔', 'hi': 'आपके मित्र को पहली राइड पर बोनस मिलेगा, और आपको भी वॉलेट क्रेडिट।', 'bn': 'আপনার বন্ধু প্রথম রাইডে বোনাস পাবে, আপনিও ওয়ালেট ক্রেডিট পাবেন।', 'fil': 'May bonus ang kaibigan mo sa unang biyahe, at may wallet credit ka rin.', 'fr': 'Votre ami reçoit un bonus à sa première course, et vous obtenez aussi du crédit.', 'tr': 'Arkadaşınız ilk yolculuğunda bonus alır, siz de cüzdan kredisi kazanırsınız.'},
  'friendsInvited': {'ar': 'أصدقاء انضمّوا بكودك', 'en': 'Friends joined with your code', 'ur': 'آپ کے کوڈ سے شامل دوست', 'hi': 'आपके कोड से जुड़े मित्र', 'bn': 'আপনার কোডে যোগ দেওয়া বন্ধু', 'fil': 'Mga kaibigang sumali sa code mo', 'fr': 'Amis inscrits avec votre code', 'tr': 'Kodunuzla katılan arkadaşlar'},
  'referralCodeOptional': {'ar': 'كود إحالة (اختياري)', 'en': 'Referral code (optional)', 'ur': 'ریفرل کوڈ (اختیاری)', 'hi': 'रेफ़रल कोड (वैकल्पिक)', 'bn': 'রেফারেল কোড (ঐচ্ছিক)', 'fil': 'Referral code (opsyonal)', 'fr': 'Code de parrainage (facultatif)', 'tr': 'Davet kodu (isteğe bağlı)'},

  // ─── Rides / Activity ───
  'noRides': {'ar': 'لا توجد رحلات بعد', 'en': 'No rides yet', 'ur': 'ابھی کوئی سواری نہیں', 'hi': 'अभी तक कोई राइड नहीं', 'bn': 'এখনও কোনো রাইড নেই', 'fil': 'Wala pang sakay', 'fr': 'Pas encore de courses', 'tr': 'Henüz yolculuk yok'},
  'ridesEmptySub': {'ar': 'رحلاتك المكتملة ستظهر هنا', 'en': 'Your completed rides will appear here', 'ur': 'آپ کی مکمل سواریاں یہاں نظر آئیں گی', 'hi': 'आपकी पूर्ण राइड यहाँ दिखेंगी', 'bn': 'আপনার সম্পন্ন রাইড এখানে দেখাবে', 'fil': 'Lalabas dito ang tapos na sakay', 'fr': 'Vos courses terminées apparaîtront ici', 'tr': 'Tamamlanan yolculuklar burada görünür'},
  'myRides': {'ar': 'رحلاتي', 'en': 'My rides', 'ur': 'میری سواریاں', 'hi': 'मेरी राइड', 'bn': 'আমার রাইড', 'fil': 'Mga sakay ko', 'fr': 'Mes courses', 'tr': 'Yolculuklarım'},
  'rideDetails': {'ar': 'تفاصيل الرحلة', 'en': 'Ride details', 'ur': 'سواری کی تفصیلات', 'hi': 'राइड विवरण', 'bn': 'রাইডের বিবরণ', 'fil': 'Detalye ng sakay', 'fr': 'Détails de la course', 'tr': 'Yolculuk detayları'},
  'date': {'ar': 'التاريخ', 'en': 'Date', 'ur': 'تاریخ', 'hi': 'तारीख', 'bn': 'তারিখ', 'fil': 'Petsa', 'fr': 'Date', 'tr': 'Tarih'},
  'status': {'ar': 'الحالة', 'en': 'Status', 'ur': 'حالت', 'hi': 'स्थिति', 'bn': 'অবস্থা', 'fil': 'Status', 'fr': 'Statut', 'tr': 'Durum'},
  'distance': {'ar': 'المسافة', 'en': 'Distance', 'ur': 'فاصلہ', 'hi': 'दूरी', 'bn': 'দূরত্ব', 'fil': 'Distansya', 'fr': 'Distance', 'tr': 'Mesafe'},
  'duration': {'ar': 'المدة', 'en': 'Duration', 'ur': 'دورانیہ', 'hi': 'अवधि', 'bn': 'সময়কাল', 'fil': 'Tagal', 'fr': 'Durée', 'tr': 'Süre'},
  'car': {'ar': 'السيارة', 'en': 'Car', 'ur': 'گاڑی', 'hi': 'कार', 'bn': 'গাড়ি', 'fil': 'Kotse', 'fr': 'Voiture', 'tr': 'Araç'},
  'cost': {'ar': 'التكلفة', 'en': 'Cost', 'ur': 'لاگت', 'hi': 'लागत', 'bn': 'খরচ', 'fil': 'Halaga', 'fr': 'Coût', 'tr': 'Ücret'},
  'paid': {'ar': 'المدفوع', 'en': 'Paid', 'ur': 'ادا شدہ', 'hi': 'भुगतान', 'bn': 'পরিশোধিত', 'fil': 'Bayad', 'fr': 'Payé', 'tr': 'Ödenen'},

  // ─── Notifications & Offers ───
  'notifications': {'ar': 'الإشعارات', 'en': 'Notifications', 'ur': 'اطلاعات', 'hi': 'सूचनाएं', 'bn': 'বিজ্ঞপ্তি', 'fil': 'Mga abiso', 'fr': 'Notifications', 'tr': 'Bildirimler'},
  'hourAgo': {'ar': 'منذ ساعة', 'en': '1 hour ago', 'ur': 'ایک گھنٹہ پہلے', 'hi': '1 घंटा पहले', 'bn': '১ ঘণ্টা আগে', 'fil': '1 oras na ang nakaraan', 'fr': 'Il y a 1 heure', 'tr': '1 saat önce'},
  'yesterday': {'ar': 'أمس', 'en': 'Yesterday', 'ur': 'کل', 'hi': 'कल', 'bn': 'গতকাল', 'fil': 'Kahapon', 'fr': 'Hier', 'tr': 'Dün'},
  'notifOfferTitle': {'ar': 'عرض خاص!', 'en': 'Special offer!', 'ur': 'خصوصی پیشکش!', 'hi': 'विशेष ऑफ़र!', 'bn': 'বিশেষ অফার!', 'fil': 'Espesyal na alok!', 'fr': 'Offre spéciale !', 'tr': 'Özel teklif!'},
  'notifOfferBody': {'ar': 'خصم 25٪ على رحلتك القادمة باستخدام كود WELCOME', 'en': '25% off your next ride with code WELCOME', 'ur': 'کوڈ WELCOME سے اگلی سواری پر 25٪ رعایت', 'hi': 'कोड WELCOME से अगली राइड पर 25% छूट', 'bn': 'কোড WELCOME দিয়ে পরের রাইডে ২৫٪ ছাড়', 'fil': '25% off sa susunod na sakay gamit ang WELCOME', 'fr': '25 % de réduction avec le code WELCOME', 'tr': 'WELCOME koduyla sonraki yolculukta %25 indirim'},
  'notifWelcomeTitle': {'ar': 'مرحباً بك في HANCR', 'en': 'Welcome to HANCR', 'ur': 'HANCR میں خوش آمدید', 'hi': 'HANCR में आपका स्वागत है', 'bn': 'HANCR-এ স্বাগতম', 'fil': 'Maligayang pagdating sa HANCR', 'fr': 'Bienvenue chez HANCR', 'tr': 'HANCR\'a hoş geldiniz'},
  'notifWelcomeBody': {'ar': 'أكمل ملفك الشخصي واحصل على رحلة مجانية', 'en': 'Complete your profile and get a free ride', 'ur': 'اپنا پروفائل مکمل کریں اور مفت سواری حاصل کریں', 'hi': 'अपनी प्रोफ़ाइल पूरी करें और मुफ़्त राइड पाएं', 'bn': 'প্রোফাইল সম্পূর্ণ করুন ও ফ্রি রাইড পান', 'fil': 'Kumpletuhin ang profile at makakuha ng libreng sakay', 'fr': 'Complétez votre profil et obtenez une course gratuite', 'tr': 'Profilinizi tamamlayın, ücretsiz yolculuk kazanın'},
  'notifSurgeTitle': {'ar': 'وضع الذروة', 'en': 'Peak pricing', 'ur': 'پیک پرائسنگ', 'hi': 'पीक प्राइसिंग', 'bn': 'পিক প্রাইসিং', 'fil': 'Peak pricing', 'fr': 'Tarif de pointe', 'tr': 'Yoğun fiyatlandırma'},
  'notifSurgeBody': {'ar': 'الأسعار مرتفعة قليلاً في منطقتك الآن', 'en': 'Prices are slightly higher in your area now', 'ur': 'آپ کے علاقے میں قیمتیں کچھ زیادہ ہیں', 'hi': 'आपके क्षेत्र में कीमतें थोड़ी अधिक हैं', 'bn': 'আপনার এলাকায় দাম একটু বেশি', 'fil': 'Mas mataas ang presyo sa lugar mo ngayon', 'fr': 'Les prix sont un peu plus élevés', 'tr': 'Bölgenizde fiyatlar şu an biraz yüksek'},
  'offerWelcomeTitle': {'ar': 'خصم 25٪ لأول رحلة', 'en': '25% off first ride', 'ur': 'پہلی سواری پر 25٪ رعایت', 'hi': 'पहली राइड पर 25% छूट', 'bn': 'প্রথম রাইডে ২৫٪ ছাড়', 'fil': '25% off sa unang sakay', 'fr': '25 % sur la 1re course', 'tr': 'İlk yolculukta %25 indirim'},
  'offerWelcomeSub': {'ar': 'صالح حتى نهاية الشهر', 'en': 'Valid until end of month', 'ur': 'ماہ کے آخر تک', 'hi': 'महीने के अंत तक मान्य', 'bn': 'মাসের শেষ পর্যন্ত বৈধ', 'fil': 'Hanggang katapusan ng buwan', 'fr': 'Valable jusqu\'à fin du mois', 'tr': 'Ay sonuna kadar geçerli'},
  'offerWeekendTitle': {'ar': 'وفّر 15٪ في عطلة نهاية الأسبوع', 'en': 'Save 15% on weekends', 'ur': 'ویک اینڈ پر 15٪ بچائیں', 'hi': 'वीकेंड पर 15% बचाएं', 'bn': 'সপ্তাহান্তে ১৫٪ সাশ্রয়', 'fil': 'Makatipid ng 15% tuwing weekend', 'fr': 'Économisez 15 % le week-end', 'tr': 'Hafta sonu %15 tasarruf'},
  'offerWeekendSub': {'ar': 'الجمعة والسبت', 'en': 'Friday & Saturday', 'ur': 'جمعہ اور ہفتہ', 'hi': 'शुक्रवार और शनिवार', 'bn': 'শুক্র ও শনিবার', 'fil': 'Biyernes at Sabado', 'fr': 'Vendredi et samedi', 'tr': 'Cuma ve Cumartesi'},
  'offerNightTitle': {'ar': 'رحلات ليلية بسعر مخفّض', 'en': 'Discounted night rides', 'ur': 'رات کی سواری رعایتی', 'hi': 'रियायती रात की राइड', 'bn': 'রাতের রাইডে ছাড়', 'fil': 'May diskwentong night ride', 'fr': 'Courses de nuit à prix réduit', 'tr': 'İndirimli gece yolculukları'},
  'offerNightSub': {'ar': 'من 12 ص حتى 6 ص', 'en': '12 AM to 6 AM', 'ur': 'رات 12 سے صبح 6 بجے تک', 'hi': 'रात 12 से सुबह 6 बजे तक', 'bn': 'রাত ১২টা থেকে ভোর ৬টা', 'fil': '12 AM hanggang 6 AM', 'fr': 'De 0h à 6h', 'tr': '00:00 - 06:00'},
  'codePrefix': {'ar': 'كود:', 'en': 'Code:', 'ur': 'کوڈ:', 'hi': 'कोड:', 'bn': 'কোড:', 'fil': 'Code:', 'fr': 'Code :', 'tr': 'Kod:'},

  // ─── Account / Profile ───
  'myAccount': {'ar': 'حسابي', 'en': 'My account', 'ur': 'میرا اکاؤنٹ', 'hi': 'मेरा खाता', 'bn': 'আমার অ্যাকাউন্ট', 'fil': 'Aking account', 'fr': 'Mon compte', 'tr': 'Hesabım'},
  'help': {'ar': 'مساعدة', 'en': 'Help', 'ur': 'مدد', 'hi': 'मदद', 'bn': 'সহায়তা', 'fil': 'Tulong', 'fr': 'Aide', 'tr': 'Yardım'},
  'wallet': {'ar': 'محفظة', 'en': 'Wallet', 'ur': 'والیٹ', 'hi': 'वॉलेट', 'bn': 'ওয়ালেট', 'fil': 'Wallet', 'fr': 'Portefeuille', 'tr': 'Cüzdan'},
  'milesSub': {'ar': 'اطّلع على نقاطك ومستواك ومكافآتك', 'en': 'View your points, tier and rewards', 'ur': 'اپنے پوائنٹس، درجہ اور انعامات دیکھیں', 'hi': 'अपने पॉइंट, टियर और रिवॉर्ड देखें', 'bn': 'আপনার পয়েন্ট, টিয়ার ও পুরস্কার দেখুন', 'fil': 'Tingnan ang points, tier at rewards', 'fr': 'Voyez vos points, niveau et récompenses', 'tr': 'Puanlarınızı, seviyenizi ve ödüllerinizi görün'},
  'premiumTitle': {'ar': 'جرِّب HANCR Premium مجاناً', 'en': 'Try HANCR Premium free', 'ur': 'HANCR Premium مفت آزمائیں', 'hi': 'HANCR Premium मुफ़्त आज़माएं', 'bn': 'HANCR Premium ফ্রি ট্রাই করুন', 'fil': 'Subukan ang HANCR Premium nang libre', 'fr': 'Essayez HANCR Premium gratuitement', 'tr': 'HANCR Premium\'u ücretsiz deneyin'},
  'premiumSub': {'ar': 'احصل على 6% Cashback على رحلاتك وأكثر', 'en': 'Get 6% cashback on rides and more', 'ur': 'سواریوں پر 6% کیش بیک اور مزید', 'hi': 'राइड पर 6% कैशबैक और बहुत कुछ', 'bn': 'রাইডে ৬% ক্যাশব্যাক ও আরও', 'fil': '6% cashback sa sakay at higit pa', 'fr': '6 % de cashback sur vos courses', 'tr': 'Yolculuklarda %6 nakit iade ve daha fazlası'},
  'safetyCheck': {'ar': 'فحص الأمان', 'en': 'Safety checkup', 'ur': 'حفاظتی جانچ', 'hi': 'सुरक्षा जांच', 'bn': 'নিরাপত্তা পরীক্ষা', 'fil': 'Safety checkup', 'fr': 'Vérification de sécurité', 'tr': 'Güvenlik kontrolü'},
  'safetyCheckSub': {'ar': 'فعِّل ميزات الأمان الإضافية', 'en': 'Enable extra safety features', 'ur': 'اضافی حفاظتی فیچرز فعال کریں', 'hi': 'अतिरिक्त सुरक्षा सुविधाएं चालू करें', 'bn': 'অতিরিক্ত নিরাপত্তা ফিচার চালু করুন', 'fil': 'I-enable ang dagdag na safety features', 'fr': 'Activez des options de sécurité', 'tr': 'Ek güvenlik özelliklerini etkinleştirin'},
  'settingsPrivacy': {'ar': 'الإعدادات والخصوصية', 'en': 'Settings & privacy', 'ur': 'ترتیبات اور رازداری', 'hi': 'सेटिंग्स और गोपनीयता', 'bn': 'সেটিংস ও গোপনীয়তা', 'fil': 'Settings at privacy', 'fr': 'Paramètres et confidentialité', 'tr': 'Ayarlar ve gizlilik'},
  'settingsPrivacySub': {'ar': 'التنبيهات، اللغة، الخصوصية، وحول التطبيق', 'en': 'Notifications, language, privacy & about', 'ur': 'اطلاعات، زبان، رازداری اور بارے میں', 'hi': 'सूचनाएं, भाषा, गोपनीयता और जानकारी', 'bn': 'বিজ্ঞপ্তি, ভাষা, গোপনীয়তা ও সম্পর্কে', 'fil': 'Abiso, wika, privacy at tungkol', 'fr': 'Notifications, langue, confidentialité', 'tr': 'Bildirimler, dil, gizlilik ve hakkında'},
  'co2Saved': {'ar': 'CO₂ موفَّر', 'en': 'CO₂ saved', 'ur': 'CO₂ بچایا', 'hi': 'CO₂ बचाया', 'bn': 'CO₂ সাশ্রয়', 'fil': 'CO₂ na natipid', 'fr': 'CO₂ économisé', 'tr': 'Tasarruf edilen CO₂'},
  'inviteFriends': {'ar': 'ادعُ أصدقاءك', 'en': 'Invite friends', 'ur': 'دوستوں کو مدعو کریں', 'hi': 'दोस्तों को आमंत्रित करें', 'bn': 'বন্ধুদের আমন্ত্রণ', 'fil': 'Mag-imbita ng kaibigan', 'fr': 'Inviter des amis', 'tr': 'Arkadaş davet et'},
  'inviteSub': {'ar': 'يحصل كلٌّ منكم على خصم 50٪ على رحلتين', 'en': 'You both get 50% off two rides', 'ur': 'آپ دونوں کو دو سواریوں پر 50٪ رعایت', 'hi': 'आप दोनों को दो राइड पर 50% छूट', 'bn': 'আপনারা দুজনেই দুটি রাইডে ৫০٪ ছাড় পাবেন', 'fil': 'Parehong makakakuha ng 50% off sa dalawang sakay', 'fr': 'Vous gagnez tous deux 50 % sur deux courses', 'tr': 'İkiniz de iki yolculukta %50 indirim kazanın'},
  'hancrUser': {'ar': 'مستخدم HANCR', 'en': 'HANCR user', 'ur': 'HANCR صارف', 'hi': 'HANCR उपयोगकर्ता', 'bn': 'HANCR ব্যবহারকারী', 'fil': 'HANCR user', 'fr': 'Utilisateur HANCR', 'tr': 'HANCR kullanıcısı'},
  'edit': {'ar': 'تعديل', 'en': 'Edit', 'ur': 'ترمیم', 'hi': 'संपादित करें', 'bn': 'সম্পাদনা', 'fil': 'I-edit', 'fr': 'Modifier', 'tr': 'Düzenle'},
  'logout': {'ar': 'تسجيل الخروج', 'en': 'Log out', 'ur': 'لاگ آؤٹ', 'hi': 'लॉग आउट', 'bn': 'লগ আউট', 'fil': 'Mag-logout', 'fr': 'Déconnexion', 'tr': 'Çıkış yap'},
  'editProfile': {'ar': 'تعديل الملف الشخصي', 'en': 'Edit profile', 'ur': 'پروفائل میں ترمیم', 'hi': 'प्रोफ़ाइल संपादित करें', 'bn': 'প্রোফাইল সম্পাদনা', 'fil': 'I-edit ang profile', 'fr': 'Modifier le profil', 'tr': 'Profili düzenle'},
  'firstName': {'ar': 'الاسم الأول', 'en': 'First name', 'ur': 'پہلا نام', 'hi': 'पहला नाम', 'bn': 'নামের প্রথম অংশ', 'fil': 'Pangalan', 'fr': 'Prénom', 'tr': 'Ad'},
  'lastName': {'ar': 'الاسم الأخير', 'en': 'Last name', 'ur': 'آخری نام', 'hi': 'अंतिम नाम', 'bn': 'নামের শেষ অংশ', 'fil': 'Apelyido', 'fr': 'Nom', 'tr': 'Soyad'},
  'email': {'ar': 'البريد الإلكتروني', 'en': 'Email', 'ur': 'ای میل', 'hi': 'ईमेल', 'bn': 'ইমেইল', 'fil': 'Email', 'fr': 'E-mail', 'tr': 'E-posta'},
  'saved': {'ar': 'تم حفظ التغييرات ✓', 'en': 'Changes saved ✓', 'ur': 'تبدیلیاں محفوظ ✓', 'hi': 'परिवर्तन सहेजे गए ✓', 'bn': 'পরিবর্তন সংরক্ষিত ✓', 'fil': 'Na-save ang pagbabago ✓', 'fr': 'Modifications enregistrées ✓', 'tr': 'Değişiklikler kaydedildi ✓'},

  // ─── Help center ───
  'helpCenter': {'ar': 'مركز المساعدة', 'en': 'Help center', 'ur': 'مدد مرکز', 'hi': 'सहायता केंद्र', 'bn': 'সহায়তা কেন্দ্র', 'fil': 'Help center', 'fr': 'Centre d\'aide', 'tr': 'Yardım merkezi'},
  'faq': {'ar': 'الأسئلة الشائعة', 'en': 'FAQ', 'ur': 'عمومی سوالات', 'hi': 'सामान्य प्रश्न', 'bn': 'সাধারণ প্রশ্ন', 'fil': 'Mga FAQ', 'fr': 'FAQ', 'tr': 'SSS'},
  'contactUs': {'ar': 'تواصل معنا', 'en': 'Contact us', 'ur': 'ہم سے رابطہ کریں', 'hi': 'संपर्क करें', 'bn': 'যোগাযোগ করুন', 'fil': 'Makipag-ugnayan', 'fr': 'Contactez-nous', 'tr': 'Bize ulaşın'},
  'copied': {'ar': 'تم النسخ', 'en': 'Copied', 'ur': 'کاپی ہو گیا', 'hi': 'कॉपी किया गया', 'bn': 'কপি হয়েছে', 'fil': 'Nakopya', 'fr': 'Copié', 'tr': 'Kopyalandı'},
  'faqQ1': {'ar': 'كيف أطلب رحلة؟', 'en': 'How do I book a ride?', 'ur': 'سواری کیسے بک کروں؟', 'hi': 'राइड कैसे बुक करें?', 'bn': 'কীভাবে রাইড বুক করব?', 'fil': 'Paano mag-book ng sakay?', 'fr': 'Comment réserver une course ?', 'tr': 'Nasıl yolculuk ayırtırım?'},
  'faqA1': {'ar': 'من الشاشة الرئيسية اضغط "إلى أين؟"، حدِّد وجهتك على الخريطة، اختر فئة الرحلة ثم اضغط "اطلب الآن".', 'en': 'From the home screen tap "Where to?", set your destination on the map, choose a ride type, then tap "Request now".', 'ur': 'ہوم سے "کہاں جانا ہے؟" دبائیں، منزل منتخب کریں، قسم چنیں، پھر "ابھی منگوائیں" دبائیں۔', 'hi': 'होम पर "कहाँ जाना है?" टैप करें, गंतव्य चुनें, राइड प्रकार चुनें, फिर "अभी बुक करें"।', 'bn': 'হোমে "কোথায় যাবেন?" চাপুন, গন্তব্য নির্ধারণ করুন, ধরন বাছুন, তারপর "এখন অনুরোধ করুন"।', 'fil': 'Sa home, i-tap ang "Saan?", itakda ang destinasyon, pumili ng uri, tapos "Mag-request".', 'fr': 'Sur l\'accueil, touchez « Où aller ? », définissez la destination, choisissez le type, puis « Commander ».', 'tr': 'Ana sayfada "Nereye?"ye dokunun, varış noktasını seçin, türü seçin, "Şimdi iste"ye dokunun.'},
  'faqQ2': {'ar': 'كيف أدفع؟', 'en': 'How do I pay?', 'ur': 'ادائیگی کیسے کروں؟', 'hi': 'भुगतान कैसे करूं?', 'bn': 'কীভাবে পরিশোধ করব?', 'fil': 'Paano magbayad?', 'fr': 'Comment payer ?', 'tr': 'Nasıl öderim?'},
  'faqA2': {'ar': 'يمكنك الدفع نقداً أو عبر محفظة HANCR. اشحن محفظتك من تبويب المحفظة.', 'en': 'You can pay by cash or via your HANCR wallet. Top up from the Wallet tab.', 'ur': 'آپ نقد یا HANCR والیٹ سے ادائیگی کر سکتے ہیں۔ والیٹ ٹیب سے ٹاپ اپ کریں۔', 'hi': 'आप नकद या HANCR वॉलेट से भुगतान कर सकते हैं। वॉलेट टैब से टॉप अप करें।', 'bn': 'নগদ বা HANCR ওয়ালেটে পরিশোধ করতে পারেন। ওয়ালেট ট্যাব থেকে টপ আপ করুন।', 'fil': 'Maaaring magbayad ng cash o HANCR wallet. Mag-top up sa Wallet tab.', 'fr': 'Payez en espèces ou via le portefeuille HANCR. Rechargez depuis l\'onglet Portefeuille.', 'tr': 'Nakit veya HANCR cüzdanıyla ödeyebilirsiniz. Cüzdan sekmesinden yükleyin.'},
  'faqQ3': {'ar': 'كيف ألغي رحلة؟', 'en': 'How do I cancel a ride?', 'ur': 'سواری کیسے منسوخ کروں؟', 'hi': 'राइड कैसे रद्द करूं?', 'bn': 'কীভাবে রাইড বাতিল করব?', 'fil': 'Paano kanselahin ang sakay?', 'fr': 'Comment annuler une course ?', 'tr': 'Yolculuğu nasıl iptal ederim?'},
  'faqA3': {'ar': 'أثناء التتبع اضغط "إلغاء الرحلة". قد تُطبَّق رسوم إلغاء حسب حالة الرحلة.', 'en': 'During tracking, tap "Cancel ride". A cancellation fee may apply depending on the ride status.', 'ur': 'ٹریکنگ کے دوران "سواری منسوخ کریں" دبائیں۔ حالت کے مطابق منسوخی فیس لاگو ہو سکتی ہے۔', 'hi': 'ट्रैकिंग के दौरान "राइड रद्द करें" टैप करें। स्थिति के अनुसार शुल्क लग सकता है।', 'bn': 'ট্র্যাকিংয়ের সময় "রাইড বাতিল করুন" চাপুন। অবস্থা অনুযায়ী ফি প্রযোজ্য হতে পারে।', 'fil': 'Habang nagta-track, i-tap ang "Kanselahin". May bayad depende sa status.', 'fr': 'Pendant le suivi, touchez « Annuler ». Des frais peuvent s\'appliquer selon le statut.', 'tr': 'Takip sırasında "Yolculuğu iptal et"e dokunun. Duruma göre ücret uygulanabilir.'},
  'faqQ4': {'ar': 'ميزات الأمان', 'en': 'Safety features', 'ur': 'حفاظتی خصوصیات', 'hi': 'सुरक्षा सुविधाएं', 'bn': 'নিরাপত্তা ফিচার', 'fil': 'Mga safety feature', 'fr': 'Options de sécurité', 'tr': 'Güvenlik özellikleri'},
  'faqA4': {'ar': 'زر الطوارئ SOS متاح في كل رحلة، ويمكنك إضافة جهات اتصال للطوارئ ومشاركة رحلتك.', 'en': 'The SOS button is available on every ride, and you can add emergency contacts and share your trip.', 'ur': 'SOS بٹن ہر سواری میں دستیاب ہے، اور آپ ہنگامی رابطے شامل کر کے سفر شیئر کر سکتے ہیں۔', 'hi': 'SOS बटन हर राइड में उपलब्ध है, और आप आपातकालीन संपर्क जोड़कर यात्रा साझा कर सकते हैं।', 'bn': 'প্রতিটি রাইডে SOS বোতাম আছে, এবং আপনি জরুরি যোগাযোগ যোগ করে যাত্রা শেয়ার করতে পারেন।', 'fil': 'Available ang SOS button sa bawat sakay, at maaari kang magdagdag ng emergency contacts.', 'fr': 'Le bouton SOS est disponible à chaque course, et vous pouvez ajouter des contacts d\'urgence.', 'tr': 'SOS düğmesi her yolculukta mevcuttur; acil durum kişileri ekleyip yolculuğunuzu paylaşabilirsiniz.'},
  'faqQ5': {'ar': 'كيف أكسب نقاط الولاء؟', 'en': 'How do I earn loyalty points?', 'ur': 'لائلٹی پوائنٹس کیسے کماؤں؟', 'hi': 'लॉयल्टी पॉइंट कैसे कमाएं?', 'bn': 'লয়্যালটি পয়েন্ট কীভাবে অর্জন করব?', 'fil': 'Paano kumita ng loyalty points?', 'fr': 'Comment gagner des points de fidélité ?', 'tr': 'Sadakat puanı nasıl kazanırım?'},
  'faqA5': {'ar': 'تكسب نقاطاً مع كل رحلة، وترتقي بين المستويات للحصول على مزايا أكبر.', 'en': 'You earn points with every ride and climb tiers for bigger benefits.', 'ur': 'ہر سواری پر پوائنٹس کماتے ہیں اور درجے بڑھا کر مزید فوائد پاتے ہیں۔', 'hi': 'हर राइड पर पॉइंट कमाएं और बड़े लाभ के लिए टियर बढ़ाएं।', 'bn': 'প্রতি রাইডে পয়েন্ট অর্জন করুন এবং বড় সুবিধার জন্য টিয়ার বাড়ান।', 'fil': 'Kumita ng points bawat sakay at umakyat ng tier para sa mas malaking benepisyo.', 'fr': 'Gagnez des points à chaque course et montez de niveau pour plus d\'avantages.', 'tr': 'Her yolculukta puan kazanır, daha fazla avantaj için seviye atlarsınız.'},
  'aiSoon': {'ar': 'مساعد HANCR الذكي قريباً ✨', 'en': 'HANCR AI Assistant coming soon ✨', 'ur': 'HANCR AI اسسٹنٹ جلد آ رہا ہے ✨', 'hi': 'HANCR AI सहायक जल्द आ रहा है ✨', 'bn': 'HANCR AI সহকারী শীঘ্রই আসছে ✨', 'fil': 'HANCR AI Assistant malapit na ✨', 'fr': 'Assistant IA HANCR bientôt ✨', 'tr': 'HANCR AI Asistanı yakında ✨'},

  // ─── Invite ───
  'inviteHeadline': {'ar': 'اربح مع كل صديق', 'en': 'Earn with every friend', 'ur': 'ہر دوست کے ساتھ کمائیں', 'hi': 'हर दोस्त के साथ कमाएं', 'bn': 'প্রতি বন্ধুতে আয় করুন', 'fil': 'Kumita sa bawat kaibigan', 'fr': 'Gagnez avec chaque ami', 'tr': 'Her arkadaşla kazanın'},
  'inviteBody': {'ar': 'يحصل صديقك على خصم 50٪ على أول رحلتين، وتحصل أنت على رصيد عند أول رحلة له.', 'en': 'Your friend gets 50% off their first two rides, and you get credit on their first ride.', 'ur': 'آپ کے دوست کو پہلی دو سواریوں پر 50٪ رعایت، اور آپ کو اس کی پہلی سواری پر کریڈٹ۔', 'hi': 'आपके दोस्त को पहली दो राइड पर 50% छूट, और आपको उसकी पहली राइड पर क्रेडिट।', 'bn': 'আপনার বন্ধু প্রথম দুই রাইডে ৫০٪ ছাড় পাবে, আর আপনি ক্রেডিট পাবেন।', 'fil': 'Makakakuha ang kaibigan mo ng 50% off, at ikaw ay credit.', 'fr': 'Votre ami obtient 50 % sur ses deux premières courses, et vous obtenez un crédit.', 'tr': 'Arkadaşınız ilk iki yolculukta %50 indirim alır, siz de kredi kazanırsınız.'},
  'shareCode': {'ar': 'مشاركة الكود', 'en': 'Share code', 'ur': 'کوڈ شیئر کریں', 'hi': 'कोड साझा करें', 'bn': 'কোড শেয়ার করুন', 'fil': 'I-share ang code', 'fr': 'Partager le code', 'tr': 'Kodu paylaş'},
  'codeCopied': {'ar': 'تم نسخ كود الإحالة ✓', 'en': 'Referral code copied ✓', 'ur': 'ریفرل کوڈ کاپی ہو گیا ✓', 'hi': 'रेफ़रल कोड कॉपी हुआ ✓', 'bn': 'রেফারেল কোড কপি হয়েছে ✓', 'fil': 'Nakopya ang referral code ✓', 'fr': 'Code de parrainage copié ✓', 'tr': 'Davet kodu kopyalandı ✓'},

  // ─── Settings ───
  'settings': {'ar': 'الإعدادات', 'en': 'Settings', 'ur': 'ترتیبات', 'hi': 'सेटिंग्स', 'bn': 'সেটিংস', 'fil': 'Mga setting', 'fr': 'Paramètres', 'tr': 'Ayarlar'},
  'language': {'ar': 'اللغة', 'en': 'Language', 'ur': 'زبان', 'hi': 'भाषा', 'bn': 'ভাষা', 'fil': 'Wika', 'fr': 'Langue', 'tr': 'Dil'},
  'about': {'ar': 'حول', 'en': 'About', 'ur': 'بارے میں', 'hi': 'के बारे में', 'bn': 'সম্পর্কে', 'fil': 'Tungkol', 'fr': 'À propos', 'tr': 'Hakkında'},
  'version': {'ar': 'الإصدار', 'en': 'Version', 'ur': 'ورژن', 'hi': 'संस्करण', 'bn': 'সংস্করণ', 'fil': 'Bersyon', 'fr': 'Version', 'tr': 'Sürüm'},
  'rideNotifs': {'ar': 'إشعارات الرحلات', 'en': 'Ride notifications', 'ur': 'سواری کی اطلاعات', 'hi': 'राइड सूचनाएं', 'bn': 'রাইড বিজ্ঞপ্তি', 'fil': 'Abiso ng sakay', 'fr': 'Notifications de course', 'tr': 'Yolculuk bildirimleri'},
  'promoNotifs': {'ar': 'عروض وتخفيضات', 'en': 'Offers & promos', 'ur': 'آفرز اور پرومو', 'hi': 'ऑफ़र और प्रोमो', 'bn': 'অফার ও প্রোমো', 'fil': 'Mga alok at promo', 'fr': 'Offres et promos', 'tr': 'Teklifler ve promosyonlar'},
  'selectLanguage': {'ar': 'اختر اللغة', 'en': 'Select language', 'ur': 'زبان منتخب کریں', 'hi': 'भाषा चुनें', 'bn': 'ভাষা নির্বাচন করুন', 'fil': 'Pumili ng wika', 'fr': 'Choisir la langue', 'tr': 'Dil seçin'},

  // ─── Wallet ───
  'walletTitle': {'ar': 'المحفظة', 'en': 'Wallet', 'ur': 'والیٹ', 'hi': 'वॉलेट', 'bn': 'ওয়ালেট', 'fil': 'Wallet', 'fr': 'Portefeuille', 'tr': 'Cüzdan'},
  'transactions': {'ar': 'المعاملات', 'en': 'Transactions', 'ur': 'لین دین', 'hi': 'लेन-देन', 'bn': 'লেনদেন', 'fil': 'Mga transaksyon', 'fr': 'Transactions', 'tr': 'İşlemler'},
  'availableBalance': {'ar': 'الرصيد المتاح', 'en': 'Available balance', 'ur': 'دستیاب بیلنس', 'hi': 'उपलब्ध शेष', 'bn': 'উপলব্ধ ব্যালেন্স', 'fil': 'Available na balanse', 'fr': 'Solde disponible', 'tr': 'Kullanılabilir bakiye'},
  'topup': {'ar': 'شحن', 'en': 'Top up', 'ur': 'ٹاپ اپ', 'hi': 'टॉप अप', 'bn': 'টপ আপ', 'fil': 'Mag-top up', 'fr': 'Recharger', 'tr': 'Yükle'},
  'send': {'ar': 'إرسال', 'en': 'Send', 'ur': 'بھیجیں', 'hi': 'भेजें', 'bn': 'পাঠান', 'fil': 'Magpadala', 'fr': 'Envoyer', 'tr': 'Gönder'},
  'sendMoney': {'ar': 'إرسال الأموال', 'en': 'Send money', 'ur': 'پیسے بھیجیں', 'hi': 'पैसे भेजें', 'bn': 'টাকা পাঠান', 'fil': 'Magpadala ng pera', 'fr': 'Envoyer de l\'argent', 'tr': 'Para gönder'},
  'statement': {'ar': 'كشف', 'en': 'Statement', 'ur': 'اسٹیٹمنٹ', 'hi': 'विवरण', 'bn': 'স্টেটমেন্ট', 'fil': 'Statement', 'fr': 'Relevé', 'tr': 'Ekstre'},
  'statementPdf': {'ar': 'كشف PDF', 'en': 'PDF statement', 'ur': 'PDF اسٹیٹمنٹ', 'hi': 'PDF विवरण', 'bn': 'PDF স্টেটমেন্ট', 'fil': 'PDF statement', 'fr': 'Relevé PDF', 'tr': 'PDF ekstre'},
  'noTransactions': {'ar': 'لا توجد معاملات بعد', 'en': 'No transactions yet', 'ur': 'ابھی کوئی لین دین نہیں', 'hi': 'अभी तक कोई लेन-देन नहीं', 'bn': 'এখনও কোনো লেনদেন নেই', 'fil': 'Wala pang transaksyon', 'fr': 'Aucune transaction', 'tr': 'Henüz işlem yok'},
  'noTransactionsSub': {'ar': 'ستظهر معاملاتك هنا فور أول رحلة أو شحن', 'en': 'Your transactions will appear after your first ride or top-up', 'ur': 'پہلی سواری یا ٹاپ اپ کے بعد لین دین یہاں نظر آئے گا', 'hi': 'पहली राइड या टॉप-अप के बाद लेन-देन यहाँ दिखेंगे', 'bn': 'প্রথম রাইড বা টপ-আপের পর লেনদেন এখানে দেখাবে', 'fil': 'Lalabas ang transaksyon pagkatapos ng unang sakay o top-up', 'fr': 'Vos transactions apparaîtront après votre première course', 'tr': 'İşlemleriniz ilk yolculuk veya yüklemeden sonra görünür'},
  'addFunds': {'ar': 'إضافة رصيد', 'en': 'Add funds', 'ur': 'بیلنس شامل کریں', 'hi': 'धन जोड़ें', 'bn': 'ব্যালেন্স যোগ করুন', 'fil': 'Magdagdag ng pondo', 'fr': 'Ajouter des fonds', 'tr': 'Bakiye ekle'},
  'howMuchAdd': {'ar': 'كم تريد أن تُضيف إلى محفظتك؟', 'en': 'How much to add to your wallet?', 'ur': 'والیٹ میں کتنا شامل کرنا چاہتے ہیں؟', 'hi': 'वॉलेट में कितना जोड़ना है?', 'bn': 'ওয়ালেটে কত যোগ করবেন?', 'fil': 'Magkano ang idadagdag sa wallet?', 'fr': 'Combien ajouter à votre portefeuille ?', 'tr': 'Cüzdanınıza ne kadar eklenecek?'},
  'addFundsBtn': {'ar': 'إضافة الرصيد', 'en': 'Add funds', 'ur': 'بیلنس شامل کریں', 'hi': 'धन जोड़ें', 'bn': 'ব্যালেন্স যোগ করুন', 'fil': 'Magdagdag', 'fr': 'Ajouter', 'tr': 'Ekle'},
  'termsTitle': {'ar': 'الشروط والأحكام', 'en': 'Terms & conditions', 'ur': 'شرائط و ضوابط', 'hi': 'नियम और शर्तें', 'bn': 'শর্তাবলী', 'fil': 'Mga tuntunin', 'fr': 'Conditions générales', 'tr': 'Şartlar ve koşullar'},
  'termsBody': {'ar': 'يُضاف الرصيد إلى محفظتك فوراً بعد تأكيد الدفع. الرصيد غير قابل للاسترداد نقداً ويُستخدم في رحلات HANCR فقط.', 'en': 'Funds are added instantly after payment. Balance is non-refundable as cash and is used for HANCR rides only.', 'ur': 'ادائیگی کے بعد بیلنس فوراً شامل ہو جاتا ہے۔ نقد واپسی نہیں، صرف HANCR سواریوں کے لیے۔', 'hi': 'भुगतान के बाद धन तुरंत जुड़ जाता है। नकद वापसी नहीं, केवल HANCR राइड के लिए।', 'bn': 'পেমেন্টের পর তাৎক্ষণিক যোগ হয়। নগদে ফেরত নয়, শুধু HANCR রাইডে ব্যবহৃত।', 'fil': 'Agad na maidadagdag matapos magbayad. Hindi refundable sa cash, para sa HANCR rides lamang.', 'fr': 'Les fonds sont ajoutés instantanément. Non remboursable en espèces, pour les courses HANCR uniquement.', 'tr': 'Bakiye ödemeden sonra anında eklenir. Nakit iadesi yoktur, yalnızca HANCR yolculuklarında kullanılır.'},
  'applyTerms': {'ar': 'تطبَّق الشروط', 'en': 'Terms apply', 'ur': 'شرائط لاگو ہیں', 'hi': 'शर्तें लागू', 'bn': 'শর্ত প্রযোজ্য', 'fil': 'May mga tuntunin', 'fr': 'Conditions applicables', 'tr': 'Şartlar geçerlidir'},

  // ─── Tracking ───
  'driverOnWay': {'ar': 'السائق في الطريق', 'en': 'Driver on the way', 'ur': 'ڈرائیور راستے میں', 'hi': 'ड्राइवर रास्ते में', 'bn': 'চালক পথে আছেন', 'fil': 'Paparating ang drayber', 'fr': 'Chauffeur en route', 'tr': 'Sürücü yolda'},
  'driverArrived': {'ar': 'السائق وصل', 'en': 'Driver arrived', 'ur': 'ڈرائیور پہنچ گیا', 'hi': 'ड्राइवर पहुंच गया', 'bn': 'চালক পৌঁছেছেন', 'fil': 'Dumating na ang drayber', 'fr': 'Chauffeur arrivé', 'tr': 'Sürücü geldi'},
  'inRide': {'ar': 'في الرحلة', 'en': 'On the trip', 'ur': 'سفر میں', 'hi': 'यात्रा में', 'bn': 'যাত্রায়', 'fil': 'Nasa biyahe', 'fr': 'En course', 'tr': 'Yolculukta'},
  'inProgress': {'ar': 'جاري التنفيذ', 'en': 'In progress', 'ur': 'جاری ہے', 'hi': 'जारी है', 'bn': 'চলছে', 'fil': 'Isinasagawa', 'fr': 'En cours', 'tr': 'Devam ediyor'},
  'call': {'ar': 'اتصال', 'en': 'Call', 'ur': 'کال', 'hi': 'कॉल', 'bn': 'কল', 'fil': 'Tawag', 'fr': 'Appeler', 'tr': 'Ara'},
  'callDriver': {'ar': 'الاتصال بالسائق', 'en': 'Call driver', 'ur': 'ڈرائیور کو کال کریں', 'hi': 'ड्राइवर को कॉल करें', 'bn': 'চালককে কল করুন', 'fil': 'Tawagan ang drayber', 'fr': 'Appeler le chauffeur', 'tr': 'Sürücüyü ara'},
  'message': {'ar': 'رسالة', 'en': 'Message', 'ur': 'پیغام', 'hi': 'संदेश', 'bn': 'বার্তা', 'fil': 'Mensahe', 'fr': 'Message', 'tr': 'Mesaj'},
  'chat': {'ar': 'المحادثة', 'en': 'Chat', 'ur': 'چیٹ', 'hi': 'चैट', 'bn': 'চ্যাট', 'fil': 'Chat', 'fr': 'Discussion', 'tr': 'Sohbet'},
  'share': {'ar': 'مشاركة', 'en': 'Share', 'ur': 'شیئر', 'hi': 'साझा करें', 'bn': 'শেয়ার', 'fil': 'I-share', 'fr': 'Partager', 'tr': 'Paylaş'},
  'shareRide': {'ar': 'مشاركة الرحلة', 'en': 'Share ride', 'ur': 'سواری شیئر کریں', 'hi': 'राइड साझा करें', 'bn': 'রাইড শেয়ার করুন', 'fil': 'I-share ang sakay', 'fr': 'Partager la course', 'tr': 'Yolculuğu paylaş'},
  'arrivedShort': {'ar': 'وصل', 'en': 'Arrived', 'ur': 'پہنچ گیا', 'hi': 'पहुंचा', 'bn': 'পৌঁছেছে', 'fil': 'Dumating', 'fr': 'Arrivé', 'tr': 'Geldi'},
  'eta': {'ar': 'وقت الوصول', 'en': 'ETA', 'ur': 'پہنچنے کا وقت', 'hi': 'पहुंचने का समय', 'bn': 'পৌঁছানোর সময়', 'fil': 'ETA', 'fr': 'Arrivée', 'tr': 'Varış'},
  'fare': {'ar': 'الأجرة', 'en': 'Fare', 'ur': 'کرایہ', 'hi': 'किराया', 'bn': 'ভাড়া', 'fil': 'Pamasahe', 'fr': 'Tarif', 'tr': 'Ücret'},
  'cancelRide': {'ar': 'إلغاء الرحلة', 'en': 'Cancel ride', 'ur': 'سواری منسوخ کریں', 'hi': 'राइड रद्द करें', 'bn': 'রাইড বাতিল করুন', 'fil': 'Kanselahin ang sakay', 'fr': 'Annuler la course', 'tr': 'Yolculuğu iptal et'},
  'cancelRideConfirm': {'ar': 'هل أنت متأكد من إلغاء الرحلة؟ قد تُطبَّق رسوم إلغاء.', 'en': 'Are you sure you want to cancel? A cancellation fee may apply.', 'ur': 'کیا آپ واقعی منسوخ کرنا چاہتے ہیں؟ منسوخی فیس لاگو ہو سکتی ہے۔', 'hi': 'क्या आप वाकई रद्द करना चाहते हैं? रद्दीकरण शुल्क लग सकता है।', 'bn': 'আপনি কি নিশ্চিত? বাতিলকরণ ফি প্রযোজ্য হতে পারে।', 'fil': 'Sigurado ka bang kanselahin? May bayad sa pagkansela.', 'fr': 'Voulez-vous vraiment annuler ? Des frais peuvent s\'appliquer.', 'tr': 'İptal etmek istediğinize emin misiniz? İptal ücreti uygulanabilir.'},
  'undo': {'ar': 'تراجع', 'en': 'Go back', 'ur': 'واپس', 'hi': 'वापस', 'bn': 'ফিরে যান', 'fil': 'Bumalik', 'fr': 'Retour', 'tr': 'Geri'},
  'minShort': {'ar': 'د', 'en': 'min', 'ur': 'منٹ', 'hi': 'मिनट', 'bn': 'মিন', 'fil': 'min', 'fr': 'min', 'tr': 'dk'},
  'backHome': {'ar': 'العودة للرئيسية', 'en': 'Back to home', 'ur': 'ہوم پر واپس', 'hi': 'होम पर वापस', 'bn': 'হোমে ফিরুন', 'fil': 'Bumalik sa home', 'fr': 'Retour à l\'accueil', 'tr': 'Ana sayfaya dön'},

  // ─── Rate ───
  'rateTitle': {'ar': 'تقييم الرحلة', 'en': 'Rate the ride', 'ur': 'سواری کی درجہ بندی', 'hi': 'राइड रेट करें', 'bn': 'রাইড রেট করুন', 'fil': 'I-rate ang sakay', 'fr': 'Évaluer la course', 'tr': 'Yolculuğu değerlendir'},
  'howWasRide': {'ar': 'كيف كانت رحلتك؟', 'en': 'How was your ride?', 'ur': 'آپ کی سواری کیسی رہی؟', 'hi': 'आपकी राइड कैसी रही?', 'bn': 'আপনার রাইড কেমন ছিল?', 'fil': 'Kumusta ang sakay mo?', 'fr': 'Comment était votre course ?', 'tr': 'Yolculuğunuz nasıldı?'},
  'whatLiked': {'ar': 'ما أعجبك؟ (اختياري)', 'en': 'What did you like? (optional)', 'ur': 'آپ کو کیا پسند آیا؟ (اختیاری)', 'hi': 'आपको क्या पसंद आया? (वैकल्पिक)', 'bn': 'কী ভালো লেগেছে? (ঐচ্ছিক)', 'fil': 'Ano ang nagustuhan mo? (opsyonal)', 'fr': 'Qu\'avez-vous aimé ? (facultatif)', 'tr': 'Neyi beğendiniz? (isteğe bağlı)'},
  'tipDriver': {'ar': 'إكرامية للسائق (اختياري)', 'en': 'Tip the driver (optional)', 'ur': 'ڈرائیور کو ٹپ (اختیاری)', 'hi': 'ड्राइवर को टिप (वैकल्पिक)', 'bn': 'চালককে টিপ (ঐচ্ছিক)', 'fil': 'Tip sa drayber (opsyonal)', 'fr': 'Pourboire (facultatif)', 'tr': 'Sürücüye bahşiş (isteğe bağlı)'},
  'extraComment': {'ar': 'تعليق إضافي', 'en': 'Additional comment', 'ur': 'اضافی تبصرہ', 'hi': 'अतिरिक्त टिप्पणी', 'bn': 'অতিরিক্ত মন্তব্য', 'fil': 'Karagdagang komento', 'fr': 'Commentaire', 'tr': 'Ek yorum'},
  'shareExperience': {'ar': 'شاركنا تجربتك...', 'en': 'Share your experience...', 'ur': 'اپنا تجربہ بتائیں...', 'hi': 'अपना अनुभव साझा करें...', 'bn': 'আপনার অভিজ্ঞতা জানান...', 'fil': 'Ibahagi ang karanasan mo...', 'fr': 'Partagez votre expérience...', 'tr': 'Deneyiminizi paylaşın...'},
  'sendRating': {'ar': 'إرسال التقييم', 'en': 'Submit rating', 'ur': 'درجہ بندی بھیجیں', 'hi': 'रेटिंग भेजें', 'bn': 'রেটিং পাঠান', 'fil': 'Ipadala ang rating', 'fr': 'Envoyer l\'évaluation', 'tr': 'Değerlendirmeyi gönder'},
  'rideCompleted': {'ar': 'اكتملت الرحلة', 'en': 'Ride completed', 'ur': 'سواری مکمل', 'hi': 'राइड पूरी हुई', 'bn': 'রাইড সম্পন্ন', 'fil': 'Tapos na ang sakay', 'fr': 'Course terminée', 'tr': 'Yolculuk tamamlandı'},
  'none': {'ar': 'بدون', 'en': 'None', 'ur': 'کوئی نہیں', 'hi': 'कोई नहीं', 'bn': 'কিছু না', 'fil': 'Wala', 'fr': 'Aucun', 'tr': 'Yok'},
  'ratePro': {'ar': 'سائق محترف', 'en': 'Professional', 'ur': 'پیشہ ور', 'hi': 'पेशेवर', 'bn': 'পেশাদার', 'fil': 'Propesyonal', 'fr': 'Professionnel', 'tr': 'Profesyonel'},
  'rateClean': {'ar': 'سيارة نظيفة', 'en': 'Clean car', 'ur': 'صاف گاڑی', 'hi': 'साफ़ कार', 'bn': 'পরিষ্কার গাড়ি', 'fil': 'Malinis na kotse', 'fr': 'Voiture propre', 'tr': 'Temiz araç'},
  'rateSafe': {'ar': 'قيادة آمنة', 'en': 'Safe driving', 'ur': 'محفوظ ڈرائیونگ', 'hi': 'सुरक्षित ड्राइविंग', 'bn': 'নিরাপদ চালনা', 'fil': 'Ligtas na pagmamaneho', 'fr': 'Conduite sûre', 'tr': 'Güvenli sürüş'},
  'rateCalm': {'ar': 'هادئ ومريح', 'en': 'Calm & comfy', 'ur': 'پُرسکون اور آرام دہ', 'hi': 'शांत और आरामदायक', 'bn': 'শান্ত ও আরামদায়ক', 'fil': 'Kalmado at komportable', 'fr': 'Calme et confortable', 'tr': 'Sakin ve rahat'},
  'rateFriendly': {'ar': 'ودود', 'en': 'Friendly', 'ur': 'دوستانہ', 'hi': 'मित्रवत', 'bn': 'বন্ধুত্বপূর্ণ', 'fil': 'Magiliw', 'fr': 'Aimable', 'tr': 'Güler yüzlü'},
  'rateOnRoute': {'ar': 'ملتزم بالطريق', 'en': 'Good route', 'ur': 'درست راستہ', 'hi': 'सही रास्ता', 'bn': 'সঠিক রুট', 'fil': 'Tamang ruta', 'fr': 'Bon itinéraire', 'tr': 'Doğru rota'},
  'star5': {'ar': 'ممتاز! ⭐', 'en': 'Excellent! ⭐', 'ur': 'بہترین! ⭐', 'hi': 'उत्कृष्ट! ⭐', 'bn': 'চমৎকার! ⭐', 'fil': 'Napakahusay! ⭐', 'fr': 'Excellent ! ⭐', 'tr': 'Mükemmel! ⭐'},
  'star4': {'ar': 'جيد جداً', 'en': 'Very good', 'ur': 'بہت اچھا', 'hi': 'बहुत अच्छा', 'bn': 'খুব ভালো', 'fil': 'Napakaganda', 'fr': 'Très bien', 'tr': 'Çok iyi'},
  'star3': {'ar': 'مقبول', 'en': 'Okay', 'ur': 'ٹھیک ہے', 'hi': 'ठीक', 'bn': 'মোটামুটি', 'fil': 'Okay', 'fr': 'Correct', 'tr': 'İdare eder'},
  'star2': {'ar': 'سيِّئ', 'en': 'Bad', 'ur': 'برا', 'hi': 'खराब', 'bn': 'খারাপ', 'fil': 'Masama', 'fr': 'Mauvais', 'tr': 'Kötü'},
  'star1': {'ar': 'سيِّئ جداً', 'en': 'Very bad', 'ur': 'بہت برا', 'hi': 'बहुत खराब', 'bn': 'খুব খারাপ', 'fil': 'Napakasama', 'fr': 'Très mauvais', 'tr': 'Çok kötü'},

  // ─── Loyalty ───
  'milesTitle': {'ar': 'HANCR Miles 🏆', 'en': 'HANCR Miles 🏆', 'ur': 'HANCR Miles 🏆', 'hi': 'HANCR Miles 🏆', 'bn': 'HANCR Miles 🏆', 'fil': 'HANCR Miles 🏆', 'fr': 'HANCR Miles 🏆', 'tr': 'HANCR Miles 🏆'},
  'availableMiles': {'ar': 'الأميال المتاحة', 'en': 'Available miles', 'ur': 'دستیاب میل', 'hi': 'उपलब्ध माइल्स', 'bn': 'উপলব্ধ মাইল', 'fil': 'Available na miles', 'fr': 'Miles disponibles', 'tr': 'Kullanılabilir mil'},
  'lifetimeTotal': {'ar': 'الإجمالي مدى الحياة', 'en': 'Lifetime total', 'ur': 'تاحیات مجموعہ', 'hi': 'आजीवन कुल', 'bn': 'আজীবন মোট', 'fil': 'Lifetime total', 'fr': 'Total à vie', 'tr': 'Toplam (ömür boyu)'},
  'yourBenefits': {'ar': 'مزاياك', 'en': 'Your benefits', 'ur': 'آپ کے فوائد', 'hi': 'आपके लाभ', 'bn': 'আপনার সুবিধা', 'fil': 'Mga benepisyo mo', 'fr': 'Vos avantages', 'tr': 'Avantajlarınız'},
  'freeUpgrade': {'ar': 'ترقية مجانية للفئة الأعلى', 'en': 'Free upgrade to higher tier', 'ur': 'اعلیٰ درجے کی مفت اپ گریڈ', 'hi': 'उच्च श्रेणी में मुफ़्त अपग्रेड', 'bn': 'উচ্চ শ্রেণিতে ফ্রি আপগ্রেড', 'fil': 'Libreng upgrade sa mas mataas na tier', 'fr': 'Surclassement gratuit', 'tr': 'Üst sınıfa ücretsiz yükseltme'},
  'freeCancel': {'ar': 'إلغاء مجاني للطلبات', 'en': 'Free order cancellation', 'ur': 'مفت آرڈر منسوخی', 'hi': 'मुफ़्त ऑर्डर रद्दीकरण', 'bn': 'ফ্রি অর্ডার বাতিল', 'fil': 'Libreng pagkansela', 'fr': 'Annulation gratuite', 'tr': 'Ücretsiz iptal'},
  'enabled': {'ar': 'مفعَّل', 'en': 'Enabled', 'ur': 'فعال', 'hi': 'सक्षम', 'bn': 'সক্রিয়', 'fil': 'Naka-enable', 'fr': 'Activé', 'tr': 'Etkin'},
  'notAvailable': {'ar': 'غير متاح', 'en': 'Not available', 'ur': 'دستیاب نہیں', 'hi': 'उपलब्ध नहीं', 'bn': 'উপলব্ধ নয়', 'fil': 'Hindi available', 'fr': 'Indisponible', 'tr': 'Mevcut değil'},
  'surgeProtection': {'ar': 'حماية من Surge Pricing', 'en': 'Surge pricing protection', 'ur': 'سرج پرائسنگ سے تحفظ', 'hi': 'सर्ज प्राइसिंग सुरक्षा', 'bn': 'সার্জ প্রাইসিং সুরক্ষা', 'fil': 'Proteksyon sa surge pricing', 'fr': 'Protection tarif de pointe', 'tr': 'Yoğun fiyat koruması'},
  'availableRewards': {'ar': 'المكافآت المتاحة', 'en': 'Available rewards', 'ur': 'دستیاب انعامات', 'hi': 'उपलब्ध रिवॉर्ड', 'bn': 'উপলব্ধ পুরস্কার', 'fil': 'Available na rewards', 'fr': 'Récompenses disponibles', 'tr': 'Mevcut ödüller'},
  'discount10': {'ar': 'خصم 10%', 'en': '10% off', 'ur': '10% رعایت', 'hi': '10% छूट', 'bn': '১০٪ ছাড়', 'fil': '10% off', 'fr': '10 % de réduction', 'tr': '%10 indirim'},
  'onNextRide': {'ar': 'على رحلتك القادمة', 'en': 'On your next ride', 'ur': 'اگلی سواری پر', 'hi': 'अगली राइड पर', 'bn': 'পরের রাইডে', 'fil': 'Sa susunod na sakay', 'fr': 'Sur votre prochaine course', 'tr': 'Sonraki yolculukta'},
  'freeUpgradePlus': {'ar': 'ترقية مجانية', 'en': 'Free upgrade', 'ur': 'مفت اپ گریڈ', 'hi': 'मुफ़्त अपग्रेड', 'bn': 'ফ্রি আপগ্রেড', 'fil': 'Libreng upgrade', 'fr': 'Surclassement gratuit', 'tr': 'Ücretsiz yükseltme'},
  'forPlus': {'ar': 'للفئة Plus', 'en': 'To Plus tier', 'ur': 'Plus درجے کے لیے', 'hi': 'Plus टियर के लिए', 'bn': 'Plus টিয়ারে', 'fil': 'Sa Plus tier', 'fr': 'Vers Plus', 'tr': 'Plus seviyesine'},
  'freeRide': {'ar': 'رحلة مجانية', 'en': 'Free ride', 'ur': 'مفت سواری', 'hi': 'मुफ़्त राइड', 'bn': 'ফ্রি রাইড', 'fil': 'Libreng sakay', 'fr': 'Course gratuite', 'tr': 'Ücretsiz yolculuk'},
  'monthlyPack': {'ar': 'باقة شهرية', 'en': 'Monthly pack', 'ur': 'ماہانہ پیکج', 'hi': 'मासिक पैक', 'bn': 'মাসিক প্যাক', 'fil': 'Monthly pack', 'fr': 'Forfait mensuel', 'tr': 'Aylık paket'},
  'monthlyPackSub': {'ar': '10% خصم لشهر', 'en': '10% off for a month', 'ur': 'ایک ماہ 10% رعایت', 'hi': 'एक महीने 10% छूट', 'bn': 'এক মাস ১০٪ ছাড়', 'fil': '10% off sa isang buwan', 'fr': '10 % pendant un mois', 'tr': 'Bir ay %10 indirim'},
  'howToEarnMore': {'ar': 'كيف تكسب المزيد', 'en': 'How to earn more', 'ur': 'مزید کیسے کمائیں', 'hi': 'अधिक कैसे कमाएं', 'bn': 'আরও কীভাবে অর্জন করবেন', 'fil': 'Paano kumita ng higit pa', 'fr': 'Comment gagner plus', 'tr': 'Nasıl daha fazla kazanılır'},
  'earn1Mile': {'ar': 'اكسب 1 ميل لكل 1 ر.س تنفقه', 'en': 'Earn 1 mile per SAR spent', 'ur': 'ہر SAR پر 1 میل کمائیں', 'hi': 'प्रति SAR 1 माइल कमाएं', 'bn': 'প্রতি SAR-এ ১ মাইল অর্জন', 'fil': 'Kumita ng 1 mile bawat SAR', 'fr': '1 mile par SAR dépensé', 'tr': 'Harcanan her SAR için 1 mil'},
  'rateEarn': {'ar': 'قيّم سائقك واكسب 10 أميال إضافية', 'en': 'Rate your driver and earn 10 bonus miles', 'ur': 'ڈرائیور کی درجہ بندی کریں، 10 اضافی میل', 'hi': 'ड्राइवर रेट करें, 10 बोनस माइल पाएं', 'bn': 'চালক রেট করুন, ১০ বোনাস মাইল', 'fil': 'I-rate ang drayber, 10 bonus miles', 'fr': 'Évaluez et gagnez 10 miles bonus', 'tr': 'Sürücüyü değerlendir, 10 bonus mil kazan'},
  'promoDouble': {'ar': 'العروض الترويجية = ضعف الأميال', 'en': 'Promos = double miles', 'ur': 'پروموز = دوگنا میل', 'hi': 'प्रोमो = दोगुने माइल', 'bn': 'প্রোমো = দ্বিগুণ মাইল', 'fil': 'Promo = doble ang miles', 'fr': 'Promos = miles doublés', 'tr': 'Promosyon = çift mil'},
  'inviteEarn500': {'ar': 'ادعُ صديقاً واحصل على 500 ميل', 'en': 'Invite a friend, get 500 miles', 'ur': 'دوست کو مدعو کریں، 500 میل', 'hi': 'दोस्त को बुलाएं, 500 माइल पाएं', 'bn': 'বন্ধুকে আমন্ত্রণ, ৫০০ মাইল', 'fil': 'Mag-imbita, kumita ng 500 miles', 'fr': 'Invitez un ami, gagnez 500 miles', 'tr': 'Arkadaş davet et, 500 mil kazan'},
  'silver': {'ar': 'فضي', 'en': 'Silver', 'ur': 'چاندی', 'hi': 'सिल्वर', 'bn': 'সিলভার', 'fil': 'Silver', 'fr': 'Argent', 'tr': 'Gümüş'},
  'gold': {'ar': 'ذهبي', 'en': 'Gold', 'ur': 'سونا', 'hi': 'गोल्ड', 'bn': 'গোল্ড', 'fil': 'Ginto', 'fr': 'Or', 'tr': 'Altın'},
  'platinum': {'ar': 'بلاتيني', 'en': 'Platinum', 'ur': 'پلاٹینم', 'hi': 'प्लैटिनम', 'bn': 'প্ল্যাটিনাম', 'fil': 'Platinum', 'fr': 'Platine', 'tr': 'Platin'},
  'yourTier': {'ar': 'مستواك الحالي', 'en': 'Your current tier', 'ur': 'آپ کا موجودہ درجہ', 'hi': 'आपका वर्तमान टियर', 'bn': 'আপনার বর্তমান টিয়ার', 'fil': 'Kasalukuyang tier mo', 'fr': 'Votre niveau actuel', 'tr': 'Mevcut seviyeniz'},
  'mile': {'ar': 'ميل', 'en': 'mile', 'ur': 'میل', 'hi': 'माइल', 'bn': 'মাইল', 'fil': 'mile', 'fr': 'mile', 'tr': 'mil'},
  'topTier': {'ar': '🏆 وصلت لأعلى مستوى — استمتع!', 'en': '🏆 You reached the top tier — enjoy!', 'ur': '🏆 آپ اعلیٰ ترین درجے پر پہنچ گئے!', 'hi': '🏆 आप शीर्ष टियर पर पहुंच गए!', 'bn': '🏆 আপনি শীর্ষ টিয়ারে পৌঁছেছেন!', 'fil': '🏆 Nasa pinakamataas na tier ka na!', 'fr': '🏆 Vous avez atteint le niveau max !', 'tr': '🏆 En üst seviyeye ulaştınız!'},
  'yourProgress': {'ar': 'تقدُّمك', 'en': 'Your progress', 'ur': 'آپ کی پیش رفت', 'hi': 'आपकी प्रगति', 'bn': 'আপনার অগ্রগতি', 'fil': 'Iyong progreso', 'fr': 'Votre progression', 'tr': 'İlerlemeniz'},
  'startFirstRide': {'ar': 'ابدأ رحلتك الأولى', 'en': 'Start your first ride', 'ur': 'اپنی پہلی سواری شروع کریں', 'hi': 'अपनी पहली राइड शुरू करें', 'bn': 'আপনার প্রথম রাইড শুরু করুন', 'fil': 'Simulan ang unang sakay', 'fr': 'Commencez votre première course', 'tr': 'İlk yolculuğunuza başlayın'},
  'startFirstRideSub': {'ar': 'احجز رحلتك الأولى لتبدأ في كسب Hancr Miles', 'en': 'Book your first ride to start earning HANCR Miles', 'ur': 'HANCR Miles کمانے کے لیے پہلی سواری بک کریں', 'hi': 'HANCR Miles कमाने के लिए पहली राइड बुक करें', 'bn': 'HANCR Miles অর্জনে প্রথম রাইড বুক করুন', 'fil': 'Mag-book ng unang sakay para kumita ng HANCR Miles', 'fr': 'Réservez votre première course pour gagner des miles', 'tr': 'HANCR Mil kazanmak için ilk yolculuğunuzu ayırtın'},

  // ─── SOS ───
  'emergencyContacts': {'ar': 'جهات الطوارئ', 'en': 'Emergency contacts', 'ur': 'ہنگامی رابطے', 'hi': 'आपातकालीन संपर्क', 'bn': 'জরুরি যোগাযোগ', 'fil': 'Emergency contacts', 'fr': 'Contacts d\'urgence', 'tr': 'Acil durum kişileri'},
  'safetyFirst': {'ar': 'سلامتك أولويتنا', 'en': 'Your safety is our priority', 'ur': 'آپ کی حفاظت ہماری ترجیح', 'hi': 'आपकी सुरक्षा हमारी प्राथमिकता', 'bn': 'আপনার নিরাপত্তা আমাদের অগ্রাধিকার', 'fil': 'Kaligtasan mo ang priyoridad namin', 'fr': 'Votre sécurité est notre priorité', 'tr': 'Güvenliğiniz önceliğimiz'},
  'sosShareMsg': {'ar': 'عند الضغط على زر الطوارئ، نُرسل موقعك ورسالة استغاثة لهذه الجهات فوراً.', 'en': 'When you press SOS, we instantly send your location and an alert to these contacts.', 'ur': 'SOS دبانے پر، ہم فوراً آپ کا مقام اور الرٹ ان رابطوں کو بھیجتے ہیں۔', 'hi': 'SOS दबाने पर, हम तुरंत आपका स्थान और अलर्ट इन संपर्कों को भेजते हैं।', 'bn': 'SOS চাপলে, আমরা তৎক্ষণাৎ আপনার অবস্থান ও সতর্কতা পাঠাই।', 'fil': 'Kapag pinindot ang SOS, agad naming ipapadala ang lokasyon mo.', 'fr': 'En appuyant sur SOS, nous envoyons votre position et une alerte.', 'tr': 'SOS\'a basınca konumunuzu ve uyarıyı bu kişilere anında göndeririz.'},
  'autoShare': {'ar': '📍 مشاركة تلقائية', 'en': '📍 Auto-share', 'ur': '📍 خودکار اشتراک', 'hi': '📍 ऑटो-शेयर', 'bn': '📍 স্বয়ংক্রিয় শেয়ার', 'fil': '📍 Auto-share', 'fr': '📍 Partage auto', 'tr': '📍 Otomatik paylaşım'},
  'noContactsYet': {'ar': 'لم تضف جهات طوارئ بعد', 'en': 'No emergency contacts yet', 'ur': 'ابھی کوئی ہنگامی رابطہ نہیں', 'hi': 'अभी कोई आपातकालीन संपर्क नहीं', 'bn': 'এখনও কোনো জরুরি যোগাযোগ নেই', 'fil': 'Wala pang emergency contact', 'fr': 'Aucun contact d\'urgence', 'tr': 'Henüz acil durum kişisi yok'},
  'noContactsSub': {'ar': 'أضف الأشخاص الذين تثق بهم ليُشعَروا في حالات الطوارئ', 'en': 'Add people you trust to be alerted in emergencies', 'ur': 'بھروسے مند افراد شامل کریں جنہیں ہنگامی صورت میں اطلاع ہو', 'hi': 'विश्वसनीय लोगों को जोड़ें जिन्हें आपात स्थिति में सूचित किया जाए', 'bn': 'বিশ্বস্ত ব্যক্তিদের যোগ করুন যাদের জরুরি অবস্থায় জানানো হবে', 'fil': 'Magdagdag ng pinagkakatiwalaang tao', 'fr': 'Ajoutez des personnes de confiance', 'tr': 'Acil durumda haberdar edilecek güvendiğiniz kişileri ekleyin'},
  'addContact': {'ar': 'إضافة جهة طوارئ', 'en': 'Add emergency contact', 'ur': 'ہنگامی رابطہ شامل کریں', 'hi': 'आपातकालीन संपर्क जोड़ें', 'bn': 'জরুরি যোগাযোগ যোগ করুন', 'fil': 'Magdagdag ng emergency contact', 'fr': 'Ajouter un contact', 'tr': 'Acil durum kişisi ekle'},
  'deleteContact': {'ar': 'حذف جهة الطوارئ', 'en': 'Delete contact', 'ur': 'رابطہ حذف کریں', 'hi': 'संपर्क हटाएं', 'bn': 'যোগাযোগ মুছুন', 'fil': 'Tanggalin ang contact', 'fr': 'Supprimer le contact', 'tr': 'Kişiyi sil'},
  'sosActivate': {'ar': 'تفعيل الطوارئ', 'en': 'Activate SOS', 'ur': 'SOS فعال کریں', 'hi': 'SOS सक्रिय करें', 'bn': 'SOS সক্রিয় করুন', 'fil': 'I-activate ang SOS', 'fr': 'Activer SOS', 'tr': 'SOS\'u etkinleştir'},
  'sosActivateConfirm': {'ar': '🚨 تفعيل الطوارئ؟', 'en': '🚨 Activate emergency?', 'ur': '🚨 ہنگامی فعال کریں؟', 'hi': '🚨 आपातकाल सक्रिय करें?', 'bn': '🚨 জরুরি সক্রিয় করবেন?', 'fil': '🚨 I-activate ang emergency?', 'fr': '🚨 Activer l\'urgence ?', 'tr': '🚨 Acil durumu etkinleştir?'},
  'sosActivateBody': {'ar': 'سيُرسَل موقعك ورسالة استغاثة لكل جهات الطوارئ المسجَّلة. فعِّل هذا الزر فقط في حالات الخطر الحقيقي.', 'en': 'Your location and an alert will be sent to all saved contacts. Use only in real danger.', 'ur': 'آپ کا مقام اور الرٹ تمام رابطوں کو بھیجا جائے گا۔ صرف حقیقی خطرے میں استعمال کریں۔', 'hi': 'आपका स्थान और अलर्ट सभी संपर्कों को भेजा जाएगा। केवल वास्तविक खतरे में उपयोग करें।', 'bn': 'আপনার অবস্থান ও সতর্কতা সব যোগাযোগে পাঠানো হবে। শুধু প্রকৃত বিপদে ব্যবহার করুন।', 'fil': 'Ipapadala ang lokasyon mo sa lahat ng contact. Gamitin lang sa tunay na panganib.', 'fr': 'Votre position sera envoyée à tous les contacts. À utiliser en cas de danger réel.', 'tr': 'Konumunuz ve uyarı tüm kişilere gönderilir. Yalnızca gerçek tehlikede kullanın.'},
  'yesActivate': {'ar': 'نعم، فعِّل الآن', 'en': 'Yes, activate now', 'ur': 'ہاں، ابھی فعال کریں', 'hi': 'हाँ, अभी सक्रिय करें', 'bn': 'হ্যাঁ, এখন সক্রিয় করুন', 'fil': 'Oo, i-activate na', 'fr': 'Oui, activer', 'tr': 'Evet, şimdi etkinleştir'},
  'sosActiveTitle': {'ar': '🚨 طوارئ نشطة', 'en': '🚨 Emergency active', 'ur': '🚨 ہنگامی فعال', 'hi': '🚨 आपातकाल सक्रिय', 'bn': '🚨 জরুরি সক্রিয়', 'fil': '🚨 Aktibo ang emergency', 'fr': '🚨 Urgence active', 'tr': '🚨 Acil durum aktif'},
  'areYouSafe': {'ar': 'هل أنت بأمان الآن؟', 'en': 'Are you safe now?', 'ur': 'کیا آپ اب محفوظ ہیں؟', 'hi': 'क्या आप अब सुरक्षित हैं?', 'bn': 'আপনি কি এখন নিরাপদ?', 'fil': 'Ligtas ka na ba?', 'fr': 'Êtes-vous en sécurité ?', 'tr': 'Şimdi güvende misiniz?'},
  'yesSafe': {'ar': 'نعم، أنا بأمان', 'en': 'Yes, I\'m safe', 'ur': 'ہاں، میں محفوظ ہوں', 'hi': 'हाँ, मैं सुरक्षित हूँ', 'bn': 'হ্যাঁ, আমি নিরাপদ', 'fil': 'Oo, ligtas ako', 'fr': 'Oui, je suis en sécurité', 'tr': 'Evet, güvendeyim'},
  'noContinueDanger': {'ar': 'لا، الخطر مستمر', 'en': 'No, still in danger', 'ur': 'نہیں، خطرہ جاری ہے', 'hi': 'नहीं, अभी भी खतरा है', 'bn': 'না, এখনও বিপদে', 'fil': 'Hindi, may panganib pa', 'fr': 'Non, toujours en danger', 'tr': 'Hayır, hâlâ tehlikede'},
  'noContactsTitle': {'ar': 'لا توجد جهات طوارئ', 'en': 'No emergency contacts', 'ur': 'کوئی ہنگامی رابطہ نہیں', 'hi': 'कोई आपातकालीन संपर्क नहीं', 'bn': 'কোনো জরুরি যোগাযোগ নেই', 'fil': 'Walang emergency contact', 'fr': 'Aucun contact d\'urgence', 'tr': 'Acil durum kişisi yok'},
  'noContactsBody': {'ar': 'لم تُسجِّل جهات طوارئ بعد. يُنصح بإضافتها أولاً ليتم إشعارها تلقائياً.', 'en': 'No contacts saved yet. We recommend adding some so they\'re alerted automatically.', 'ur': 'ابھی کوئی رابطہ محفوظ نہیں۔ پہلے شامل کریں تاکہ خودکار اطلاع ہو۔', 'hi': 'अभी कोई संपर्क सहेजा नहीं। पहले जोड़ें ताकि स्वतः सूचित हों।', 'bn': 'এখনও কোনো যোগাযোগ নেই। আগে যোগ করুন যেন স্বয়ংক্রিয়ভাবে জানানো হয়।', 'fil': 'Wala pang contact. Magdagdag muna para automatic silang ma-alerto.', 'fr': 'Aucun contact enregistré. Ajoutez-en pour qu\'ils soient alertés.', 'tr': 'Henüz kişi yok. Otomatik bildirim için eklemenizi öneririz.'},
  'addNow': {'ar': 'إضافة الآن', 'en': 'Add now', 'ur': 'ابھی شامل کریں', 'hi': 'अभी जोड़ें', 'bn': 'এখন যোগ করুন', 'fil': 'Magdagdag na', 'fr': 'Ajouter', 'tr': 'Şimdi ekle'},
  'activateWithout': {'ar': 'تفعيل بدون جهات', 'en': 'Activate without contacts', 'ur': 'رابطوں کے بغیر فعال کریں', 'hi': 'बिना संपर्क सक्रिय करें', 'bn': 'যোগাযোগ ছাড়াই সক্রিয় করুন', 'fil': 'I-activate nang walang contact', 'fr': 'Activer sans contacts', 'tr': 'Kişisiz etkinleştir'},
  'contactSmsHint': {'ar': 'سيُرسَل لها SMS تلقائياً عند تفعيل الطوارئ', 'en': 'They\'ll get an automatic SMS when SOS is triggered', 'ur': 'SOS فعال ہونے پر انہیں خودکار SMS جائے گا', 'hi': 'SOS सक्रिय होने पर उन्हें स्वतः SMS मिलेगा', 'bn': 'SOS সক্রিয় হলে তাদের স্বয়ংক্রিয় SMS যাবে', 'fil': 'Makakatanggap sila ng SMS kapag na-trigger ang SOS', 'fr': 'Ils recevront un SMS automatique en cas de SOS', 'tr': 'SOS tetiklendiğinde otomatik SMS alırlar'},
  'name': {'ar': 'الاسم', 'en': 'Name', 'ur': 'نام', 'hi': 'नाम', 'bn': 'নাম', 'fil': 'Pangalan', 'fr': 'Nom', 'tr': 'Ad'},
  'nameExample': {'ar': 'مثال: أبي', 'en': 'e.g. Dad', 'ur': 'مثلاً: ابو', 'hi': 'जैसे: पापा', 'bn': 'যেমন: বাবা', 'fil': 'hal. Tatay', 'fr': 'ex. Papa', 'tr': 'örn. Baba'},
  'phoneNumber': {'ar': 'رقم الهاتف', 'en': 'Phone number', 'ur': 'فون نمبر', 'hi': 'फ़ोन नंबर', 'bn': 'ফোন নম্বর', 'fil': 'Numero ng telepono', 'fr': 'Numéro de téléphone', 'tr': 'Telefon numarası'},
  'e164Hint': {'ar': 'بصيغة دولية كاملة (E.164)', 'en': 'Full international format (E.164)', 'ur': 'مکمل بین الاقوامی فارمیٹ (E.164)', 'hi': 'पूर्ण अंतरराष्ट्रीय प्रारूप (E.164)', 'bn': 'সম্পূর্ণ আন্তর্জাতিক ফরম্যাট (E.164)', 'fil': 'Buong international format (E.164)', 'fr': 'Format international complet (E.164)', 'tr': 'Tam uluslararası biçim (E.164)'},
  'relation': {'ar': 'العلاقة', 'en': 'Relationship', 'ur': 'رشتہ', 'hi': 'रिश्ता', 'bn': 'সম্পর্ক', 'fil': 'Relasyon', 'fr': 'Relation', 'tr': 'İlişki'},
  'autoShareRides': {'ar': 'مشاركة الرحلات تلقائياً', 'en': 'Auto-share rides', 'ur': 'سواری خودکار شیئر کریں', 'hi': 'राइड स्वतः साझा करें', 'bn': 'রাইড স্বয়ংক্রিয় শেয়ার', 'fil': 'Auto-share ng sakay', 'fr': 'Partage auto des courses', 'tr': 'Yolculukları otomatik paylaş'},
  'autoShareSub': {'ar': 'تُشارَك تفاصيل كل رحلة مع هذه الجهة', 'en': 'Every ride\'s details are shared with this contact', 'ur': 'ہر سواری کی تفصیلات اس رابطے سے شیئر ہوں گی', 'hi': 'हर राइड का विवरण इस संपर्क से साझा होगा', 'bn': 'প্রতি রাইডের বিবরণ এই যোগাযোগে শেয়ার হবে', 'fil': 'Ibabahagi sa contact na ito ang bawat sakay', 'fr': 'Les détails de chaque course sont partagés avec ce contact', 'tr': 'Her yolculuğun ayrıntıları bu kişiyle paylaşılır'},
  'addThisContact': {'ar': 'إضافة الجهة', 'en': 'Add contact', 'ur': 'رابطہ شامل کریں', 'hi': 'संपर्क जोड़ें', 'bn': 'যোগাযোগ যোগ করুন', 'fil': 'Idagdag ang contact', 'fr': 'Ajouter le contact', 'tr': 'Kişiyi ekle'},
};
