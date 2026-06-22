import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/tracking_gql.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────────

class DriverLocation extends Equatable {
  final int driverId;
  final double lat;
  final double lng;
  final int heading;
  final DateTime updatedAt;

  const DriverLocation({
    required this.driverId,
    required this.lat,
    required this.lng,
    required this.heading,
    required this.updatedAt,
  });

  factory DriverLocation.fromJson(Map<String, dynamic> json) => DriverLocation(
        driverId: json['driverId'] as int,
        lat: (json['lat'] as num).toDouble(),
        lng: (json['lng'] as num).toDouble(),
        heading: json['heading'] as int,
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );

  @override
  List<Object?> get props => [driverId, lat, lng, heading, updatedAt];
}

// ─────────────────────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────────────────────

abstract class TrackingEvent extends Equatable {
  const TrackingEvent();
  @override
  List<Object?> get props => [];
}

/// بدء تتبع سائق معيَّن (يفتح subscription)
class TrackingStarted extends TrackingEvent {
  final int driverId;
  const TrackingStarted(this.driverId);
  @override
  List<Object?> get props => [driverId];
}

/// إيقاف تتبع
class TrackingStopped extends TrackingEvent {
  const TrackingStopped();
}

/// تحديث موقع من الـ subscription (internal)
class _TrackingLocationReceived extends TrackingEvent {
  final DriverLocation location;
  const _TrackingLocationReceived(this.location);
  @override
  List<Object?> get props => [location];
}

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

abstract class TrackingState extends Equatable {
  const TrackingState();
  @override
  List<Object?> get props => [];
}

class TrackingIdle extends TrackingState {
  const TrackingIdle();
}

class TrackingActive extends TrackingState {
  final int driverId;
  final DriverLocation? lastLocation;
  const TrackingActive({required this.driverId, this.lastLocation});
  @override
  List<Object?> get props => [driverId, lastLocation];
}

class TrackingError extends TrackingState {
  final String message;
  const TrackingError(this.message);
  @override
  List<Object?> get props => [message];
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloc
// ─────────────────────────────────────────────────────────────────────────────

class TrackingBloc extends Bloc<TrackingEvent, TrackingState> {
  StreamSubscription<QueryResult<Object?>>? _sub;

  TrackingBloc() : super(const TrackingIdle()) {
    on<TrackingStarted>(_onStart);
    on<TrackingStopped>(_onStop);
    on<_TrackingLocationReceived>(_onLocationReceived);
  }

  Future<void> _onStart(
    TrackingStarted event,
    Emitter<TrackingState> emit,
  ) async {
    await _sub?.cancel();
    emit(TrackingActive(driverId: event.driverId));

    try {
      final client = await GraphQLClientManager.get();
      _sub = client
          .subscribe(SubscriptionOptions(
        document: gql(driverLocationUpdatedSubscription),
        variables: {'driverId': event.driverId},
      ))
          .listen(
        (result) {
          final data =
              result.data?['driverLocationUpdated'] as Map<String, dynamic>?;
          if (data != null) {
            add(_TrackingLocationReceived(DriverLocation.fromJson(data)));
          }
        },
        onError: (Object e) {
          add(const TrackingStopped());
        },
      );
    } catch (e) {
      emit(TrackingError('فشل بدء التتبع: $e'));
    }
  }

  Future<void> _onStop(
    TrackingStopped event,
    Emitter<TrackingState> emit,
  ) async {
    await _sub?.cancel();
    _sub = null;
    emit(const TrackingIdle());
  }

  void _onLocationReceived(
    _TrackingLocationReceived event,
    Emitter<TrackingState> emit,
  ) {
    final s = state;
    if (s is TrackingActive) {
      emit(TrackingActive(
        driverId: s.driverId,
        lastLocation: event.location,
      ));
    }
  }

  @override
  Future<void> close() async {
    await _sub?.cancel();
    return super.close();
  }
}
