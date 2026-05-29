class StarsModel {
  final int id;
  final double totalStars;
  final double currentCommissionPercent;
  final int completedRides;
  final double averageRating;
  final double starsFromRating;
  final double starsFromLongTrips;
  final double starsFromPeakHours;
  final double starsFromNoCancel;
  final int noCancelStreakWeeks;
  final double starsToNextLevel;
  final double nextCommissionPercent;
  final DateTime updatedAt;

  const StarsModel({
    required this.id,
    required this.totalStars,
    required this.currentCommissionPercent,
    required this.completedRides,
    required this.averageRating,
    required this.starsFromRating,
    required this.starsFromLongTrips,
    required this.starsFromPeakHours,
    required this.starsFromNoCancel,
    required this.noCancelStreakWeeks,
    required this.starsToNextLevel,
    required this.nextCommissionPercent,
    required this.updatedAt,
  });

  factory StarsModel.fromJson(Map<String, dynamic> json) => StarsModel(
        id: json['id'] as int,
        totalStars: (json['totalStars'] as num).toDouble(),
        currentCommissionPercent:
            (json['currentCommissionPercent'] as num).toDouble(),
        completedRides: json['completedRides'] as int,
        averageRating: (json['averageRating'] as num).toDouble(),
        starsFromRating: (json['starsFromRating'] as num).toDouble(),
        starsFromLongTrips: (json['starsFromLongTrips'] as num).toDouble(),
        starsFromPeakHours: (json['starsFromPeakHours'] as num).toDouble(),
        starsFromNoCancel: (json['starsFromNoCancel'] as num).toDouble(),
        noCancelStreakWeeks: json['noCancelStreakWeeks'] as int,
        starsToNextLevel: (json['starsToNextLevel'] as num).toDouble(),
        nextCommissionPercent:
            (json['nextCommissionPercent'] as num).toDouble(),
        updatedAt: json['updatedAt'] != null
            ? DateTime.parse(json['updatedAt'] as String)
            : DateTime.now(),
      );

  /// Progress toward the next star level (0.0–1.0)
  double get progressToNext {
    if (starsToNextLevel <= 0) return 1.0;
    final earned = totalStars;
    final needed = totalStars + starsToNextLevel;
    return (earned / needed).clamp(0.0, 1.0);
  }
}
