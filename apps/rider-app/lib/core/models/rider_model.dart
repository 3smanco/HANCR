import 'package:equatable/equatable.dart';

class RiderModel extends Equatable {
  final int id;
  final String phoneNumber;
  final String countryCode;
  final String? firstName;
  final String? lastName;
  final String? avatarUrl;
  final String? email;
  final double balance;
  final String currency;
  final double rating;
  final int totalRides;
  final bool banned;
  final bool active;
  final String? teamCode;
  final bool twoFactorEnabled;

  const RiderModel({
    required this.id,
    required this.phoneNumber,
    required this.countryCode,
    this.firstName,
    this.lastName,
    this.avatarUrl,
    this.email,
    required this.balance,
    required this.currency,
    required this.rating,
    required this.totalRides,
    required this.banned,
    required this.active,
    this.teamCode,
    this.twoFactorEnabled = false,
  });

  String get displayName {
    if (firstName != null && lastName != null) return '$firstName $lastName';
    if (firstName != null) return firstName!;
    return phoneNumber;
  }

  factory RiderModel.fromJson(Map<String, dynamic> json) => RiderModel(
        id: json['id'] as int,
        phoneNumber: json['phoneNumber'] as String,
        countryCode: json['countryCode'] as String? ?? '',
        firstName: json['firstName'] as String?,
        lastName: json['lastName'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        email: json['email'] as String?,
        balance: (json['balance'] as num?)?.toDouble() ?? 0.0,
        currency: json['currency'] as String? ?? 'SAR',
        rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
        totalRides: json['totalRides'] as int? ?? 0,
        banned: json['banned'] as bool? ?? false,
        active: json['active'] as bool? ?? true,
        teamCode: json['teamCode'] as String?,
        twoFactorEnabled: json['twoFactorEnabled'] as bool? ?? false,
      );

  RiderModel copyWith({
    String? firstName,
    String? lastName,
    String? email,
    String? avatarUrl,
    String? teamCode,
    bool? twoFactorEnabled,
  }) =>
      RiderModel(
        id: id,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        firstName: firstName ?? this.firstName,
        lastName: lastName ?? this.lastName,
        avatarUrl: avatarUrl ?? this.avatarUrl,
        email: email ?? this.email,
        balance: balance,
        currency: currency,
        rating: rating,
        totalRides: totalRides,
        banned: banned,
        active: active,
        teamCode: teamCode ?? this.teamCode,
        twoFactorEnabled: twoFactorEnabled ?? this.twoFactorEnabled,
      );

  @override
  List<Object?> get props => [
        id,
        phoneNumber,
        firstName,
        lastName,
        avatarUrl,
        email,
        balance,
        currency,
        rating,
        totalRides,
      ];
}
