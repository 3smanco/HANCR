import 'package:equatable/equatable.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

enum SosStatus { active, resolved, cancelled, escalated }

enum SosTriggeredBy { rider, driver, system }

enum EmergencyContactRelation { family, friend, spouse, colleague, other }

extension SosStatusX on SosStatus {
  static SosStatus fromString(String s) {
    switch (s) {
      case 'Active':
        return SosStatus.active;
      case 'Resolved':
        return SosStatus.resolved;
      case 'Cancelled':
        return SosStatus.cancelled;
      case 'Escalated':
        return SosStatus.escalated;
      default:
        return SosStatus.active;
    }
  }

  String get label {
    switch (this) {
      case SosStatus.active:
        return 'نشطة';
      case SosStatus.resolved:
        return 'مُغلقة';
      case SosStatus.cancelled:
        return 'مُلغاة';
      case SosStatus.escalated:
        return 'مُصعَّدة';
    }
  }
}

extension SosTriggeredByX on SosTriggeredBy {
  static SosTriggeredBy fromString(String s) {
    switch (s) {
      case 'Driver':
        return SosTriggeredBy.driver;
      case 'System':
        return SosTriggeredBy.system;
      default:
        return SosTriggeredBy.rider;
    }
  }
}

extension EmergencyContactRelationX on EmergencyContactRelation {
  static EmergencyContactRelation fromString(String s) {
    switch (s) {
      case 'Family':
        return EmergencyContactRelation.family;
      case 'Friend':
        return EmergencyContactRelation.friend;
      case 'Spouse':
        return EmergencyContactRelation.spouse;
      case 'Colleague':
        return EmergencyContactRelation.colleague;
      case 'Other':
        return EmergencyContactRelation.other;
      default:
        return EmergencyContactRelation.family;
    }
  }

  String get gqlValue {
    switch (this) {
      case EmergencyContactRelation.family:
        return 'Family';
      case EmergencyContactRelation.friend:
        return 'Friend';
      case EmergencyContactRelation.spouse:
        return 'Spouse';
      case EmergencyContactRelation.colleague:
        return 'Colleague';
      case EmergencyContactRelation.other:
        return 'Other';
    }
  }

  String get label {
    switch (this) {
      case EmergencyContactRelation.family:
        return 'العائلة';
      case EmergencyContactRelation.friend:
        return 'صديق';
      case EmergencyContactRelation.spouse:
        return 'الزوج/الزوجة';
      case EmergencyContactRelation.colleague:
        return 'زميل';
      case EmergencyContactRelation.other:
        return 'أخرى';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────────────────────────────────────

class EmergencyContactModel extends Equatable {
  final int id;
  final String name;
  final String phoneNumber;
  final EmergencyContactRelation relation;
  final bool autoShareTrips;
  final int priority;
  final DateTime createdAt;

  const EmergencyContactModel({
    required this.id,
    required this.name,
    required this.phoneNumber,
    required this.relation,
    required this.autoShareTrips,
    required this.priority,
    required this.createdAt,
  });

  factory EmergencyContactModel.fromJson(Map<String, dynamic> json) =>
      EmergencyContactModel(
        id: json['id'] as int,
        name: json['name'] as String,
        phoneNumber: json['phoneNumber'] as String,
        relation: EmergencyContactRelationX.fromString(
          json['relation'] as String,
        ),
        autoShareTrips: json['autoShareTrips'] as bool,
        priority: json['priority'] as int,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  @override
  List<Object?> get props => [
        id,
        name,
        phoneNumber,
        relation,
        autoShareTrips,
        priority,
        createdAt,
      ];
}

class SosIncidentModel extends Equatable {
  final int id;
  final SosTriggeredBy triggeredBy;
  final int triggeredById;
  final int? orderId;
  final double latitude;
  final double longitude;
  final double? lastLatitude;
  final double? lastLongitude;
  final SosStatus status;
  final int contactsNotified;
  final bool policeNotified;
  final DateTime createdAt;
  final DateTime? resolvedAt;

  const SosIncidentModel({
    required this.id,
    required this.triggeredBy,
    required this.triggeredById,
    this.orderId,
    required this.latitude,
    required this.longitude,
    this.lastLatitude,
    this.lastLongitude,
    required this.status,
    required this.contactsNotified,
    required this.policeNotified,
    required this.createdAt,
    this.resolvedAt,
  });

  factory SosIncidentModel.fromJson(Map<String, dynamic> json) =>
      SosIncidentModel(
        id: json['id'] as int,
        triggeredBy: SosTriggeredByX.fromString(json['triggeredBy'] as String),
        triggeredById: json['triggeredById'] as int,
        orderId: json['orderId'] as int?,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        lastLatitude: (json['lastLatitude'] as num?)?.toDouble(),
        lastLongitude: (json['lastLongitude'] as num?)?.toDouble(),
        status: SosStatusX.fromString(json['status'] as String),
        contactsNotified: json['contactsNotified'] as int,
        policeNotified: json['policeNotified'] as bool,
        createdAt: DateTime.parse(json['createdAt'] as String),
        resolvedAt: json['resolvedAt'] != null
            ? DateTime.parse(json['resolvedAt'] as String)
            : null,
      );

  @override
  List<Object?> get props => [
        id,
        triggeredBy,
        triggeredById,
        orderId,
        latitude,
        longitude,
        lastLatitude,
        lastLongitude,
        status,
        contactsNotified,
        policeNotified,
        createdAt,
        resolvedAt,
      ];
}
