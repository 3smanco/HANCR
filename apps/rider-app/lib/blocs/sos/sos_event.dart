import 'package:equatable/equatable.dart';
import '../../core/models/sos_model.dart';

abstract class SosEvent extends Equatable {
  const SosEvent();
  @override
  List<Object?> get props => [];
}

/// تحميل جهات الطوارئ + حادثة نشطة
class SosLoadRequested extends SosEvent {
  const SosLoadRequested();
}

class SosContactAdded extends SosEvent {
  final String name;
  final String phoneNumber;
  final EmergencyContactRelation relation;
  final bool autoShareTrips;
  final int priority;

  const SosContactAdded({
    required this.name,
    required this.phoneNumber,
    required this.relation,
    this.autoShareTrips = false,
    this.priority = 0,
  });

  @override
  List<Object?> get props =>
      [name, phoneNumber, relation, autoShareTrips, priority];
}

class SosContactRemoved extends SosEvent {
  final int contactId;
  const SosContactRemoved(this.contactId);
  @override
  List<Object?> get props => [contactId];
}

/// 🚨 تفعيل SOS
class SosTriggered extends SosEvent {
  final double latitude;
  final double longitude;
  final int? orderId;
  const SosTriggered({
    required this.latitude,
    required this.longitude,
    this.orderId,
  });
  @override
  List<Object?> get props => [latitude, longitude, orderId];
}

/// إلغاء حادثة (false alarm)
class SosCancelled extends SosEvent {
  final int incidentId;
  const SosCancelled(this.incidentId);
  @override
  List<Object?> get props => [incidentId];
}

/// مسح الـ toast
class SosToastCleared extends SosEvent {
  const SosToastCleared();
}
