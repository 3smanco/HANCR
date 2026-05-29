import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/driver_gql.dart';
import 'location_event.dart';
import 'location_state.dart';

class LocationBloc extends Bloc<LocationEvent, LocationState> {
  StreamSubscription<Position>? _positionSub;
  Timer? _uploadTimer;

  double _lat = AppConfig.defaultLat;
  double _lng = AppConfig.defaultLng;
  double _heading = 0;

  LocationBloc() : super(const LocationIdle()) {
    on<LocationStartTracking>(_onStart);
    on<LocationStopTracking>(_onStop);
    on<LocationUpdated>(_onUpdate);
  }

  Future<void> _onStart(
    LocationStartTracking event,
    Emitter<LocationState> emit,
  ) async {
    await _positionSub?.cancel();
    _uploadTimer?.cancel();

    try {
      // Permission check
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        emit(const LocationError('Location permission permanently denied'));
        return;
      }

      // Start listening to GPS
      _positionSub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5,
        ),
      ).listen((pos) {
        _lat = pos.latitude;
        _lng = pos.longitude;
        _heading = pos.heading;
        add(LocationUpdated(lat: _lat, lng: _lng, heading: _heading));
      });

      // Upload every N seconds
      _uploadTimer = Timer.periodic(
        Duration(seconds: AppConfig.locationUpdateIntervalSeconds),
        (_) => _uploadLocation(),
      );

      emit(LocationTracking(lat: _lat, lng: _lng, heading: _heading));
    } catch (e) {
      emit(LocationError(e.toString()));
    }
  }

  Future<void> _onStop(
    LocationStopTracking event,
    Emitter<LocationState> emit,
  ) async {
    await _positionSub?.cancel();
    _positionSub = null;
    _uploadTimer?.cancel();
    _uploadTimer = null;
    emit(const LocationIdle());
  }

  void _onUpdate(LocationUpdated event, Emitter<LocationState> emit) {
    _lat = event.lat;
    _lng = event.lng;
    _heading = event.heading;
    emit(LocationTracking(lat: _lat, lng: _lng, heading: _heading));
  }

  Future<void> _uploadLocation() async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(
        MutationOptions(
          document: gql(updateLocationMutation),
          variables: {
            'input': {
              'lat': _lat,
              'lng': _lng,
              'heading': _heading,
            },
          },
        ),
      );
    } catch (_) {
      // Silent fail — location upload is best-effort
    }
  }

  @override
  Future<void> close() async {
    await _positionSub?.cancel();
    _uploadTimer?.cancel();
    return super.close();
  }
}
