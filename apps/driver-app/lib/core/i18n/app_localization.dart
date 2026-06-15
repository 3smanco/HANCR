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
  // ─── Phase H — Service tags (incoming order) ───
  'tag_vip': {'ar': 'VIP', 'en': 'VIP', 'ur': 'VIP', 'hi': 'VIP', 'bn': 'VIP', 'fil': 'VIP', 'fr': 'VIP', 'tr': 'VIP'},
  'tag_night': {'ar': 'وضع الليل', 'en': 'Night', 'ur': 'رات', 'hi': 'रात', 'bn': 'রাত', 'fil': 'Gabi', 'fr': 'Nuit', 'tr': 'Gece'},
  'tag_family': {'ar': 'عائلة', 'en': 'Family', 'ur': 'فیملی', 'hi': 'परिवार', 'bn': 'পরিবার', 'fil': 'Pamilya', 'fr': 'Famille', 'tr': 'Aile'},
  'tag_school': {'ar': 'مدرسة', 'en': 'School', 'ur': 'اسکول', 'hi': 'स्कूल', 'bn': 'স্কুল', 'fil': 'Paaralan', 'fr': 'École', 'tr': 'Okul'},
  'tag_hourly': {'ar': 'بالساعة', 'en': 'Hourly', 'ur': 'گھنٹے میں', 'hi': 'घंटे से', 'bn': 'ঘণ্টা ভিত্তিক', 'fil': 'Per oras', 'fr': 'Horaire', 'tr': 'Saatlik'},
  'tag_grocery': {'ar': 'بقالة', 'en': 'Grocery', 'ur': 'گروسری', 'hi': 'किराना', 'bn': 'মুদি', 'fil': 'Grocery', 'fr': 'Courses', 'tr': 'Market'},
  'tag_paid_bundle': {'ar': 'مدفوع · حزمة', 'en': 'Paid · bundle', 'ur': 'ادا شدہ · پیکیج', 'hi': 'भुगतान · बंडल', 'bn': 'পরিশোধিত · বান্ডল', 'fil': 'Bayad · package', 'fr': 'Payé · forfait', 'tr': 'Ödenmiş · paket'},
  'tag_paid_company': {'ar': 'مدفوع · شركة', 'en': 'Paid · company', 'ur': 'ادا شدہ · کمپنی', 'hi': 'भुगतान · कंपनी', 'bn': 'পরিশোধিত · কোম্পানি', 'fil': 'Bayad · kumpanya', 'fr': 'Payé · entreprise', 'tr': 'Ödenmiş · şirket'},
  'view_shopping_list': {'ar': 'عرض قائمة المشتريات', 'en': 'View shopping list', 'ur': 'خریداری کی فہرست دیکھیں', 'hi': 'खरीदारी सूची देखें', 'bn': 'কেনাকাটার তালিকা দেখুন', 'fil': 'Tingnan ang listahan', 'fr': 'Voir la liste de courses', 'tr': 'Alışveriş listesini gör'},
  'shopping_list_title': {'ar': 'قائمة المشتريات', 'en': 'Shopping list', 'ur': 'خریداری کی فہرست', 'hi': 'खरीदारी सूची', 'bn': 'কেনাকাটার তালিকা', 'fil': 'Listahan ng pamimili', 'fr': 'Liste de courses', 'tr': 'Alışveriş listesi'},
  'shopping_budget_label': {'ar': 'الميزانية', 'en': 'Budget', 'ur': 'بجٹ', 'hi': 'बजट', 'bn': 'বাজেট', 'fil': 'Budget', 'fr': 'Budget', 'tr': 'Bütçe'},
  'hourly_remaining': {'ar': 'متبقي من الحجز', 'en': 'Remaining from booking', 'ur': 'بکنگ سے باقی', 'hi': 'बुकिंग से बचा', 'bn': 'বুকিং থেকে অবশিষ্ট', 'fil': 'Natitira sa booking', 'fr': 'Restant de la réservation', 'tr': 'Rezervasyondan kalan'},
  'prepaid_ride': {'ar': 'هذا الطلب مدفوع مسبقاً', 'en': 'This ride is prepaid', 'ur': 'یہ سواری پیشگی ادا شدہ ہے', 'hi': 'यह राइड पूर्व भुगतान', 'bn': 'এই রাইডটি পূর্ব-পরিশোধিত', 'fil': 'Naprepaid na ang sakay na ito', 'fr': 'Ce trajet est prépayé', 'tr': 'Bu yolculuk önceden ödendi'},

  // ─── H3 — Driver profile (gender + approvals) ───
  'gender_label': {'ar': 'الجنس', 'en': 'Gender', 'ur': 'جنس', 'hi': 'लिंग', 'bn': 'লিঙ্গ', 'fil': 'Kasarian', 'fr': 'Genre', 'tr': 'Cinsiyet'},
  'gender_male': {'ar': 'ذكر', 'en': 'Male', 'ur': 'مرد', 'hi': 'पुरुष', 'bn': 'পুরুষ', 'fil': 'Lalaki', 'fr': 'Homme', 'tr': 'Erkek'},
  'gender_female': {'ar': 'أنثى', 'en': 'Female', 'ur': 'عورت', 'hi': 'महिला', 'bn': 'মহিলা', 'fil': 'Babae', 'fr': 'Femme', 'tr': 'Kadın'},
  'verified_kids': {'ar': 'معتمد لرحلات المدارس', 'en': 'Approved for school rides', 'ur': 'اسکول سواریوں کے لیے منظور', 'hi': 'स्कूल राइड के लिए स्वीकृत', 'bn': 'স্কুল রাইডের জন্য অনুমোদিত', 'fil': 'Aprubado para sa school rides', 'fr': 'Approuvé pour trajets scolaires', 'tr': 'Okul yolculukları için onaylı'},
  'verified_night': {'ar': 'معتمد للعمل الليلي', 'en': 'Approved for night shifts', 'ur': 'رات کی شفٹ کے لیے منظور', 'hi': 'नाइट शिफ्ट के लिए स्वीकृत', 'bn': 'রাতের শিফটের জন্য অনুমোদিত', 'fil': 'Aprubado para sa night shift', 'fr': 'Approuvé pour les nuits', 'tr': 'Gece vardiyaları için onaylı'},
  'saved': {'ar': 'تم الحفظ', 'en': 'Saved', 'ur': 'محفوظ ہو گیا', 'hi': 'सहेजा गया', 'bn': 'সংরক্ষিত', 'fil': 'Na-save', 'fr': 'Enregistré', 'tr': 'Kaydedildi'},

  // ─── I1 — Driver documents ───
  'myDocuments': {'ar': 'وثائقي', 'en': 'My documents', 'ur': 'میرے دستاویزات', 'hi': 'मेरे दस्तावेज़', 'bn': 'আমার নথিপত্র', 'fil': 'Aking mga dokumento', 'fr': 'Mes documents', 'tr': 'Belgelerim'},
  'documentsHint': {'ar': 'ارفع هذه الوثائق لاكتمال الاعتماد ولتفعيل العمل', 'en': 'Upload these documents to complete approval and start working', 'ur': 'منظوری مکمل کرنے اور کام شروع کرنے کے لیے یہ دستاویزات اپلوڈ کریں', 'hi': 'अनुमोदन के लिए ये दस्तावेज़ अपलोड करें', 'bn': 'অনুমোদনের জন্য এই নথিগুলি আপলোড করুন', 'fil': 'I-upload upang makapagsimula', 'fr': 'Téléchargez ces documents pour valider votre compte', 'tr': 'Onay için bu belgeleri yükleyin'},
  'doc_national_id': {'ar': 'الهوية الوطنية', 'en': 'National ID', 'ur': 'قومی شناختی کارڈ', 'hi': 'राष्ट्रीय पहचान पत्र', 'bn': 'জাতীয় পরিচয়পত্র', 'fil': 'National ID', 'fr': 'Carte d\'identité', 'tr': 'Kimlik'},
  'doc_license': {'ar': 'رخصة القيادة', 'en': 'Driving license', 'ur': 'ڈرائیونگ لائسنس', 'hi': 'ड्राइविंग लाइसेंस', 'bn': 'ড্রাইভিং লাইসেন্স', 'fil': 'Lisensya sa pagmamaneho', 'fr': 'Permis de conduire', 'tr': 'Ehliyet'},
  'doc_vehicle_registration': {'ar': 'استمارة المركبة', 'en': 'Vehicle registration', 'ur': 'گاڑی کی رجسٹریشن', 'hi': 'वाहन पंजीकरण', 'bn': 'যান নিবন্ধন', 'fil': 'Rehistro ng sasakyan', 'fr': 'Carte grise', 'tr': 'Araç ruhsatı'},
  'doc_insurance': {'ar': 'بوليصة التأمين', 'en': 'Insurance policy', 'ur': 'انشورنس پالیسی', 'hi': 'बीमा पॉलिसी', 'bn': 'বীমা পলিসি', 'fil': 'Polisa ng seguro', 'fr': 'Police d\'assurance', 'tr': 'Sigorta poliçesi'},
  'doc_criminal_record': {'ar': 'شهادة عدلية', 'en': 'Criminal record', 'ur': 'کرمنل ریکارڈ', 'hi': 'पुलिस सत्यापन', 'bn': 'অপরাধমূলক রেকর্ড', 'fil': 'Police clearance', 'fr': 'Extrait de casier', 'tr': 'Sabıka kaydı'},
  'uploadDocument': {'ar': 'ارفع الوثيقة', 'en': 'Upload', 'ur': 'اپلوڈ کریں', 'hi': 'अपलोड', 'bn': 'আপলোড', 'fil': 'I-upload', 'fr': 'Télécharger', 'tr': 'Yükle'},
  'replaceDocument': {'ar': 'استبدل', 'en': 'Replace', 'ur': 'تبدیل کریں', 'hi': 'बदलें', 'bn': 'প্রতিস্থাপন', 'fil': 'Palitan', 'fr': 'Remplacer', 'tr': 'Değiştir'},
  'uploading': {'ar': 'جارٍ الرفع...', 'en': 'Uploading...', 'ur': 'اپلوڈ ہو رہا ہے...', 'hi': 'अपलोड हो रहा है...', 'bn': 'আপলোড হচ্ছে...', 'fil': 'Ina-upload...', 'fr': 'Téléchargement...', 'tr': 'Yükleniyor...'},
  'doc_uploaded': {'ar': 'تم رفع الوثيقة', 'en': 'Document uploaded', 'ur': 'دستاویز اپلوڈ ہو گئی', 'hi': 'दस्तावेज़ अपलोड हुआ', 'bn': 'নথি আপলোড হয়েছে', 'fil': 'Na-upload na', 'fr': 'Document téléchargé', 'tr': 'Belge yüklendi'},
  'doc_status_pending': {'ar': 'قيد المراجعة', 'en': 'Under review', 'ur': 'زیر جائزہ', 'hi': 'समीक्षा में', 'bn': 'পর্যালোচনাধীন', 'fil': 'Sinusuri', 'fr': 'En cours d\'examen', 'tr': 'İnceleniyor'},
  'doc_status_approved': {'ar': 'معتمدة', 'en': 'Approved', 'ur': 'منظور شدہ', 'hi': 'स्वीकृत', 'bn': 'অনুমোদিত', 'fil': 'Aprubado', 'fr': 'Approuvé', 'tr': 'Onaylı'},
  'doc_status_rejected': {'ar': 'مرفوضة', 'en': 'Rejected', 'ur': 'مسترد', 'hi': 'अस्वीकृत', 'bn': 'প্রত্যাখ্যাত', 'fil': 'Tinanggihan', 'fr': 'Refusé', 'tr': 'Reddedildi'},
  'doc_status_missing': {'ar': 'لم تُرفع بعد', 'en': 'Not uploaded yet', 'ur': 'ابھی اپلوڈ نہیں', 'hi': 'अभी अपलोड नहीं', 'bn': 'এখনো আপলোড নয়', 'fil': 'Hindi pa upload', 'fr': 'Pas encore téléchargé', 'tr': 'Henüz yüklenmedi'},
  'approval_pending_docs': {'ar': 'بانتظار رفع الوثائق', 'en': 'Awaiting documents', 'ur': 'دستاویزات کا انتظار', 'hi': 'दस्तावेज़ की प्रतीक्षा', 'bn': 'নথির অপেক্ষায়', 'fil': 'Naghihintay sa dokumento', 'fr': 'En attente de documents', 'tr': 'Belgeler bekleniyor'},
  'approval_docs_uploaded': {'ar': 'قيد مراجعة الإدارة', 'en': 'Under admin review', 'ur': 'ایڈمن کے زیر جائزہ', 'hi': 'प्रशासन समीक्षा में', 'bn': 'প্রশাসনিক পর্যালোচনায়', 'fil': 'Sinusuri ng admin', 'fr': 'En cours d\'examen', 'tr': 'İnceleme aşamasında'},
  'approval_approved': {'ar': 'معتمد ✓', 'en': 'Approved ✓', 'ur': 'منظور ✓', 'hi': 'स्वीकृत ✓', 'bn': 'অনুমোদিত ✓', 'fil': 'Aprubado ✓', 'fr': 'Approuvé ✓', 'tr': 'Onaylı ✓'},
  'approval_soft_reject': {'ar': 'رفض مؤقّت', 'en': 'Temporarily rejected', 'ur': 'عارضی طور پر مسترد', 'hi': 'अस्थायी अस्वीकृति', 'bn': 'অস্থায়ী প্রত্যাখ্যান', 'fil': 'Pansamantalang tinanggihan', 'fr': 'Refus temporaire', 'tr': 'Geçici red'},
  'approval_hard_reject': {'ar': 'رفض نهائي', 'en': 'Permanently rejected', 'ur': 'مستقل طور پر مسترد', 'hi': 'स्थायी अस्वीकृति', 'bn': 'স্থায়ী প্রত্যাখ্যান', 'fil': 'Permanenteng tinanggihan', 'fr': 'Refus définitif', 'tr': 'Kalıcı red'},

  // ─── I4 — Driver Payouts ───
  'payout_methods': {'ar': 'طرق سحب الأرباح', 'en': 'Payout methods', 'ur': 'منافع نکالنے کے طریقے', 'hi': 'भुगतान विधियाँ', 'bn': 'পেআউট পদ্ধতি', 'fil': 'Mga paraan ng payout', 'fr': 'Méthodes de retrait', 'tr': 'Çekim yöntemleri'},
  'payout_methods_hint': {'ar': 'أضف حساباً بنكياً أو STC Pay لتلقي أرباحك', 'en': 'Add a bank account or STC Pay to receive your earnings', 'ur': 'منافع وصول کرنے کے لیے بینک یا STC Pay شامل کریں', 'hi': 'कमाई पाने के लिए बैंक या STC Pay जोड़ें', 'bn': 'উপার্জন গ্রহণ করতে ব্যাংক বা STC Pay যোগ করুন', 'fil': 'Magdagdag ng bank o STC Pay', 'fr': 'Ajoutez un compte bancaire ou STC Pay', 'tr': 'Banka veya STC Pay ekleyin'},
  'add_payout_method': {'ar': 'إضافة طريقة سحب', 'en': 'Add payout method', 'ur': 'طریقہ شامل کریں', 'hi': 'विधि जोड़ें', 'bn': 'পদ্ধতি যোগ করুন', 'fil': 'Magdagdag', 'fr': 'Ajouter', 'tr': 'Ekle'},
  'payout_default': {'ar': 'افتراضي', 'en': 'Default', 'ur': 'بنیادی', 'hi': 'डिफ़ॉल्ट', 'bn': 'ডিফল্ট', 'fil': 'Default', 'fr': 'Par défaut', 'tr': 'Varsayılan'},
  'payout_make_default': {'ar': 'جعلها افتراضية', 'en': 'Make default', 'ur': 'بنیادی بنائیں', 'hi': 'डिफ़ॉल्ट बनाएँ', 'bn': 'ডিফল্ট করুন', 'fil': 'Gawing default', 'fr': 'Définir par défaut', 'tr': 'Varsayılan yap'},
  'payout_set_default_ok': {'ar': 'تم التعيين كافتراضية', 'en': 'Set as default', 'ur': 'بنیادی مقرر ہوگئی', 'hi': 'डिफ़ॉल्ट सेट', 'bn': 'ডিফল্ট সেট', 'fil': 'Naka-default na', 'fr': 'Définie par défaut', 'tr': 'Varsayılan ayarlandı'},
  'payout_removed': {'ar': 'تمت الإزالة', 'en': 'Removed', 'ur': 'ہٹا دیا گیا', 'hi': 'हटाया गया', 'bn': 'সরানো হয়েছে', 'fil': 'Tinanggal', 'fr': 'Supprimé', 'tr': 'Kaldırıldı'},
  'remove': {'ar': 'حذف', 'en': 'Remove', 'ur': 'ہٹائیں', 'hi': 'हटाएँ', 'bn': 'সরান', 'fil': 'Tanggalin', 'fr': 'Supprimer', 'tr': 'Kaldır'},
  'remove_payout_method_q': {'ar': 'حذف طريقة السحب؟', 'en': 'Remove payout method?', 'ur': 'طریقہ ہٹائیں؟', 'hi': 'विधि हटाएँ?', 'bn': 'পদ্ধতি সরান?', 'fil': 'Tanggalin?', 'fr': 'Supprimer ?', 'tr': 'Kaldırılsın mı?'},
  'payout_type_bank': {'ar': 'بنك', 'en': 'Bank', 'ur': 'بینک', 'hi': 'बैंक', 'bn': 'ব্যাংক', 'fil': 'Bangko', 'fr': 'Banque', 'tr': 'Banka'},
  'payout_type_mada': {'ar': 'مدى', 'en': 'Mada', 'ur': 'مدى', 'hi': 'मदा', 'bn': 'মাদা', 'fil': 'Mada', 'fr': 'Mada', 'tr': 'Mada'},
  'payout_type_stcpay': {'ar': 'STC Pay', 'en': 'STC Pay', 'ur': 'STC Pay', 'hi': 'STC Pay', 'bn': 'STC Pay', 'fil': 'STC Pay', 'fr': 'STC Pay', 'tr': 'STC Pay'},
  'account_name': {'ar': 'اسم صاحب الحساب', 'en': 'Account name', 'ur': 'اکاؤنٹ کا نام', 'hi': 'खाता नाम', 'bn': 'অ্যাকাউন্ট নাম', 'fil': 'Pangalan', 'fr': 'Nom du titulaire', 'tr': 'Hesap sahibi'},
  'bank_name': {'ar': 'اسم البنك', 'en': 'Bank name', 'ur': 'بینک کا نام', 'hi': 'बैंक नाम', 'bn': 'ব্যাংকের নাম', 'fil': 'Pangalan ng bangko', 'fr': 'Nom de la banque', 'tr': 'Banka adı'},
  'phone_number': {'ar': 'رقم الجوال', 'en': 'Phone number', 'ur': 'فون نمبر', 'hi': 'फ़ोन नंबर', 'bn': 'ফোন নম্বর', 'fil': 'Phone number', 'fr': 'Numéro de téléphone', 'tr': 'Telefon numarası'},
  'saving': {'ar': 'جارٍ الحفظ...', 'en': 'Saving...', 'ur': 'محفوظ ہو رہا ہے...', 'hi': 'सहेजा जा रहा है...', 'bn': 'সংরক্ষণ হচ্ছে...', 'fil': 'Sine-save...', 'fr': 'Enregistrement...', 'tr': 'Kaydediliyor...'},

  // ─── Common ───
  'confirm': {'ar': 'تأكيد', 'en': 'Confirm', 'ur': 'تصدیق کریں', 'hi': 'पुष्टि करें', 'bn': 'নিশ্চিত করুন', 'fil': 'Kumpirmahin', 'fr': 'Confirmer', 'tr': 'Onayla'},
  'cancel': {'ar': 'إلغاء', 'en': 'Cancel', 'ur': 'منسوخ', 'hi': 'रद्द करें', 'bn': 'বাতিল', 'fil': 'Kanselahin', 'fr': 'Annuler', 'tr': 'İptal'},
  'save': {'ar': 'حفظ', 'en': 'Save', 'ur': 'محفوظ کریں', 'hi': 'सहेजें', 'bn': 'সংরক্ষণ', 'fil': 'I-save', 'fr': 'Enregistrer', 'tr': 'Kaydet'},
  'retry': {'ar': 'إعادة المحاولة', 'en': 'Retry', 'ur': 'دوبارہ کوشش', 'hi': 'पुनः प्रयास', 'bn': 'আবার চেষ্টা', 'fil': 'Subukan ulit', 'fr': 'Réessayer', 'tr': 'Tekrar dene'},
  'ok': {'ar': 'حسناً', 'en': 'OK', 'ur': 'ٹھیک ہے', 'hi': 'ठीक है', 'bn': 'ঠিক আছে', 'fil': 'OK', 'fr': 'OK', 'tr': 'Tamam'},
  'delete': {'ar': 'حذف', 'en': 'Delete', 'ur': 'حذف', 'hi': 'हटाएं', 'bn': 'মুছুন', 'fil': 'Tanggalin', 'fr': 'Supprimer', 'tr': 'Sil'},
  'noData': {'ar': 'لا توجد بيانات', 'en': 'No data', 'ur': 'کوئی ڈیٹا نہیں', 'hi': 'कोई डेटा नहीं', 'bn': 'কোনো ডেটা নেই', 'fil': 'Walang data', 'fr': 'Aucune donnée', 'tr': 'Veri yok'},
  'comingSoon': {'ar': 'قريباً', 'en': 'Coming soon', 'ur': 'جلد آ رہا ہے', 'hi': 'जल्द आ रहा है', 'bn': 'শীঘ্রই আসছে', 'fil': 'Malapit na', 'fr': 'Bientôt', 'tr': 'Yakında'},
  'accept': {'ar': 'قبول', 'en': 'Accept', 'ur': 'قبول کریں', 'hi': 'स्वीकार करें', 'bn': 'গ্রহণ করুন', 'fil': 'Tanggapin', 'fr': 'Accepter', 'tr': 'Kabul et'},
  'decline': {'ar': 'رفض', 'en': 'Decline', 'ur': 'مسترد کریں', 'hi': 'अस्वीकार करें', 'bn': 'প্রত্যাখ্যান করুন', 'fil': 'Tanggihan', 'fr': 'Refuser', 'tr': 'Reddet'},
  'verify': {'ar': 'تحقّق', 'en': 'Verify', 'ur': 'تصدیق کریں', 'hi': 'सत्यापित करें', 'bn': 'যাচাই করুন', 'fil': 'I-verify', 'fr': 'Vérifier', 'tr': 'Doğrula'},
  'resendOtp': {'ar': 'إعادة إرسال الرمز', 'en': 'Resend OTP', 'ur': 'کوڈ دوبارہ بھیجیں', 'hi': 'ओटीपी पुनः भेजें', 'bn': 'ওটিপি পুনঃপ্রেরণ', 'fil': 'Ipadala muli ang OTP', 'fr': 'Renvoyer le code', 'tr': 'Kodu tekrar gönder'},
  'sendOtp': {'ar': 'إرسال الرمز', 'en': 'Send OTP', 'ur': 'کوڈ بھیجیں', 'hi': 'ओटीपी भेजें', 'bn': 'ওটিপি পাঠান', 'fil': 'Magpadala ng OTP', 'fr': 'Envoyer le code', 'tr': 'Kod gönder'},
  // ─── Aurora login (Captain) ───
  'loginSignup': {'ar': 'تسجيل الدخول / إنشاء حساب', 'en': 'Log-in / Sign-up'},
  'captainTagline': {'ar': 'كن كابتن HANCR', 'en': 'Become a HANCR Captain'},
  'captainHeroTitle': {'ar': 'قُد. اربح.\nتميَّز.', 'en': 'Drive. Earn.\nExcel.'},
  'captainHeroSub': {'ar': 'انضمّ لأسطول الكباتن واكسب دخلاً مرناً مع رحلات قريبة منك وأدوات ذكية لزيادة أرباحك.', 'en': 'Join the captain fleet — earn flexibly with nearby rides and smart tools to grow your income.'},
  'continueWith': {'ar': 'تابِع للدخول', 'en': 'Continue to log-in'},
  'signupPhone': {'ar': 'الدخول برقم الجوال', 'en': 'Continue with phone'},
  'orContinueWith': {'ar': 'أو تابِع عبر', 'en': 'or continue with'},
  'phoneHint': {'ar': '5XXXXXXXX', 'en': '5XXXXXXXX'},
  'enterPhoneFirst': {'ar': 'أدخل رقم جوالك أولاً', 'en': 'Enter your phone number first'},
  'otpTitle': {'ar': 'أدخل رمز التحقق', 'en': 'Enter your code'},
  'otpSentTo': {'ar': 'أرسلنا رمزاً مكوّناً من 6 أرقام إلى', 'en': 'We sent a 6-digit code to'},
  'verifyBtn': {'ar': 'تحقّق ودخول', 'en': 'Verify & continue'},
  'resendCode': {'ar': 'إعادة إرسال الرمز', 'en': 'Resend code'},
  'resendInPrefix': {'ar': 'إعادة الإرسال خلال', 'en': 'Resend in'},
  'seconds': {'ar': 'ثانية', 'en': 's'},
  'devModeCode': {'ar': 'وضع التطوير — الرمز', 'en': 'Dev mode — code'},
  'emailTitle': {'ar': 'الدخول بالبريد', 'en': 'Email login'},
  'emailSub': {'ar': 'أدخل بريدك لإرسال رمز تحقق', 'en': 'Enter your email to receive a code'},
  'emailHint': {'ar': 'name@example.com', 'en': 'name@example.com'},
  'sendCode': {'ar': 'إرسال الرمز', 'en': 'Send code'},
  'emailOtpSentTo': {'ar': 'أرسلنا رمزاً إلى', 'en': 'We sent a code to'},
  'addPhoneToComplete': {'ar': 'أضف رقم هاتفك لإكمال إنشاء الحساب', 'en': 'Add your phone to complete sign-up'},
  'available': {'ar': 'متاح', 'en': 'Available'},
  'pending': {'ar': 'معلّق', 'en': 'Pending'},
  'allTime': {'ar': 'إجمالي العمر', 'en': 'All-time'},
  'profile': {'ar': 'الملف الشخصي', 'en': 'Profile', 'ur': 'پروفائل', 'hi': 'प्रोफ़ाइल', 'bn': 'প্রোফাইল', 'fil': 'Profile', 'fr': 'Profil', 'tr': 'Profil'},
  'edit': {'ar': 'تعديل', 'en': 'Edit', 'ur': 'ترمیم', 'hi': 'संपादित करें', 'bn': 'সম্পাদনা', 'fil': 'I-edit', 'fr': 'Modifier', 'tr': 'Düzenle'},
  'help_support': {'ar': 'المساعدة والدعم', 'en': 'Help & Support', 'ur': 'مدد اور سپورٹ', 'hi': 'सहायता और समर्थन', 'bn': 'সাহায্য ও সহায়তা', 'fil': 'Tulong at Suporta', 'fr': 'Aide et support', 'tr': 'Yardım ve Destek'},
  'privacy_policy': {'ar': 'سياسة الخصوصية', 'en': 'Privacy Policy', 'ur': 'پرائیویسی پالیسی', 'hi': 'गोपनीयता नीति', 'bn': 'গোপনীয়তা নীতি', 'fil': 'Patakaran sa Privacy', 'fr': 'Politique de confidentialité', 'tr': 'Gizlilik Politikası'},

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

  // ─── Call & external navigation ───
  'callRider': {'ar': 'اتصال بالراكب', 'en': 'Call rider', 'ur': 'سواری کو کال کریں', 'hi': 'राइडर को कॉल करें', 'bn': 'যাত্রীকে কল করুন', 'fil': 'Tawagan ang pasahero', 'fr': 'Appeler le passager', 'tr': 'Yolcuyu ara'},
  'navigate': {'ar': 'الملاحة', 'en': 'Navigate', 'ur': 'راستہ', 'hi': 'नेविगेट', 'bn': 'নেভিগেট', 'fil': 'Mag-navigate', 'fr': 'Naviguer', 'tr': 'Yön bul'},
  'noPhoneAvailable': {'ar': 'لا يوجد رقم متاح', 'en': 'No phone available', 'ur': 'کوئی نمبر دستیاب نہیں', 'hi': 'कोई फ़ोन उपलब्ध नहीं', 'bn': 'কোনো ফোন নেই', 'fil': 'Walang telepono', 'fr': 'Aucun numéro disponible', 'tr': 'Telefon yok'},
  'cannotCall': {'ar': 'تعذّر إجراء الاتصال', 'en': 'Cannot place call', 'ur': 'کال نہیں ہو سکی', 'hi': 'कॉल नहीं हो सका', 'bn': 'কল করা যায়নি', 'fil': 'Hindi makatawag', 'fr': 'Appel impossible', 'tr': 'Arama yapılamadı'},
  'navigateWith': {'ar': 'الملاحة عبر', 'en': 'Navigate with', 'ur': 'کے ذریعے راستہ', 'hi': 'के साथ नेविगेट करें', 'bn': 'দিয়ে নেভিগেট করুন', 'fil': 'Mag-navigate gamit ang', 'fr': 'Naviguer avec', 'tr': 'İle yön bul'},
  'googleMaps': {'ar': 'خرائط جوجل', 'en': 'Google Maps', 'ur': 'گوگل میپس', 'hi': 'गूगल मैप्स', 'bn': 'গুগল ম্যাপস', 'fil': 'Google Maps', 'fr': 'Google Maps', 'tr': 'Google Haritalar'},
  'waze': {'ar': 'ويز', 'en': 'Waze', 'ur': 'ویز', 'hi': 'वेज़', 'bn': 'ওয়েজ', 'fil': 'Waze', 'fr': 'Waze', 'tr': 'Waze'},
  'cannotOpenMaps': {'ar': 'تعذّر فتح تطبيق الخرائط', 'en': 'Cannot open maps app', 'ur': 'میپس ایپ نہیں کھل سکی', 'hi': 'मैप्स ऐप नहीं खुला', 'bn': 'ম্যাপস খোলা যায়নি', 'fil': 'Hindi mabuksan ang maps', 'fr': 'Impossible d\'ouvrir les cartes', 'tr': 'Harita açılamadı'},

  // ─── Chat ───
  'chatWithRider': {'ar': 'الدردشة مع الراكب', 'en': 'Chat with rider', 'ur': 'سواری سے بات کریں', 'hi': 'राइडर से चैट करें', 'bn': 'যাত্রীর সাথে চ্যাট', 'fil': 'Makipag-chat sa pasahero', 'fr': 'Discuter avec le passager', 'tr': 'Yolcuyla sohbet'},
  'noMessagesYet': {'ar': 'لا رسائل بعد — ابدأ المحادثة', 'en': 'No messages yet', 'ur': 'ابھی کوئی پیغام نہیں', 'hi': 'अभी कोई संदेश नहीं', 'bn': 'এখনও কোনো বার্তা নেই', 'fil': 'Wala pang mensahe', 'fr': 'Aucun message', 'tr': 'Henüz mesaj yok'},
  'typeMessage': {'ar': 'اكتب رسالة…', 'en': 'Type a message…', 'ur': 'پیغام لکھیں…', 'hi': 'संदेश लिखें…', 'bn': 'বার্তা লিখুন…', 'fil': 'Mag-type ng mensahe…', 'fr': 'Écrivez un message…', 'tr': 'Mesaj yazın…'},

  // ─── Active ride actions & Parcel delivery ───
  'parcelDelivery': {'ar': 'توصيل أمانة', 'en': 'Parcel delivery', 'ur': 'پارسل ڈیلیوری', 'hi': 'पार्सल डिलीवरी', 'bn': 'পার্সেল ডেলিভারি', 'fil': 'Paghahatid ng parsela', 'fr': 'Livraison de colis', 'tr': 'Koli teslimatı'},
  'cancelRide': {'ar': 'إلغاء الرحلة', 'en': 'Cancel ride', 'ur': 'سواری منسوخ کریں', 'hi': 'राइड रद्द करें', 'bn': 'রাইড বাতিল করুন', 'fil': 'Kanselahin ang biyahe', 'fr': 'Annuler la course', 'tr': 'Yolculuğu iptal et'},
  'arrivedPickup': {'ar': 'وصلت لنقطة الانطلاق', 'en': 'Arrived at pickup', 'ur': 'پک اپ پر پہنچ گیا', 'hi': 'पिकअप पर पहुंचे', 'bn': 'পিকআপে পৌঁছেছি', 'fil': 'Dumating sa pickup', 'fr': 'Arrivé au point de départ', 'tr': 'Alış noktasına geldim'},
  'startRide': {'ar': 'ابدأ الرحلة', 'en': 'Start ride', 'ur': 'سواری شروع کریں', 'hi': 'राइड शुरू करें', 'bn': 'রাইড শুরু করুন', 'fil': 'Simulan ang biyahe', 'fr': 'Démarrer la course', 'tr': 'Yolculuğu başlat'},
  'finishRide': {'ar': 'إنهاء الرحلة', 'en': 'Finish ride', 'ur': 'سواری ختم کریں', 'hi': 'राइड समाप्त करें', 'bn': 'রাইড শেষ করুন', 'fil': 'Tapusin ang biyahe', 'fr': 'Terminer la course', 'tr': 'Yolculuğu bitir'},
  'confirmDelivery': {'ar': 'تأكيد التسليم', 'en': 'Confirm delivery', 'ur': 'ڈیلیوری کی تصدیق', 'hi': 'डिलीवरी की पुष्टि करें', 'bn': 'ডেলিভারি নিশ্চিত করুন', 'fil': 'Kumpirmahin ang delivery', 'fr': 'Confirmer la livraison', 'tr': 'Teslimatı onayla'},
  'askReceiverCode': {'ar': 'اطلب كود التسليم من المستلم وأدخله', 'en': 'Ask the receiver for the delivery code and enter it', 'ur': 'وصول کنندہ سے کوڈ مانگ کر درج کریں', 'hi': 'प्राप्तकर्ता से कोड मांगें और दर्ज करें', 'bn': 'প্রাপকের কাছ থেকে কোড নিয়ে লিখুন', 'fil': 'Hingin ang code sa tatanggap at ilagay', 'fr': 'Demandez le code au destinataire et saisissez-le', 'tr': 'Alıcıdan teslimat kodunu isteyip girin'},
  'invalidCode': {'ar': 'كود غير صحيح', 'en': 'Invalid code', 'ur': 'غلط کوڈ', 'hi': 'गलत कोड', 'bn': 'ভুল কোড', 'fil': 'Maling code', 'fr': 'Code invalide', 'tr': 'Geçersiz kod'},
  'deliveryConfirmed': {'ar': 'تم تأكيد التسليم', 'en': 'Delivery confirmed', 'ur': 'ڈیلیوری کی تصدیق ہو گئی', 'hi': 'डिलीवरी की पुष्टि हुई', 'bn': 'ডেলিভারি নিশ্চিত হয়েছে', 'fil': 'Nakumpirma ang delivery', 'fr': 'Livraison confirmée', 'tr': 'Teslimat onaylandı'},
  'onTheWay': {'ar': 'في الطريق', 'en': 'On the way', 'ur': 'راستے میں', 'hi': 'रास्ते में', 'bn': 'পথে', 'fil': 'Papunta na', 'fr': 'En route', 'tr': 'Yolda'},
  'arrivedStatus': {'ar': 'وصل', 'en': 'Arrived', 'ur': 'پہنچ گیا', 'hi': 'पहुंचे', 'bn': 'পৌঁছেছে', 'fil': 'Dumating', 'fr': 'Arrivé', 'tr': 'Geldi'},
  'inProgress': {'ar': 'جارية', 'en': 'In progress', 'ur': 'جاری', 'hi': 'जारी', 'bn': 'চলছে', 'fil': 'Isinasagawa', 'fr': 'En cours', 'tr': 'Devam ediyor'},

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
  'carBrand': {'ar': 'ماركة السيارة', 'en': 'Car brand', 'ur': 'گاڑی کا برانڈ', 'hi': 'कार ब्रांड', 'bn': 'গাড়ির ব্র্যান্ড', 'fil': 'Brand ng kotse', 'fr': 'Marque du véhicule', 'tr': 'Araç markası'},
  'carModel': {'ar': 'موديل السيارة', 'en': 'Car model', 'ur': 'گاڑی کا ماڈل', 'hi': 'कार मॉडल', 'bn': 'গাড়ির মডেল', 'fil': 'Modelo ng kotse', 'fr': 'Modèle du véhicule', 'tr': 'Araç modeli'},
  'plateNumber': {'ar': 'رقم اللوحة', 'en': 'Plate number', 'ur': 'پلیٹ نمبر', 'hi': 'प्लेट नंबर', 'bn': 'প্লেট নম্বর', 'fil': 'Plate number', 'fr': 'Numéro de plaque', 'tr': 'Plaka numarası'},
  'carYear': {'ar': 'سنة الصنع', 'en': 'Year', 'ur': 'سال', 'hi': 'वर्ष', 'bn': 'সাল', 'fil': 'Taon', 'fr': 'Année', 'tr': 'Yıl'},
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
