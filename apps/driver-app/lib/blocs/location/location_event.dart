import 'package:equatable/equatable.dart';

abstract class LocationEvent extends Equatable {
  const LocationEvent();
  @override
  List<Object?> get props => [];
}

class LocationStartTracking extends LocationEvent {
  const LocationStartTracking();
}

class LocationStopTracking extends LocationEvent {
  const LocationStopTracking();
}

class LocationUpdated extends LocationEvent {
  final double lat;
  final double lng;
  final double heading;
  const LocationUpdated({
    required this.lat,
    required this.lng,
    required this.heading,
  });
  @override
  List<Object?> get props => [lat, lng, heading];
}
