class DriverModel {
  final int id;
  final String phoneNumber;
  final String countryCode;
  final String firstName;
  final String lastName;
  final String? avatarUrl;
  final String status;
  final bool active;
  final bool banned;
  final double rating;
  final int ratingCount;
  final String? carBrand;
  final String? carModel;
  final String? carColor;
  final String? plateNumber;
  final int? carYear;
  final String? carPhotoUrl;
  final double balance;
  final String currency;
  final int? regionId;
  final DateTime createdAt;
  // Phase H — driver flags
  final String? gender;
  final bool kidsApproved;
  final bool nightApproved;

  const DriverModel({
    required this.id,
    required this.phoneNumber,
    required this.countryCode,
    required this.firstName,
    required this.lastName,
    this.avatarUrl,
    required this.status,
    required this.active,
    required this.banned,
    required this.rating,
    required this.ratingCount,
    this.carBrand,
    this.carModel,
    this.carColor,
    this.plateNumber,
    this.carYear,
    this.carPhotoUrl,
    required this.balance,
    required this.currency,
    this.regionId,
    required this.createdAt,
    this.gender,
    this.kidsApproved = false,
    this.nightApproved = false,
  });

  factory DriverModel.fromJson(Map<String, dynamic> json) => DriverModel(
        id: json['id'] as int,
        phoneNumber: json['phoneNumber'] as String,
        countryCode: json['countryCode'] as String? ?? '+966',
        firstName: json['firstName'] as String? ?? '',
        lastName: json['lastName'] as String? ?? '',
        avatarUrl: json['avatarUrl'] as String?,
        status: json['status'] as String? ?? 'offline',
        active: json['active'] as bool? ?? false,
        banned: json['banned'] as bool? ?? false,
        rating: (json['rating'] as num? ?? 5.0).toDouble(),
        ratingCount: json['ratingCount'] as int? ?? 0,
        carBrand: json['carBrand'] as String?,
        carModel: json['carModel'] as String?,
        carColor: json['carColor'] as String?,
        plateNumber: json['plateNumber'] as String?,
        carYear: json['carYear'] as int?,
        carPhotoUrl: json['carPhotoUrl'] as String?,
        balance: (json['balance'] as num? ?? 0).toDouble(),
        currency: json['currency'] as String? ?? 'SAR',
        regionId: json['regionId'] as int?,
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : DateTime.now(),
        gender: json['gender'] as String?,
        kidsApproved: json['kidsApproved'] as bool? ?? false,
        nightApproved: json['nightApproved'] as bool? ?? false,
      );

  String get displayName {
    final parts = [firstName, lastName].where((s) => s.isNotEmpty).toList();
    return parts.isNotEmpty ? parts.join(' ') : phoneNumber;
  }

  String get carDescription {
    final parts = <String>[
      ?carBrand,
      ?carModel,
      if (carColor != null) '• $carColor',
    ];
    return parts.join(' ');
  }

  DriverModel copyWith({
    String? firstName,
    String? lastName,
    String? avatarUrl,
    String? carBrand,
    String? carModel,
    String? carColor,
    String? plateNumber,
    int? carYear,
    bool? active,
    String? gender,
  }) =>
      DriverModel(
        id: id,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        firstName: firstName ?? this.firstName,
        lastName: lastName ?? this.lastName,
        avatarUrl: avatarUrl ?? this.avatarUrl,
        status: status,
        active: active ?? this.active,
        banned: banned,
        rating: rating,
        ratingCount: ratingCount,
        carBrand: carBrand ?? this.carBrand,
        carModel: carModel ?? this.carModel,
        carColor: carColor ?? this.carColor,
        plateNumber: plateNumber ?? this.plateNumber,
        carYear: carYear ?? this.carYear,
        carPhotoUrl: carPhotoUrl,
        balance: balance,
        currency: currency,
        regionId: regionId,
        createdAt: createdAt,
        gender: gender ?? this.gender,
        kidsApproved: kidsApproved,
        nightApproved: nightApproved,
      );
}
