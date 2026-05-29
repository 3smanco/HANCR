import 'package:equatable/equatable.dart';

enum LoyaltyTier { bronze, silver, gold, platinum }

extension LoyaltyTierX on LoyaltyTier {
  String get label {
    switch (this) {
      case LoyaltyTier.bronze:
        return 'Bronze';
      case LoyaltyTier.silver:
        return 'Silver';
      case LoyaltyTier.gold:
        return 'Gold';
      case LoyaltyTier.platinum:
        return 'Platinum';
    }
  }

  int get nextTierMiles {
    switch (this) {
      case LoyaltyTier.bronze:
        return 500;
      case LoyaltyTier.silver:
        return 2000;
      case LoyaltyTier.gold:
        return 5000;
      case LoyaltyTier.platinum:
        return 0; // top tier
    }
  }

  static LoyaltyTier fromString(String s) {
    switch (s.toLowerCase()) {
      case 'silver':
        return LoyaltyTier.silver;
      case 'gold':
        return LoyaltyTier.gold;
      case 'platinum':
        return LoyaltyTier.platinum;
      default:
        return LoyaltyTier.bronze;
    }
  }
}

class LoyaltyModel extends Equatable {
  final int id;
  final LoyaltyTier tier;
  final double totalMiles;
  final double availableMiles;
  final double lifetimeMiles;
  final int freeUpgradesRemaining;
  final bool hasFreeCancellation;
  final DateTime? surgeImmunityUntil;

  const LoyaltyModel({
    required this.id,
    required this.tier,
    required this.totalMiles,
    required this.availableMiles,
    required this.lifetimeMiles,
    required this.freeUpgradesRemaining,
    required this.hasFreeCancellation,
    this.surgeImmunityUntil,
  });

  factory LoyaltyModel.fromJson(Map<String, dynamic> json) => LoyaltyModel(
        id: json['id'] as int? ?? 0,
        tier: LoyaltyTierX.fromString(json['tier'] as String? ?? 'Bronze'),
        totalMiles: (json['totalMiles'] as num?)?.toDouble() ?? 0,
        availableMiles: (json['availableMiles'] as num?)?.toDouble() ?? 0,
        lifetimeMiles: (json['lifetimeMiles'] as num?)?.toDouble() ?? 0,
        freeUpgradesRemaining: json['freeUpgradesRemaining'] as int? ?? 0,
        hasFreeCancellation: json['hasFreeCancellation'] as bool? ?? false,
        surgeImmunityUntil: json['surgeImmunityUntil'] != null
            ? DateTime.tryParse(json['surgeImmunityUntil'] as String)
            : null,
      );

  double get progressToNext {
    final next = tier.nextTierMiles;
    if (next == 0) return 1.0;
    return (lifetimeMiles / next).clamp(0.0, 1.0);
  }

  @override
  List<Object?> get props => [id, tier, totalMiles, availableMiles];
}
