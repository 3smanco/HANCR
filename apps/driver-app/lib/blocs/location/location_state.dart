import 'package:equatable/equatable.dart';

abstract class LocationState extends Equatable {
  const LocationState();
  @override
  List<Object?> get props => [];
}

class LocationIdle extends LocationState {
  const LocationIdle();
}

class LocationTracking extends LocationState {
  final double lat;
  final double lng;
  final double heading;
  const LocationTracking({
    required this.lat,
    required this.lng,
    required this.heading,
  });
  @override
  List<Object?> get props => [lat, lng, heading];
}

class LocationError extends LocationState {
  final String message;
  const LocationError(this.message);
  @override
  List<Object?> get props => [message];
}
