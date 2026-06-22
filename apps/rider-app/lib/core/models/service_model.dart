import 'package:equatable/equatable.dart';
import '../i18n/app_localization.dart';

class ServiceModel extends Equatable {
  final int id;
  final String name;
  final String nameEn;
  final String serviceType;
  final double baseFare;
  final double minimumFee;
  final double? hourlyRate;
  final bool bidModeEnabled;
  final bool enabled;
  final int displayOrder;
  final String? iconUrl;
  final bool isVip;

  const ServiceModel({
    required this.id,
    required this.name,
    required this.nameEn,
    required this.serviceType,
    required this.baseFare,
    required this.minimumFee,
    this.hourlyRate,
    required this.bidModeEnabled,
    required this.enabled,
    required this.displayOrder,
    this.iconUrl,
    required this.isVip,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) => ServiceModel(
        id: json['id'] as int,
        name: json['name'] as String,
        nameEn: json['nameEn'] as String? ?? '',
        serviceType: json['serviceType'] as String? ?? 'Economy',
        baseFare: (json['baseFare'] as num?)?.toDouble() ?? 0,
        minimumFee: (json['minimumFee'] as num?)?.toDouble() ?? 0,
        hourlyRate: (json['hourlyRate'] as num?)?.toDouble(),
        bidModeEnabled: json['bidModeEnabled'] as bool? ?? false,
        enabled: json['enabled'] as bool? ?? true,
        displayOrder: json['displayOrder'] as int? ?? 0,
        iconUrl: json['iconUrl'] as String?,
        isVip: json['isVip'] as bool? ?? false,
      );

  /// الاسم حسب لغة الواجهة: nameEn للإنجليزية (وغير العربية) إن توفّر،
  /// وإلا الاسم العربي الافتراضي. يصحّح ظهور أسماء عربية على واجهة إنجليزية.
  String get displayName {
    final code = LocaleController.instance.value.languageCode;
    if (code != 'ar' && nameEn.isNotEmpty) return nameEn;
    return name;
  }

  @override
  List<Object?> get props => [id, name, baseFare];
}
