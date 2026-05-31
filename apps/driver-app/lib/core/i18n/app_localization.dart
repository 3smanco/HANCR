import 'dart:ui';
import 'package:flutter/material.dart';
import '../services/storage_service.dart';

/// نظام تعدد اللغات لتطبيق السائق — 8 لغات.
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

String tr(String key) {
  final code = LocaleController.instance.value.languageCode;
  final entry = _t[key];
  if (entry == null) return key;
  return entry[code] ?? entry['en'] ?? key;
}

// ════════════════════════════════════════════════════════════════
const Map<String, Map<String, String>> _t = {
  // ─── Common ───
  'confirm': {'ar': 'تأكيد', 'en': 'Confirm', 'ur': 'تصدیق کریں', 'hi': 'पुष्टि करें', 'bn': 'নিশ্চিত করুন', 'fil': 'Kumpirmahin', 'fr': 'Confirmer', 'tr': 'Onayla'},
  'cancel': {'ar': 'إلغاء', 'en': 'Cancel', 'ur': 'منسوخ', 'hi': 'रद्द करें', 'bn': 'বাতিল', 'fil': 'Kanselahin', 'fr': 'Annuler', 'tr': 'İptal'},
  'save': {'ar': 'حفظ', 'en': 'Save', 'ur': 'محفوظ کریں', 'hi': 'सहेजें', 'bn': 'সংরক্ষণ', 'fil': 'I-save', 'fr': 'Enregistrer', 'tr': 'Kaydet'},
  'retry': {'ar': 'إعادة المحاولة', 'en': 'Retry', 'ur': 'دوبارہ کوشش', 'hi': 'पुनः प्रयास', 'bn': 'আবার চেষ্টা', 'fil': 'Subukan ulit', 'fr': 'Réessayer', 'tr': 'Tekrar dene'},
  'ok': {'ar': 'حسناً', 'en': 'OK', 'ur': 'ٹھیک ہے', 'hi': 'ठीक है', 'bn': 'ঠিক আছে', 'fil': 'OK', 'fr': 'OK', 'tr': 'Tamam'},
  'delete': {'ar': 'حذف', 'en': 'Delete', 'ur': 'حذف', 'hi': 'हटाएं', 'bn': 'মুছুন', 'fil': 'Tanggalin', 'fr': 'Supprimer', 'tr': 'Sil'},
  'noData': {'ar': 'لا توجد بيانات', 'en': 'No data', 'ur': 'کوئی ڈیٹا نہیں', 'hi': 'कोई डेटा नहीं', 'bn': 'কোনো ডেটা নেই', 'fil': 'Walang data', 'fr': 'Aucune donnée', 'tr': 'Veri yok'},
  'comingSoon': {'ar': 'قريباً', 'en': 'Coming soon', 'ur': 'جلد آ رہا ہے', 'hi': 'जल्द आ रहा है', 'bn': 'শীঘ্রই আসছে', 'fil': 'Malapit na', 'fr': 'Bientôt', 'tr': 'Yakında'},

  // ─── Nav (driver tabs) ───
  'nav_map': {'ar': 'الخريطة', 'en': 'Map', 'ur': 'نقشہ', 'hi': 'मानचित्र', 'bn': 'মানচিত্র', 'fil': 'Mapa', 'fr': 'Carte', 'tr': 'Harita'},
  'nav_earnings': {'ar': 'الأرباح', 'en': 'Earnings', 'ur': 'کمائی', 'hi': 'कमाई', 'bn': 'আয়', 'fil': 'Kita', 'fr': 'Gains', 'tr': 'Kazançlar'},
  'nav_stars': {'ar': 'النجوم', 'en': 'Stars', 'ur': 'اسٹارز', 'hi': 'स्टार्स', 'bn': 'স্টার', 'fil': 'Stars', 'fr': 'Étoiles', 'tr': 'Yıldızlar'},
  'nav_account': {'ar': 'حسابي', 'en': 'Account', 'ur': 'اکاؤنٹ', 'hi': 'खाता', 'bn': 'অ্যাকাউন্ট', 'fil': 'Account', 'fr': 'Compte', 'tr': 'Hesap'},

  // ─── Home / Online ───
  'online': {'ar': 'متصل', 'en': 'Online', 'ur': 'آن لائن', 'hi': 'ऑनलाइन', 'bn': 'অনলাইন', 'fil': 'Online', 'fr': 'En ligne', 'tr': 'Çevrimiçi'},
  'offline': {'ar': 'غير متصل', 'en': 'Offline', 'ur': 'آف لائن', 'hi': 'ऑफ़लाइन', 'bn': 'অফলাইন', 'fil': 'Offline', 'fr': 'Hors ligne', 'tr': 'Çevrimdışı'},
  'onlineReceiving': {'ar': 'متصل — تستقبل الطلبات', 'en': 'Online — receiving orders', 'ur': 'آن لائن — آرڈرز موصول', 'hi': 'ऑनलाइन — ऑर्डर मिल रहे', 'bn': 'অনলাইন — অর্ডার আসছে', 'fil': 'Online — tumatanggap ng order', 'fr': 'En ligne — réception des commandes', 'tr': 'Çevrimiçi — sipariş alınıyor'},
  'startReceiving': {'ar': 'ابدأ الاستقبال', 'en': 'Start receiving', 'ur': 'وصول شروع کریں', 'hi': 'प्राप्त करना शुरू करें', 'bn': 'গ্রহণ শুরু করুন', 'fil': 'Simulan ang pagtanggap', 'fr': 'Commencer à recevoir', 'tr': 'Almaya başla'},
  'youOffline': {'ar': 'أنت غير متصل الآن', 'en': 'You are offline', 'ur': 'آپ آف لائن ہیں', 'hi': 'आप ऑफ़लाइन हैं', 'bn': 'আপনি অফলাইন', 'fil': 'Offline ka', 'fr': 'Vous êtes hors ligne', 'tr': 'Çevrimdışısınız'},
  'youOnline': {'ar': 'أنت متصل الآن 🚗', 'en': 'You are online 🚗', 'ur': 'آپ آن لائن ہیں 🚗', 'hi': 'आप ऑनलाइन हैं 🚗', 'bn': 'আপনি অনলাইন 🚗', 'fil': 'Online ka na 🚗', 'fr': 'Vous êtes en ligne 🚗', 'tr': 'Çevrimiçisiniz 🚗'},
  'activeRide': {'ar': 'رحلة نشطة', 'en': 'Active ride', 'ur': 'فعال سواری', 'hi': 'सक्रिय राइड', 'bn': 'সক্রিয় রাইড', 'fil': 'Aktibong sakay', 'fr': 'Course active', 'tr': 'Aktif yolculuk'},
  'bids': {'ar': 'المزايدات', 'en': 'Bids', 'ur': 'بولیاں', 'hi': 'बिड्स', 'bn': 'বিড', 'fil': 'Mga bid', 'fr': 'Enchères', 'tr': 'Teklifler'},
  'availableBids': {'ar': 'المزايدات المتاحة', 'en': 'Available bids', 'ur': 'دستیاب بولیاں', 'hi': 'उपलब्ध बिड्स', 'bn': 'উপলব্ধ বিড', 'fil': 'Available na bid', 'fr': 'Enchères disponibles', 'tr': 'Mevcut teklifler'},
  'noBids': {'ar': 'لا توجد مزايدات حالياً', 'en': 'No open bids right now', 'ur': 'ابھی کوئی بولی نہیں', 'hi': 'अभी कोई बिड नहीं', 'bn': 'এখন কোনো বিড নেই', 'fil': 'Walang bukas na bid ngayon', 'fr': 'Aucune enchère ouverte', 'tr': 'Şu an açık teklif yok'},
  'riderProposed': {'ar': 'سعر الراكب', 'en': 'Rider\'s price', 'ur': 'مسافر کی قیمت', 'hi': 'राइडर की कीमत', 'bn': 'যাত্রীর দাম', 'fil': 'Presyo ng pasahero', 'fr': 'Prix du passager', 'tr': 'Yolcunun fiyatı'},
  'submitOffer': {'ar': 'قدّم عرضاً', 'en': 'Submit offer', 'ur': 'پیشکش دیں', 'hi': 'ऑफ़र दें', 'bn': 'অফার দিন', 'fil': 'Mag-alok', 'fr': 'Faire une offre', 'tr': 'Teklif ver'},
  'yourOffer': {'ar': 'سعرك المعروض', 'en': 'Your offered price', 'ur': 'آپ کی پیشکش', 'hi': 'आपका ऑफ़र', 'bn': 'আপনার অফার', 'fil': 'Iyong alok', 'fr': 'Votre offre', 'tr': 'Teklifiniz'},
  'offerSent': {'ar': 'تم إرسال عرضك ✓', 'en': 'Offer sent ✓', 'ur': 'پیشکش بھیج دی ✓', 'hi': 'ऑफ़र भेजा गया ✓', 'bn': 'অফার পাঠানো হয়েছে ✓', 'fil': 'Naipadala ang alok ✓', 'fr': 'Offre envoyée ✓', 'tr': 'Teklif gönderildi ✓'},
  'offered': {'ar': 'تم العرض', 'en': 'Offered', 'ur': 'پیشکش کر دی', 'hi': 'ऑफ़र किया', 'bn': 'অফার করা হয়েছে', 'fil': 'Inalok na', 'fr': 'Offert', 'tr': 'Teklif verildi'},
  'send': {'ar': 'إرسال', 'en': 'Send', 'ur': 'بھیجیں', 'hi': 'भेजें', 'bn': 'পাঠান', 'fil': 'Ipadala', 'fr': 'Envoyer', 'tr': 'Gönder'},

  // ─── Earnings ───
  'today': {'ar': 'اليوم', 'en': 'Today', 'ur': 'آج', 'hi': 'आज', 'bn': 'আজ', 'fil': 'Ngayon', 'fr': 'Aujourd\'hui', 'tr': 'Bugün'},
  'week': {'ar': 'الأسبوع', 'en': 'Week', 'ur': 'ہفتہ', 'hi': 'सप्ताह', 'bn': 'সপ্তাহ', 'fil': 'Linggo', 'fr': 'Semaine', 'tr': 'Hafta'},
  'month': {'ar': 'الشهر', 'en': 'Month', 'ur': 'مہینہ', 'hi': 'महीना', 'bn': 'মাস', 'fil': 'Buwan', 'fr': 'Mois', 'tr': 'Ay'},
  'total': {'ar': 'الإجمالي', 'en': 'Total', 'ur': 'کل', 'hi': 'कुल', 'bn': 'মোট', 'fil': 'Kabuuan', 'fr': 'Total', 'tr': 'Toplam'},
  'earnings': {'ar': 'الأرباح', 'en': 'Earnings', 'ur': 'کمائی', 'hi': 'कमाई', 'bn': 'আয়', 'fil': 'Kita', 'fr': 'Gains', 'tr': 'Kazançlar'},
  'trips': {'ar': 'الرحلات', 'en': 'Trips', 'ur': 'سفر', 'hi': 'राइड्स', 'bn': 'ট্রিপ', 'fil': 'Mga biyahe', 'fr': 'Courses', 'tr': 'Yolculuklar'},
  'rating': {'ar': 'التقييم', 'en': 'Rating', 'ur': 'درجہ بندی', 'hi': 'रेटिंग', 'bn': 'রেটিং', 'fil': 'Rating', 'fr': 'Note', 'tr': 'Puan'},
  'hours': {'ar': 'الساعات', 'en': 'Hours', 'ur': 'گھنٹے', 'hi': 'घंटे', 'bn': 'ঘণ্টা', 'fil': 'Oras', 'fr': 'Heures', 'tr': 'Saat'},
  'kilometers': {'ar': 'الكيلومترات', 'en': 'Kilometers', 'ur': 'کلومیٹر', 'hi': 'किलोमीटर', 'bn': 'কিলোমিটার', 'fil': 'Kilometro', 'fr': 'Kilomètres', 'tr': 'Kilometre'},
  'withdraw': {'ar': 'سحب الرصيد', 'en': 'Withdraw', 'ur': 'رقم نکالیں', 'hi': 'निकासी', 'bn': 'উত্তোলন', 'fil': 'Mag-withdraw', 'fr': 'Retirer', 'tr': 'Para çek'},
  'statement': {'ar': 'كشف الحساب', 'en': 'Statement', 'ur': 'اسٹیٹمنٹ', 'hi': 'विवरण', 'bn': 'স্টেটমেন্ট', 'fil': 'Statement', 'fr': 'Relevé', 'tr': 'Ekstre'},
  'tripDetails': {'ar': 'تفاصيل كل رحلة', 'en': 'Details of each trip', 'ur': 'ہر سفر کی تفصیل', 'hi': 'हर राइड का विवरण', 'bn': 'প্রতিটি ট্রিপের বিবরণ', 'fil': 'Detalye ng bawat biyahe', 'fr': 'Détails de chaque course', 'tr': 'Her yolculuğun ayrıntısı'},
  'bankAccount': {'ar': 'الحساب البنكي', 'en': 'Bank account', 'ur': 'بینک اکاؤنٹ', 'hi': 'बैंक खाता', 'bn': 'ব্যাংক অ্যাকাউন্ট', 'fil': 'Bank account', 'fr': 'Compte bancaire', 'tr': 'Banka hesabı'},
  'notLinked': {'ar': 'لم يُربط بعد', 'en': 'Not linked yet', 'ur': 'ابھی منسلک نہیں', 'hi': 'अभी लिंक नहीं', 'bn': 'এখনও যুক্ত নয়', 'fil': 'Hindi pa naka-link', 'fr': 'Pas encore lié', 'tr': 'Henüz bağlı değil'},
  'balanceIssue': {'ar': 'مشكلة في الرصيد؟', 'en': 'Balance issue?', 'ur': 'بیلنس میں مسئلہ؟', 'hi': 'बैलेंस समस्या?', 'bn': 'ব্যালেন্স সমস্যা?', 'fil': 'May problema sa balanse?', 'fr': 'Problème de solde ?', 'tr': 'Bakiye sorunu mu?'},
  'contactSupport': {'ar': 'تواصل مع الدعم', 'en': 'Contact support', 'ur': 'سپورٹ سے رابطہ', 'hi': 'सहायता से संपर्क करें', 'bn': 'সাপোর্টে যোগাযোগ', 'fil': 'Makipag-ugnayan sa support', 'fr': 'Contacter le support', 'tr': 'Desteğe ulaşın'},
  'availableToWithdraw': {'ar': 'الأرباح المتاحة للسحب', 'en': 'Available to withdraw', 'ur': 'نکالنے کے لیے دستیاب', 'hi': 'निकासी के लिए उपलब्ध', 'bn': 'উত্তোলনযোগ্য', 'fil': 'Available para i-withdraw', 'fr': 'Disponible au retrait', 'tr': 'Çekilebilir tutar'},

  // ─── Stars ───
  'yourBenefits': {'ar': 'مزاياك', 'en': 'Your benefits', 'ur': 'آپ کے فوائد', 'hi': 'आपके लाभ', 'bn': 'আপনার সুবিধা', 'fil': 'Mga benepisyo mo', 'fr': 'Vos avantages', 'tr': 'Avantajlarınız'},
  'priorityOrders': {'ar': 'أولوية في الطلبات', 'en': 'Priority on orders', 'ur': 'آرڈرز میں ترجیح', 'hi': 'ऑर्डर में प्राथमिकता', 'bn': 'অর্ডারে অগ্রাধিকার', 'fil': 'Priority sa order', 'fr': 'Priorité sur les commandes', 'tr': 'Siparişlerde öncelik'},
  'priorityOrdersSub': {'ar': 'احصل على أكثر الطلبات قيمة', 'en': 'Get the most valuable orders', 'ur': 'سب سے قیمتی آرڈرز پائیں', 'hi': 'सबसे मूल्यवान ऑर्डर पाएं', 'bn': 'সবচেয়ে মূল্যবান অর্ডার পান', 'fil': 'Makakuha ng pinakamahalagang order', 'fr': 'Obtenez les commandes les plus rentables', 'tr': 'En değerli siparişleri alın'},
  'lowerCommission': {'ar': 'عمولات أقل', 'en': 'Lower commission', 'ur': 'کم کمیشن', 'hi': 'कम कमीशन', 'bn': 'কম কমিশন', 'fil': 'Mas mababang komisyon', 'fr': 'Commission réduite', 'tr': 'Daha düşük komisyon'},
  'lowerCommissionSub': {'ar': 'وفّر حتى 3% من العمولة', 'en': 'Save up to 3% commission', 'ur': '3% تک کمیشن بچائیں', 'hi': '3% तक कमीशन बचाएं', 'bn': '৩٪ পর্যন্ত কমিশন সাশ্রয়', 'fil': 'Makatipid hanggang 3% komisyon', 'fr': 'Jusqu\'à 3 % de commission économisée', 'tr': '%3\'e kadar komisyon tasarrufu'},
  'perfRewards': {'ar': 'مكافآت أداء', 'en': 'Performance rewards', 'ur': 'کارکردگی انعامات', 'hi': 'प्रदर्शन पुरस्कार', 'bn': 'পারফরম্যান্স পুরস্কার', 'fil': 'Performance rewards', 'fr': 'Récompenses de performance', 'tr': 'Performans ödülleri'},
  'perfRewardsSub': {'ar': 'مكافآت إضافية لإكمال أهداف يومية', 'en': 'Bonuses for daily goals', 'ur': 'روزانہ اہداف پر اضافی بونس', 'hi': 'दैनिक लक्ष्यों पर बोनस', 'bn': 'দৈনিক লক্ষ্যে বোনাস', 'fil': 'Bonus sa araw-araw na layunin', 'fr': 'Bonus pour objectifs quotidiens', 'tr': 'Günlük hedefler için bonus'},
  'commissionLabel': {'ar': 'عمولة', 'en': 'Commission', 'ur': 'کمیشن', 'hi': 'कमीशन', 'bn': 'কমিশন', 'fil': 'Komisyon', 'fr': 'Commission', 'tr': 'Komisyon'},

  // ─── Profile ───
  'driver': {'ar': 'السائق', 'en': 'Driver', 'ur': 'ڈرائیور', 'hi': 'ड्राइवर', 'bn': 'চালক', 'fil': 'Drayber', 'fr': 'Chauffeur', 'tr': 'Sürücü'},
  'myAccount': {'ar': 'حسابي', 'en': 'My account', 'ur': 'میرا اکاؤنٹ', 'hi': 'मेरा खाता', 'bn': 'আমার অ্যাকাউন্ট', 'fil': 'Aking account', 'fr': 'Mon compte', 'tr': 'Hesabım'},
  'wallet': {'ar': 'محفظة', 'en': 'Wallet', 'ur': 'والیٹ', 'hi': 'वॉलेट', 'bn': 'ওয়ালেট', 'fil': 'Wallet', 'fr': 'Portefeuille', 'tr': 'Cüzdan'},
  'emergencyContacts': {'ar': 'جهات الطوارئ', 'en': 'Emergency contacts', 'ur': 'ہنگامی رابطے', 'hi': 'आपातकालीन संपर्क', 'bn': 'জরুরি যোগাযোগ', 'fil': 'Emergency contacts', 'fr': 'Contacts d\'urgence', 'tr': 'Acil durum kişileri'},
  'support': {'ar': 'دعم', 'en': 'Support', 'ur': 'سپورٹ', 'hi': 'सहायता', 'bn': 'সাপোর্ট', 'fil': 'Suporta', 'fr': 'Support', 'tr': 'Destek'},
  'carData': {'ar': 'بيانات السيارة', 'en': 'Car details', 'ur': 'گاڑی کی تفصیلات', 'hi': 'कार विवरण', 'bn': 'গাড়ির তথ্য', 'fil': 'Detalye ng kotse', 'fr': 'Détails du véhicule', 'tr': 'Araç bilgileri'},
  'licenseData': {'ar': 'بيانات الرخصة', 'en': 'License details', 'ur': 'لائسنس تفصیلات', 'hi': 'लाइसेंस विवरण', 'bn': 'লাইসেন্স তথ্য', 'fil': 'Detalye ng lisensya', 'fr': 'Détails du permis', 'tr': 'Ehliyet bilgileri'},
  'verified': {'ar': 'موثَّق ✓', 'en': 'Verified ✓', 'ur': 'تصدیق شدہ ✓', 'hi': 'सत्यापित ✓', 'bn': 'যাচাইকৃত ✓', 'fil': 'Na-verify ✓', 'fr': 'Vérifié ✓', 'tr': 'Doğrulandı ✓'},
  'settings': {'ar': 'الإعدادات', 'en': 'Settings', 'ur': 'ترتیبات', 'hi': 'सेटिंग्स', 'bn': 'সেটিংস', 'fil': 'Mga setting', 'fr': 'Paramètres', 'tr': 'Ayarlar'},
  'verifiedDriver': {'ar': 'سائق موثَّق', 'en': 'Verified driver', 'ur': 'تصدیق شدہ ڈرائیور', 'hi': 'सत्यापित ड्राइवर', 'bn': 'যাচাইকৃত চালক', 'fil': 'Verified na drayber', 'fr': 'Chauffeur vérifié', 'tr': 'Doğrulanmış sürücü'},
  'logout': {'ar': 'تسجيل الخروج', 'en': 'Log out', 'ur': 'لاگ آؤٹ', 'hi': 'लॉग आउट', 'bn': 'লগ আউট', 'fil': 'Mag-logout', 'fr': 'Déconnexion', 'tr': 'Çıkış yap'},

  // ─── Wallet ───
  'myWallet': {'ar': 'محفظتي', 'en': 'My wallet', 'ur': 'میرا والیٹ', 'hi': 'मेरा वॉलेट', 'bn': 'আমার ওয়ালেট', 'fil': 'Aking wallet', 'fr': 'Mon portefeuille', 'tr': 'Cüzdanım'},
  'availableEarnings': {'ar': 'الأرباح المتاحة', 'en': 'Available earnings', 'ur': 'دستیاب کمائی', 'hi': 'उपलब्ध कमाई', 'bn': 'উপলব্ধ আয়', 'fil': 'Available na kita', 'fr': 'Gains disponibles', 'tr': 'Kullanılabilir kazanç'},
  'requestWithdrawal': {'ar': 'طلب سحب', 'en': 'Request withdrawal', 'ur': 'رقم نکالنے کی درخواست', 'hi': 'निकासी अनुरोध', 'bn': 'উত্তোলন অনুরোধ', 'fil': 'Humiling ng withdrawal', 'fr': 'Demander un retrait', 'tr': 'Para çekme talebi'},
  'transactions': {'ar': 'المعاملات', 'en': 'Transactions', 'ur': 'لین دین', 'hi': 'लेन-देन', 'bn': 'লেনদেন', 'fil': 'Mga transaksyon', 'fr': 'Transactions', 'tr': 'İşlemler'},
  'pendingApproval': {'ar': 'بانتظار الموافقة', 'en': 'Pending approval', 'ur': 'منظوری کا انتظار', 'hi': 'अनुमोदन लंबित', 'bn': 'অনুমোদনের অপেক্ষায়', 'fil': 'Naghihintay ng approval', 'fr': 'En attente d\'approbation', 'tr': 'Onay bekliyor'},
  'noTransactions': {'ar': 'لا توجد معاملات', 'en': 'No transactions', 'ur': 'کوئی لین دین نہیں', 'hi': 'कोई लेन-देन नहीं', 'bn': 'কোনো লেনদেন নেই', 'fil': 'Walang transaksyon', 'fr': 'Aucune transaction', 'tr': 'İşlem yok'},
  'amount': {'ar': 'المبلغ', 'en': 'Amount', 'ur': 'رقم', 'hi': 'राशि', 'bn': 'পরিমাণ', 'fil': 'Halaga', 'fr': 'Montant', 'tr': 'Tutar'},

  // ─── Withdrawal ───
  'enterValidAmount': {'ar': 'أدخل مبلغاً صحيحاً', 'en': 'Enter a valid amount', 'ur': 'درست رقم درج کریں', 'hi': 'मान्य राशि दर्ज करें', 'bn': 'সঠিক পরিমাণ দিন', 'fil': 'Maglagay ng wastong halaga', 'fr': 'Entrez un montant valide', 'tr': 'Geçerli bir tutar girin'},
  'choosePercent': {'ar': 'اختر نسبة من رصيدك', 'en': 'Choose a percentage of your balance', 'ur': 'اپنے بیلنس کا فیصد چنیں', 'hi': 'अपने बैलेंस का प्रतिशत चुनें', 'bn': 'আপনার ব্যালেন্সের শতাংশ বাছুন', 'fil': 'Pumili ng porsyento ng balanse', 'fr': 'Choisissez un pourcentage de votre solde', 'tr': 'Bakiyenizden bir yüzde seçin'},
  'all': {'ar': 'الكل', 'en': 'All', 'ur': 'سب', 'hi': 'सभी', 'bn': 'সব', 'fil': 'Lahat', 'fr': 'Tout', 'tr': 'Tümü'},
  'orCustomAmount': {'ar': 'أو أدخل مبلغاً مخصصاً', 'en': 'Or enter a custom amount', 'ur': 'یا اپنی مرضی کی رقم درج کریں', 'hi': 'या कस्टम राशि दर्ज करें', 'bn': 'অথবা কাস্টম পরিমাণ দিন', 'fil': 'O maglagay ng custom na halaga', 'fr': 'Ou entrez un montant personnalisé', 'tr': 'Veya özel bir tutar girin'},
  'withdrawalNote': {'ar': 'سيُحوَّل المبلغ إلى حسابك البنكي المسجَّل خلال 1-3 أيام عمل بعد موافقة الإدارة. سيُحجز المبلغ من رصيدك فور تقديم الطلب.', 'en': 'The amount will be transferred to your registered bank account within 1-3 business days after admin approval. It will be reserved from your balance once requested.', 'ur': 'منظوری کے بعد رقم 1-3 کاروباری دنوں میں آپ کے بینک اکاؤنٹ میں منتقل ہوگی۔ درخواست پر رقم محفوظ ہو جائے گی۔', 'hi': 'अनुमोदन के बाद राशि 1-3 कार्यदिवसों में आपके बैंक खाते में स्थानांतरित होगी। अनुरोध पर राशि आरक्षित हो जाएगी।', 'bn': 'অনুমোদনের পর ১-৩ কর্মদিবসে আপনার ব্যাংক অ্যাকাউন্টে স্থানান্তরিত হবে। অনুরোধে পরিমাণ সংরক্ষিত হবে।', 'fil': 'Ililipat sa bank account mo sa loob ng 1-3 araw matapos ma-approve. Mare-reserve agad sa balanse.', 'fr': 'Le montant sera transféré sous 1 à 3 jours ouvrés après approbation. Il sera réservé dès la demande.', 'tr': 'Tutar, onaydan sonra 1-3 iş gününde banka hesabınıza aktarılır. Talep edildiğinde bakiyenizden rezerve edilir.'},

  // ─── SOS ───
  'noContactsTitle': {'ar': 'لا توجد جهات طوارئ', 'en': 'No emergency contacts', 'ur': 'کوئی ہنگامی رابطہ نہیں', 'hi': 'कोई आपातकालीन संपर्क नहीं', 'bn': 'কোনো জরুরি যোগাযোগ নেই', 'fil': 'Walang emergency contact', 'fr': 'Aucun contact d\'urgence', 'tr': 'Acil durum kişisi yok'},
  'noContactsBody': {'ar': 'يُنصح بإضافة جهات قبل التفعيل.', 'en': 'We recommend adding contacts before activating.', 'ur': 'فعال کرنے سے پہلے رابطے شامل کریں۔', 'hi': 'सक्रिय करने से पहले संपर्क जोड़ें।', 'bn': 'সক্রিয় করার আগে যোগাযোগ যোগ করুন।', 'fil': 'Magdagdag ng contact bago mag-activate.', 'fr': 'Ajoutez des contacts avant d\'activer.', 'tr': 'Etkinleştirmeden önce kişi ekleyin.'},
  'addNow': {'ar': 'إضافة الآن', 'en': 'Add now', 'ur': 'ابھی شامل کریں', 'hi': 'अभी जोड़ें', 'bn': 'এখন যোগ করুন', 'fil': 'Magdagdag na', 'fr': 'Ajouter', 'tr': 'Şimdi ekle'},
  'activateWithout': {'ar': 'تفعيل بدون', 'en': 'Activate anyway', 'ur': 'بہرحال فعال کریں', 'hi': 'फिर भी सक्रिय करें', 'bn': 'তবুও সক্রিয় করুন', 'fil': 'I-activate pa rin', 'fr': 'Activer quand même', 'tr': 'Yine de etkinleştir'},
  'sosActivateConfirm': {'ar': '🚨 تفعيل الطوارئ؟', 'en': '🚨 Activate emergency?', 'ur': '🚨 ہنگامی فعال کریں؟', 'hi': '🚨 आपातकाल सक्रिय करें?', 'bn': '🚨 জরুরি সক্রিয় করবেন?', 'fil': '🚨 I-activate ang emergency?', 'fr': '🚨 Activer l\'urgence ?', 'tr': '🚨 Acil durumu etkinleştir?'},
  'sosActivateBody': {'ar': 'سيُرسَل موقعك ورسالة استغاثة فوراً لكل جهات الطوارئ.', 'en': 'Your location and an alert will be sent instantly to all emergency contacts.', 'ur': 'آپ کا مقام اور الرٹ فوراً تمام رابطوں کو بھیجا جائے گا۔', 'hi': 'आपका स्थान और अलर्ट तुरंत सभी संपर्कों को भेजा जाएगा।', 'bn': 'আপনার অবস্থান ও সতর্কতা সব যোগাযোগে তৎক্ষণাৎ পাঠানো হবে।', 'fil': 'Agad na ipapadala ang lokasyon mo sa lahat ng contact.', 'fr': 'Votre position et une alerte seront envoyées à tous les contacts.', 'tr': 'Konumunuz ve uyarı tüm kişilere anında gönderilir.'},
  'yesActivate': {'ar': 'نعم، فعِّل', 'en': 'Yes, activate', 'ur': 'ہاں، فعال کریں', 'hi': 'हाँ, सक्रिय करें', 'bn': 'হ্যাঁ, সক্রিয় করুন', 'fil': 'Oo, i-activate', 'fr': 'Oui, activer', 'tr': 'Evet, etkinleştir'},
  'sosActiveTitle': {'ar': '🚨 طوارئ نشطة', 'en': '🚨 Emergency active', 'ur': '🚨 ہنگامی فعال', 'hi': '🚨 आपातकाल सक्रिय', 'bn': '🚨 জরুরি সক্রিয়', 'fil': '🚨 Aktibo ang emergency', 'fr': '🚨 Urgence active', 'tr': '🚨 Acil durum aktif'},
  'yesSafe': {'ar': 'نعم، بأمان', 'en': 'Yes, I\'m safe', 'ur': 'ہاں، محفوظ ہوں', 'hi': 'हाँ, सुरक्षित हूँ', 'bn': 'হ্যাঁ, নিরাপদ', 'fil': 'Oo, ligtas ako', 'fr': 'Oui, en sécurité', 'tr': 'Evet, güvendeyim'},
  'dangerContinues': {'ar': 'الخطر مستمر', 'en': 'Still in danger', 'ur': 'خطرہ جاری ہے', 'hi': 'अभी भी खतरा', 'bn': 'এখনও বিপদে', 'fil': 'May panganib pa', 'fr': 'Toujours en danger', 'tr': 'Hâlâ tehlikede'},

  // ─── Add contact ───
  'addContact': {'ar': 'إضافة جهة طوارئ', 'en': 'Add emergency contact', 'ur': 'ہنگامی رابطہ شامل کریں', 'hi': 'आपातकालीन संपर्क जोड़ें', 'bn': 'জরুরি যোগাযোগ যোগ করুন', 'fil': 'Magdagdag ng emergency contact', 'fr': 'Ajouter un contact', 'tr': 'Acil durum kişisi ekle'},
  'contactSmsHint': {'ar': 'سيُرسَل لها SMS تلقائياً عند تفعيل الطوارئ', 'en': 'They\'ll get an automatic SMS when SOS is triggered', 'ur': 'SOS فعال ہونے پر انہیں خودکار SMS جائے گا', 'hi': 'SOS सक्रिय होने पर उन्हें स्वतः SMS मिलेगा', 'bn': 'SOS সক্রিয় হলে স্বয়ংক্রিয় SMS যাবে', 'fil': 'Makakatanggap ng SMS kapag na-trigger ang SOS', 'fr': 'Ils recevront un SMS automatique en cas de SOS', 'tr': 'SOS tetiklendiğinde otomatik SMS alırlar'},
  'name': {'ar': 'الاسم', 'en': 'Name', 'ur': 'نام', 'hi': 'नाम', 'bn': 'নাম', 'fil': 'Pangalan', 'fr': 'Nom', 'tr': 'Ad'},
  'nameExample': {'ar': 'مثال: أبي', 'en': 'e.g. Dad', 'ur': 'مثلاً: ابو', 'hi': 'जैसे: पापा', 'bn': 'যেমন: বাবা', 'fil': 'hal. Tatay', 'fr': 'ex. Papa', 'tr': 'örn. Baba'},
  'phoneNumber': {'ar': 'رقم الهاتف', 'en': 'Phone number', 'ur': 'فون نمبر', 'hi': 'फ़ोन नंबर', 'bn': 'ফোন নম্বর', 'fil': 'Numero ng telepono', 'fr': 'Numéro de téléphone', 'tr': 'Telefon numarası'},
  'e164Hint': {'ar': 'بصيغة دولية كاملة (E.164)', 'en': 'Full international format (E.164)', 'ur': 'مکمل بین الاقوامی فارمیٹ (E.164)', 'hi': 'पूर्ण अंतरराष्ट्रीय प्रारूप (E.164)', 'bn': 'সম্পূর্ণ আন্তর্জাতিক ফরম্যাট (E.164)', 'fil': 'Buong international format (E.164)', 'fr': 'Format international complet (E.164)', 'tr': 'Tam uluslararası biçim (E.164)'},
  'relation': {'ar': 'العلاقة', 'en': 'Relationship', 'ur': 'رشتہ', 'hi': 'रिश्ता', 'bn': 'সম্পর্ক', 'fil': 'Relasyon', 'fr': 'Relation', 'tr': 'İlişki'},
  'autoShareRides': {'ar': 'مشاركة الرحلات تلقائياً', 'en': 'Auto-share rides', 'ur': 'سواری خودکار شیئر کریں', 'hi': 'राइड स्वतः साझा करें', 'bn': 'রাইড স্বয়ংক্রিয় শেয়ার', 'fil': 'Auto-share ng sakay', 'fr': 'Partage auto des courses', 'tr': 'Yolculukları otomatik paylaş'},
  'autoShareSub': {'ar': 'تُشارَك تفاصيل كل رحلة مع هذه الجهة', 'en': 'Every ride is shared with this contact', 'ur': 'ہر سواری اس رابطے سے شیئر ہوگی', 'hi': 'हर राइड इस संपर्क से साझा होगी', 'bn': 'প্রতি রাইড এই যোগাযোগে শেয়ার হবে', 'fil': 'Ibabahagi ang bawat sakay sa contact na ito', 'fr': 'Chaque course est partagée avec ce contact', 'tr': 'Her yolculuk bu kişiyle paylaşılır'},
  'addThisContact': {'ar': 'إضافة الجهة', 'en': 'Add contact', 'ur': 'رابطہ شامل کریں', 'hi': 'संपर्क जोड़ें', 'bn': 'যোগাযোগ যোগ করুন', 'fil': 'Idagdag ang contact', 'fr': 'Ajouter le contact', 'tr': 'Kişiyi ekle'},

  // ─── Onboarding ───
  'completeAllFields': {'ar': 'أكمل جميع الحقول المطلوبة', 'en': 'Complete all required fields', 'ur': 'تمام مطلوبہ خانے مکمل کریں', 'hi': 'सभी आवश्यक फ़ील्ड भरें', 'bn': 'সব প্রয়োজনীয় ঘর পূরণ করুন', 'fil': 'Kumpletuhin ang lahat ng field', 'fr': 'Remplissez tous les champs requis', 'tr': 'Tüm gerekli alanları doldurun'},
  'finishRegistration': {'ar': 'إنهاء التسجيل', 'en': 'Finish registration', 'ur': 'رجسٹریشن مکمل کریں', 'hi': 'पंजीकरण समाप्त करें', 'bn': 'নিবন্ধন শেষ করুন', 'fil': 'Tapusin ang rehistro', 'fr': 'Terminer l\'inscription', 'tr': 'Kaydı tamamla'},
  'continueBtn': {'ar': 'متابعة', 'en': 'Continue', 'ur': 'جاری رکھیں', 'hi': 'जारी रखें', 'bn': 'চালিয়ে যান', 'fil': 'Magpatuloy', 'fr': 'Continuer', 'tr': 'Devam et'},
  'joinAsCaptain': {'ar': 'انضم كقبطان HANCR', 'en': 'Join as a HANCR captain', 'ur': 'HANCR کیپٹن کے طور پر شامل ہوں', 'hi': 'HANCR कैप्टन के रूप में जुड़ें', 'bn': 'HANCR ক্যাপ্টেন হিসেবে যোগ দিন', 'fil': 'Sumali bilang HANCR captain', 'fr': 'Rejoignez en tant que capitaine HANCR', 'tr': 'HANCR kaptanı olarak katılın'},
  'aboutYou': {'ar': 'أخبرنا عن نفسك', 'en': 'Tell us about yourself', 'ur': 'اپنے بارے میں بتائیں', 'hi': 'अपने बारे में बताएं', 'bn': 'নিজের সম্পর্কে বলুন', 'fil': 'Magkwento tungkol sa sarili', 'fr': 'Parlez-nous de vous', 'tr': 'Kendinizden bahsedin'},
  'carDetailsStep': {'ar': 'تفاصيل السيارة', 'en': 'Car details', 'ur': 'گاڑی کی تفصیلات', 'hi': 'कार विवरण', 'bn': 'গাড়ির বিবরণ', 'fil': 'Detalye ng kotse', 'fr': 'Détails du véhicule', 'tr': 'Araç bilgileri'},
  'licensePlateStep': {'ar': 'الرخصة والترقيم', 'en': 'License & plate', 'ur': 'لائسنس اور نمبر پلیٹ', 'hi': 'लाइसेंस और प्लेट', 'bn': 'লাইসেন্স ও প্লেট', 'fil': 'Lisensya at plaka', 'fr': 'Permis et plaque', 'tr': 'Ehliyet ve plaka'},
  'requiredDocs': {'ar': 'الوثائق المطلوبة', 'en': 'Required documents', 'ur': 'مطلوبہ دستاویزات', 'hi': 'आवश्यक दस्तावेज़', 'bn': 'প্রয়োজনীয় নথি', 'fil': 'Mga kailangang dokumento', 'fr': 'Documents requis', 'tr': 'Gerekli belgeler'},
  'personalInfo': {'ar': 'المعلومات الشخصية', 'en': 'Personal information', 'ur': 'ذاتی معلومات', 'hi': 'व्यक्तिगत जानकारी', 'bn': 'ব্যক্তিগত তথ্য', 'fil': 'Personal na impormasyon', 'fr': 'Informations personnelles', 'tr': 'Kişisel bilgiler'},
  'firstName': {'ar': 'الاسم الأول', 'en': 'First name', 'ur': 'پہلا نام', 'hi': 'पहला नाम', 'bn': 'নামের প্রথম অংশ', 'fil': 'Pangalan', 'fr': 'Prénom', 'tr': 'Ad'},
  'lastName': {'ar': 'اسم العائلة', 'en': 'Last name', 'ur': 'خاندانی نام', 'hi': 'उपनाम', 'bn': 'পদবি', 'fil': 'Apelyido', 'fr': 'Nom', 'tr': 'Soyad'},
  'dataProtected': {'ar': 'بياناتك محمية ولن تُشارَك مع طرف ثالث', 'en': 'Your data is protected and never shared with third parties', 'ur': 'آپ کا ڈیٹا محفوظ ہے اور کسی تیسرے فریق سے شیئر نہیں ہوگا', 'hi': 'आपका डेटा सुरक्षित है और किसी तीसरे पक्ष से साझा नहीं होगा', 'bn': 'আপনার ডেটা সুরক্ষিত, তৃতীয় পক্ষে শেয়ার হবে না', 'fil': 'Protektado ang data mo, hindi ibinabahagi sa iba', 'fr': 'Vos données sont protégées et jamais partagées', 'tr': 'Verileriniz korunur, üçüncü taraflarla paylaşılmaz'},
  'carDataSection': {'ar': 'بيانات السيارة', 'en': 'Car data', 'ur': 'گاڑی کا ڈیٹا', 'hi': 'कार डेटा', 'bn': 'গাড়ির তথ্য', 'fil': 'Data ng kotse', 'fr': 'Données du véhicule', 'tr': 'Araç verileri'},
  'brandHint': {'ar': 'الماركة (Toyota، Honda...)', 'en': 'Brand (Toyota, Honda...)', 'ur': 'برانڈ (Toyota، Honda...)', 'hi': 'ब्रांड (Toyota, Honda...)', 'bn': 'ব্র্যান্ড (Toyota, Honda...)', 'fil': 'Brand (Toyota, Honda...)', 'fr': 'Marque (Toyota, Honda...)', 'tr': 'Marka (Toyota, Honda...)'},
  'modelHint': {'ar': 'الموديل (Camry، Accord...)', 'en': 'Model (Camry, Accord...)', 'ur': 'ماڈل (Camry، Accord...)', 'hi': 'मॉडल (Camry, Accord...)', 'bn': 'মডেল (Camry, Accord...)', 'fil': 'Model (Camry, Accord...)', 'fr': 'Modèle (Camry, Accord...)', 'tr': 'Model (Camry, Accord...)'},
  'manufactureYear': {'ar': 'سنة الصنع', 'en': 'Manufacture year', 'ur': 'سنِ تیاری', 'hi': 'निर्माण वर्ष', 'bn': 'উৎপাদন বছর', 'fil': 'Taon ng gawa', 'fr': 'Année de fabrication', 'tr': 'Üretim yılı'},
  'carColor': {'ar': 'لون السيارة', 'en': 'Car color', 'ur': 'گاڑی کا رنگ', 'hi': 'कार का रंग', 'bn': 'গাড়ির রং', 'fil': 'Kulay ng kotse', 'fr': 'Couleur du véhicule', 'tr': 'Araç rengi'},
  'plateLicenseSection': {'ar': 'الترقيم والرخصة', 'en': 'Plate & license', 'ur': 'نمبر پلیٹ اور لائسنس', 'hi': 'प्लेट और लाइसेंस', 'bn': 'প্লেট ও লাইসেন্স', 'fil': 'Plaka at lisensya', 'fr': 'Plaque et permis', 'tr': 'Plaka ve ehliyet'},
  'plateHint': {'ar': 'رقم اللوحة (ABC 1234)', 'en': 'Plate number (ABC 1234)', 'ur': 'نمبر پلیٹ (ABC 1234)', 'hi': 'प्लेट नंबर (ABC 1234)', 'bn': 'প্লেট নম্বর (ABC 1234)', 'fil': 'Plate number (ABC 1234)', 'fr': 'Numéro de plaque (ABC 1234)', 'tr': 'Plaka numarası (ABC 1234)'},
  'licenseNumber': {'ar': 'رقم رخصة القيادة', 'en': 'Driving license number', 'ur': 'ڈرائیونگ لائسنس نمبر', 'hi': 'ड्राइविंग लाइसेंस नंबर', 'bn': 'ড্রাইভিং লাইসেন্স নম্বর', 'fil': 'Numero ng lisensya', 'fr': 'Numéro de permis', 'tr': 'Ehliyet numarası'},
  'verifyAccuracy': {'ar': 'تأكَّد من إدخال البيانات بدقة — ستُستخدم للتحقق من هويتك', 'en': 'Make sure the data is accurate — it\'s used to verify your identity', 'ur': 'ڈیٹا درست درج کریں — یہ آپ کی شناخت کی تصدیق کے لیے ہے', 'hi': 'डेटा सही दर्ज करें — यह पहचान सत्यापन के लिए है', 'bn': 'সঠিক তথ্য দিন — পরিচয় যাচাইয়ে ব্যবহৃত হবে', 'fil': 'Siguraduhing tama ang data — gagamitin para i-verify ang pagkakakilanlan', 'fr': 'Vérifiez l\'exactitude — utilisé pour vérifier votre identité', 'tr': 'Verilerin doğru olduğundan emin olun — kimlik doğrulama için kullanılır'},
  'colWhite': {'ar': 'أبيض', 'en': 'White', 'ur': 'سفید', 'hi': 'सफ़ेद', 'bn': 'সাদা', 'fil': 'Puti', 'fr': 'Blanc', 'tr': 'Beyaz'},
  'colBlack': {'ar': 'أسود', 'en': 'Black', 'ur': 'سیاہ', 'hi': 'काला', 'bn': 'কালো', 'fil': 'Itim', 'fr': 'Noir', 'tr': 'Siyah'},
  'colSilver': {'ar': 'فضي', 'en': 'Silver', 'ur': 'چاندی', 'hi': 'सिल्वर', 'bn': 'রূপালি', 'fil': 'Pilak', 'fr': 'Argent', 'tr': 'Gümüş'},
  'colGray': {'ar': 'رمادي', 'en': 'Gray', 'ur': 'سرمئی', 'hi': 'ग्रे', 'bn': 'ধূসর', 'fil': 'Abo', 'fr': 'Gris', 'tr': 'Gri'},
  'colRed': {'ar': 'أحمر', 'en': 'Red', 'ur': 'سرخ', 'hi': 'लाल', 'bn': 'লাল', 'fil': 'Pula', 'fr': 'Rouge', 'tr': 'Kırmızı'},
  'colBlue': {'ar': 'أزرق', 'en': 'Blue', 'ur': 'نیلا', 'hi': 'नीला', 'bn': 'নীল', 'fil': 'Asul', 'fr': 'Bleu', 'tr': 'Mavi'},
  'colBrown': {'ar': 'بني', 'en': 'Brown', 'ur': 'بھورا', 'hi': 'भूरा', 'bn': 'বাদামি', 'fil': 'Kayumanggi', 'fr': 'Marron', 'tr': 'Kahverengi'},
  'colGold': {'ar': 'ذهبي', 'en': 'Gold', 'ur': 'سنہری', 'hi': 'सुनहरा', 'bn': 'সোনালি', 'fil': 'Ginto', 'fr': 'Or', 'tr': 'Altın'},

  // ─── Settings / language ───
  'language': {'ar': 'اللغة', 'en': 'Language', 'ur': 'زبان', 'hi': 'भाषा', 'bn': 'ভাষা', 'fil': 'Wika', 'fr': 'Langue', 'tr': 'Dil'},
  'selectLanguage': {'ar': 'اختر اللغة', 'en': 'Select language', 'ur': 'زبان منتخب کریں', 'hi': 'भाषा चुनें', 'bn': 'ভাষা নির্বাচন করুন', 'fil': 'Pumili ng wika', 'fr': 'Choisir la langue', 'tr': 'Dil seçin'},
  'about': {'ar': 'حول', 'en': 'About', 'ur': 'بارے میں', 'hi': 'के बारे में', 'bn': 'সম্পর্কে', 'fil': 'Tungkol', 'fr': 'À propos', 'tr': 'Hakkında'},
  'version': {'ar': 'الإصدار', 'en': 'Version', 'ur': 'ورژن', 'hi': 'संस्करण', 'bn': 'সংস্করণ', 'fil': 'Bersyon', 'fr': 'Version', 'tr': 'Sürüm'},
};
