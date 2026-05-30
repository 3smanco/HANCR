import 'dart:ui';
import 'package:flutter/material.dart';
import '../services/storage_service.dart';

/// نظام تعدد اللغات لـ HANCR.
///
/// - 8 لغات: العربية، الإنجليزية، الأردية، الهندية، البنغالية، الفلبينية، الفرنسية، التركية.
/// - يبدأ بلغة الجهاز إن كانت مدعومة، وإلا الإنجليزية.
/// - يُحفَظ اختيار المستخدم ويُطبَّق فوراً (مع دعم RTL تلقائياً).
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

/// متحكّم اللغة العالمي — ValueNotifier يُعيد بناء MaterialApp عند التغيير.
class LocaleController extends ValueNotifier<Locale> {
  LocaleController._() : super(const Locale('ar'));
  static final LocaleController instance = LocaleController._();

  /// يُحمَّل عند الإقلاع: اللغة المحفوظة أو لغة الجهاز أو الإنجليزية.
  Future<void> load() async {
    final saved = await StorageService.getLanguage();
    if (saved != null && _isSupported(saved)) {
      value = Locale(saved);
      return;
    }
    // لغة الجهاز
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

/// دالة الترجمة — تُستخدم في كل مكان: tr('key').
String tr(String key) {
  final code = LocaleController.instance.value.languageCode;
  return _strings[code]?[key] ?? _strings['en']?[key] ?? key;
}

// ════════════════════════════════════════════════════════════════
// جداول الترجمة (8 لغات)
// ════════════════════════════════════════════════════════════════
const Map<String, Map<String, String>> _strings = {
  // ─────────────────────────── العربية ───────────────────────────
  'ar': {
    'nav_home': 'الرئيسية', 'nav_services': 'الخدمات',
    'nav_activity': 'النشاط', 'nav_account': 'حسابي',
    'confirm': 'تأكيد', 'cancel': 'إلغاء', 'save': 'حفظ', 'retry': 'إعادة',
    'ok': 'حسناً', 'comingSoon': 'قريباً',
    'greeting': 'مرحباً بك 👋', 'whereToGo': 'إلى أين تريد الذهاب؟',
    'whereTo': 'إلى أين؟', 'now': 'الآن', 'homePlace': 'المنزل',
    'suggestions': 'اقتراحات', 'viewAll': 'عرض الكل',
    'ride': 'رحلة', 'bike': 'دراجة', 'parcel': 'طرد', 'rental': 'تأجير',
    'otherWays': 'طرق أخرى للتنقل', 'luxury': 'سفر فاخر',
    'luxurySub': 'سيارات فخمة عالية الفئة', 'electric': 'كهربائية',
    'electricSub': 'دلِّل نفسك بسيارة EV',
    'scheduleTitle': 'احجز رحلة\nبجدولك', 'scheduleSub': 'حدِّد موعداً مسبقاً لرحلتك',
    'offers': 'العروض والتخفيضات', 'notifications': 'الإشعارات',
    'confirmDestination': 'تأكيد الوجهة', 'moveMapHint': 'حرِّك الخريطة لتحديد وجهتك',
    'myLocation': 'موقعي الحالي', 'chooseRideType': 'اختر فئة الرحلة',
    'calculatingRoute': 'جارٍ حساب المسار...', 'quietRide': 'رحلة هادئة',
    'noMusic': 'بدون موسيقى', 'requestNow': 'اطلب الآن', 'startsFrom': 'تبدأ من',
    'settings': 'الإعدادات', 'language': 'اللغة', 'about': 'حول',
    'version': 'الإصدار', 'rideNotifs': 'إشعارات الرحلات', 'promoNotifs': 'عروض وتخفيضات',
    'help': 'مساعدة', 'wallet': 'محفظة', 'editProfile': 'تعديل الملف الشخصي',
    'inviteFriends': 'ادعُ أصدقاءك', 'logout': 'تسجيل الخروج', 'hancrMiles': 'HANCR Miles',
    'selectLanguage': 'اختر اللغة', 'noRides': 'لا توجد رحلات بعد',
  },
  // ─────────────────────────── English ───────────────────────────
  'en': {
    'nav_home': 'Home', 'nav_services': 'Services',
    'nav_activity': 'Activity', 'nav_account': 'Account',
    'confirm': 'Confirm', 'cancel': 'Cancel', 'save': 'Save', 'retry': 'Retry',
    'ok': 'OK', 'comingSoon': 'Coming soon',
    'greeting': 'Welcome 👋', 'whereToGo': 'Where do you want to go?',
    'whereTo': 'Where to?', 'now': 'Now', 'homePlace': 'Home',
    'suggestions': 'Suggestions', 'viewAll': 'View all',
    'ride': 'Ride', 'bike': 'Bike', 'parcel': 'Parcel', 'rental': 'Rental',
    'otherWays': 'More ways to move', 'luxury': 'Luxury travel',
    'luxurySub': 'High-end premium cars', 'electric': 'Electric',
    'electricSub': 'Treat yourself to an EV',
    'scheduleTitle': 'Schedule\na ride', 'scheduleSub': 'Plan your ride in advance',
    'offers': 'Offers & discounts', 'notifications': 'Notifications',
    'confirmDestination': 'Confirm destination', 'moveMapHint': 'Move the map to set your destination',
    'myLocation': 'My current location', 'chooseRideType': 'Choose ride type',
    'calculatingRoute': 'Calculating route...', 'quietRide': 'Quiet ride',
    'noMusic': 'No music', 'requestNow': 'Request now', 'startsFrom': 'From',
    'settings': 'Settings', 'language': 'Language', 'about': 'About',
    'version': 'Version', 'rideNotifs': 'Ride notifications', 'promoNotifs': 'Offers & promos',
    'help': 'Help', 'wallet': 'Wallet', 'editProfile': 'Edit profile',
    'inviteFriends': 'Invite friends', 'logout': 'Log out', 'hancrMiles': 'HANCR Miles',
    'selectLanguage': 'Select language', 'noRides': 'No rides yet',
  },
  // ─────────────────────────── اردو (Urdu) ───────────────────────────
  'ur': {
    'nav_home': 'ہوم', 'nav_services': 'خدمات',
    'nav_activity': 'سرگرمی', 'nav_account': 'اکاؤنٹ',
    'confirm': 'تصدیق کریں', 'cancel': 'منسوخ', 'save': 'محفوظ کریں', 'retry': 'دوبارہ',
    'ok': 'ٹھیک ہے', 'comingSoon': 'جلد آ رہا ہے',
    'greeting': 'خوش آمدید 👋', 'whereToGo': 'آپ کہاں جانا چاہتے ہیں؟',
    'whereTo': 'کہاں جانا ہے؟', 'now': 'ابھی', 'homePlace': 'گھر',
    'suggestions': 'تجاویز', 'viewAll': 'سب دیکھیں',
    'ride': 'سواری', 'bike': 'بائیک', 'parcel': 'پارسل', 'rental': 'کرایہ',
    'otherWays': 'سفر کے مزید طریقے', 'luxury': 'پُرتعیش سفر',
    'luxurySub': 'اعلیٰ درجے کی گاڑیاں', 'electric': 'الیکٹرک',
    'electricSub': 'EV کا لطف اٹھائیں',
    'scheduleTitle': 'سواری شیڈول\nکریں', 'scheduleSub': 'اپنی سواری پہلے سے طے کریں',
    'offers': 'آفرز اور رعایتیں', 'notifications': 'اطلاعات',
    'confirmDestination': 'منزل کی تصدیق', 'moveMapHint': 'منزل منتخب کرنے کے لیے نقشہ حرکت دیں',
    'myLocation': 'میرا موجودہ مقام', 'chooseRideType': 'سواری کی قسم منتخب کریں',
    'calculatingRoute': 'راستہ شمار ہو رہا ہے...', 'quietRide': 'پُرسکون سواری',
    'noMusic': 'موسیقی کے بغیر', 'requestNow': 'ابھی منگوائیں', 'startsFrom': 'شروع',
    'settings': 'ترتیبات', 'language': 'زبان', 'about': 'متعلق',
    'version': 'ورژن', 'rideNotifs': 'سواری کی اطلاعات', 'promoNotifs': 'آفرز اور پرومو',
    'help': 'مدد', 'wallet': 'والیٹ', 'editProfile': 'پروفائل میں ترمیم',
    'inviteFriends': 'دوستوں کو مدعو کریں', 'logout': 'لاگ آؤٹ', 'hancrMiles': 'HANCR Miles',
    'selectLanguage': 'زبان منتخب کریں', 'noRides': 'ابھی کوئی سواری نہیں',
  },
  // ─────────────────────────── हिन्दी (Hindi) ───────────────────────────
  'hi': {
    'nav_home': 'होम', 'nav_services': 'सेवाएं',
    'nav_activity': 'गतिविधि', 'nav_account': 'खाता',
    'confirm': 'पुष्टि करें', 'cancel': 'रद्द करें', 'save': 'सहेजें', 'retry': 'पुनः प्रयास',
    'ok': 'ठीक है', 'comingSoon': 'जल्द आ रहा है',
    'greeting': 'स्वागत है 👋', 'whereToGo': 'आप कहाँ जाना चाहते हैं?',
    'whereTo': 'कहाँ जाना है?', 'now': 'अभी', 'homePlace': 'घर',
    'suggestions': 'सुझाव', 'viewAll': 'सभी देखें',
    'ride': 'राइड', 'bike': 'बाइक', 'parcel': 'पार्सल', 'rental': 'किराया',
    'otherWays': 'यात्रा के अन्य तरीके', 'luxury': 'लक्ज़री यात्रा',
    'luxurySub': 'उच्च श्रेणी की कारें', 'electric': 'इलेक्ट्रिक',
    'electricSub': 'EV का आनंद लें',
    'scheduleTitle': 'राइड\nशेड्यूल करें', 'scheduleSub': 'अपनी राइड पहले से तय करें',
    'offers': 'ऑफ़र और छूट', 'notifications': 'सूचनाएं',
    'confirmDestination': 'गंतव्य की पुष्टि करें', 'moveMapHint': 'गंतव्य चुनने के लिए मानचित्र हिलाएं',
    'myLocation': 'मेरा वर्तमान स्थान', 'chooseRideType': 'राइड प्रकार चुनें',
    'calculatingRoute': 'मार्ग की गणना हो रही है...', 'quietRide': 'शांत राइड',
    'noMusic': 'बिना संगीत', 'requestNow': 'अभी बुक करें', 'startsFrom': 'से',
    'settings': 'सेटिंग्स', 'language': 'भाषा', 'about': 'के बारे में',
    'version': 'संस्करण', 'rideNotifs': 'राइड सूचनाएं', 'promoNotifs': 'ऑफ़र और प्रोमो',
    'help': 'मदद', 'wallet': 'वॉलेट', 'editProfile': 'प्रोफ़ाइल संपादित करें',
    'inviteFriends': 'दोस्तों को आमंत्रित करें', 'logout': 'लॉग आउट', 'hancrMiles': 'HANCR Miles',
    'selectLanguage': 'भाषा चुनें', 'noRides': 'अभी तक कोई राइड नहीं',
  },
  // ─────────────────────────── বাংলা (Bengali) ───────────────────────────
  'bn': {
    'nav_home': 'হোম', 'nav_services': 'সেবা',
    'nav_activity': 'কার্যকলাপ', 'nav_account': 'অ্যাকাউন্ট',
    'confirm': 'নিশ্চিত করুন', 'cancel': 'বাতিল', 'save': 'সংরক্ষণ', 'retry': 'আবার চেষ্টা',
    'ok': 'ঠিক আছে', 'comingSoon': 'শীঘ্রই আসছে',
    'greeting': 'স্বাগতম 👋', 'whereToGo': 'আপনি কোথায় যেতে চান?',
    'whereTo': 'কোথায় যাবেন?', 'now': 'এখন', 'homePlace': 'বাড়ি',
    'suggestions': 'পরামর্শ', 'viewAll': 'সব দেখুন',
    'ride': 'রাইড', 'bike': 'বাইক', 'parcel': 'পার্সেল', 'rental': 'ভাড়া',
    'otherWays': 'চলাচলের আরও উপায়', 'luxury': 'বিলাসবহুল ভ্রমণ',
    'luxurySub': 'উচ্চমানের গাড়ি', 'electric': 'বৈদ্যুতিক',
    'electricSub': 'একটি EV উপভোগ করুন',
    'scheduleTitle': 'রাইড\nশিডিউল করুন', 'scheduleSub': 'আগে থেকে আপনার রাইড পরিকল্পনা করুন',
    'offers': 'অফার ও ছাড়', 'notifications': 'বিজ্ঞপ্তি',
    'confirmDestination': 'গন্তব্য নিশ্চিত করুন', 'moveMapHint': 'গন্তব্য নির্ধারণে মানচিত্র সরান',
    'myLocation': 'আমার বর্তমান অবস্থান', 'chooseRideType': 'রাইডের ধরন বাছুন',
    'calculatingRoute': 'রুট গণনা করা হচ্ছে...', 'quietRide': 'নিরিবিলি রাইড',
    'noMusic': 'গান ছাড়া', 'requestNow': 'এখন অনুরোধ করুন', 'startsFrom': 'থেকে',
    'settings': 'সেটিংস', 'language': 'ভাষা', 'about': 'সম্পর্কে',
    'version': 'সংস্করণ', 'rideNotifs': 'রাইড বিজ্ঞপ্তি', 'promoNotifs': 'অফার ও প্রোমো',
    'help': 'সহায়তা', 'wallet': 'ওয়ালেট', 'editProfile': 'প্রোফাইল সম্পাদনা',
    'inviteFriends': 'বন্ধুদের আমন্ত্রণ', 'logout': 'লগ আউট', 'hancrMiles': 'HANCR Miles',
    'selectLanguage': 'ভাষা নির্বাচন করুন', 'noRides': 'এখনও কোনো রাইড নেই',
  },
  // ─────────────────────────── Filipino ───────────────────────────
  'fil': {
    'nav_home': 'Home', 'nav_services': 'Serbisyo',
    'nav_activity': 'Aktibidad', 'nav_account': 'Account',
    'confirm': 'Kumpirmahin', 'cancel': 'Kanselahin', 'save': 'I-save', 'retry': 'Subukan ulit',
    'ok': 'OK', 'comingSoon': 'Malapit na',
    'greeting': 'Maligayang pagdating 👋', 'whereToGo': 'Saan mo gustong pumunta?',
    'whereTo': 'Saan?', 'now': 'Ngayon', 'homePlace': 'Bahay',
    'suggestions': 'Mga mungkahi', 'viewAll': 'Tingnan lahat',
    'ride': 'Sakay', 'bike': 'Bisikleta', 'parcel': 'Parcel', 'rental': 'Rental',
    'otherWays': 'Iba pang paraan', 'luxury': 'Luxury na biyahe',
    'luxurySub': 'Mga high-end na sasakyan', 'electric': 'Electric',
    'electricSub': 'Subukan ang EV',
    'scheduleTitle': 'Mag-iskedyul\nng sakay', 'scheduleSub': 'Planuhin ang sakay nang maaga',
    'offers': 'Mga alok at diskwento', 'notifications': 'Mga abiso',
    'confirmDestination': 'Kumpirmahin ang destinasyon', 'moveMapHint': 'Galawin ang mapa para itakda ang destinasyon',
    'myLocation': 'Aking kasalukuyang lokasyon', 'chooseRideType': 'Pumili ng uri ng sakay',
    'calculatingRoute': 'Kinukuwenta ang ruta...', 'quietRide': 'Tahimik na sakay',
    'noMusic': 'Walang musika', 'requestNow': 'Mag-request', 'startsFrom': 'Mula',
    'settings': 'Mga setting', 'language': 'Wika', 'about': 'Tungkol',
    'version': 'Bersyon', 'rideNotifs': 'Mga abiso ng sakay', 'promoNotifs': 'Mga alok at promo',
    'help': 'Tulong', 'wallet': 'Wallet', 'editProfile': 'I-edit ang profile',
    'inviteFriends': 'Mag-imbita ng kaibigan', 'logout': 'Mag-logout', 'hancrMiles': 'HANCR Miles',
    'selectLanguage': 'Pumili ng wika', 'noRides': 'Wala pang sakay',
  },
  // ─────────────────────────── Français ───────────────────────────
  'fr': {
    'nav_home': 'Accueil', 'nav_services': 'Services',
    'nav_activity': 'Activité', 'nav_account': 'Compte',
    'confirm': 'Confirmer', 'cancel': 'Annuler', 'save': 'Enregistrer', 'retry': 'Réessayer',
    'ok': 'OK', 'comingSoon': 'Bientôt disponible',
    'greeting': 'Bienvenue 👋', 'whereToGo': 'Où voulez-vous aller ?',
    'whereTo': 'Où aller ?', 'now': 'Maintenant', 'homePlace': 'Maison',
    'suggestions': 'Suggestions', 'viewAll': 'Voir tout',
    'ride': 'Course', 'bike': 'Vélo', 'parcel': 'Colis', 'rental': 'Location',
    'otherWays': 'Autres moyens', 'luxury': 'Voyage de luxe',
    'luxurySub': 'Voitures haut de gamme', 'electric': 'Électrique',
    'electricSub': 'Offrez-vous un VE',
    'scheduleTitle': 'Planifier\nune course', 'scheduleSub': 'Planifiez votre course à l\'avance',
    'offers': 'Offres et réductions', 'notifications': 'Notifications',
    'confirmDestination': 'Confirmer la destination', 'moveMapHint': 'Déplacez la carte pour définir la destination',
    'myLocation': 'Ma position actuelle', 'chooseRideType': 'Choisir le type de course',
    'calculatingRoute': 'Calcul de l\'itinéraire...', 'quietRide': 'Course silencieuse',
    'noMusic': 'Sans musique', 'requestNow': 'Commander', 'startsFrom': 'À partir de',
    'settings': 'Paramètres', 'language': 'Langue', 'about': 'À propos',
    'version': 'Version', 'rideNotifs': 'Notifications de course', 'promoNotifs': 'Offres et promos',
    'help': 'Aide', 'wallet': 'Portefeuille', 'editProfile': 'Modifier le profil',
    'inviteFriends': 'Inviter des amis', 'logout': 'Déconnexion', 'hancrMiles': 'HANCR Miles',
    'selectLanguage': 'Choisir la langue', 'noRides': 'Pas encore de courses',
  },
  // ─────────────────────────── Türkçe ───────────────────────────
  'tr': {
    'nav_home': 'Ana Sayfa', 'nav_services': 'Hizmetler',
    'nav_activity': 'Etkinlik', 'nav_account': 'Hesap',
    'confirm': 'Onayla', 'cancel': 'İptal', 'save': 'Kaydet', 'retry': 'Tekrar dene',
    'ok': 'Tamam', 'comingSoon': 'Yakında',
    'greeting': 'Hoş geldiniz 👋', 'whereToGo': 'Nereye gitmek istiyorsunuz?',
    'whereTo': 'Nereye?', 'now': 'Şimdi', 'homePlace': 'Ev',
    'suggestions': 'Öneriler', 'viewAll': 'Tümünü gör',
    'ride': 'Yolculuk', 'bike': 'Bisiklet', 'parcel': 'Paket', 'rental': 'Kiralama',
    'otherWays': 'Diğer ulaşım yolları', 'luxury': 'Lüks yolculuk',
    'luxurySub': 'Üst sınıf araçlar', 'electric': 'Elektrikli',
    'electricSub': 'Kendinize bir EV ısmarlayın',
    'scheduleTitle': 'Yolculuk\nplanla', 'scheduleSub': 'Yolculuğunuzu önceden planlayın',
    'offers': 'Teklifler ve indirimler', 'notifications': 'Bildirimler',
    'confirmDestination': 'Varış noktasını onayla', 'moveMapHint': 'Varış noktasını seçmek için haritayı kaydırın',
    'myLocation': 'Mevcut konumum', 'chooseRideType': 'Yolculuk türünü seçin',
    'calculatingRoute': 'Rota hesaplanıyor...', 'quietRide': 'Sessiz yolculuk',
    'noMusic': 'Müziksiz', 'requestNow': 'Şimdi iste', 'startsFrom': 'Başlangıç',
    'settings': 'Ayarlar', 'language': 'Dil', 'about': 'Hakkında',
    'version': 'Sürüm', 'rideNotifs': 'Yolculuk bildirimleri', 'promoNotifs': 'Teklifler ve promosyonlar',
    'help': 'Yardım', 'wallet': 'Cüzdan', 'editProfile': 'Profili düzenle',
    'inviteFriends': 'Arkadaş davet et', 'logout': 'Çıkış yap', 'hancrMiles': 'HANCR Miles',
    'selectLanguage': 'Dil seçin', 'noRides': 'Henüz yolculuk yok',
  },
};
