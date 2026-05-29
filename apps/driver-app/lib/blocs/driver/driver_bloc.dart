import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/driver_gql.dart';
import '../../core/models/driver_model.dart';
import '../../core/models/stars_model.dart';
import 'driver_event.dart';
import 'driver_state.dart';

class DriverBloc extends Bloc<DriverEvent, DriverState> {
  DriverBloc() : super(const DriverInitial()) {
    on<DriverLoadRequested>(_onLoad);
    on<DriverUpdateRequested>(_onUpdate);
    on<DriverStarsLoadRequested>(_onStars);
  }

  Future<void> _onLoad(
    DriverLoadRequested event,
    Emitter<DriverState> emit,
  ) async {
    emit(const DriverLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.query(
        QueryOptions(document: gql(driverMeQuery)),
      );
      if (result.hasException) {
        emit(DriverError(
          result.exception?.graphqlErrors.firstOrNull?.message ??
              'Failed to load profile',
        ));
        return;
      }
      final data = result.data?['driverMe'] as Map<String, dynamic>?;
      if (data == null) {
        emit(const DriverError('Profile not found'));
        return;
      }
      final driver = DriverModel.fromJson(data);

      // Also load stars
      final starsResult = await client.query(
        QueryOptions(document: gql(myStarsQuery)),
      );
      StarsModel? stars;
      if (!starsResult.hasException) {
        final sd =
            starsResult.data?['myStars'] as Map<String, dynamic>?;
        if (sd != null) stars = StarsModel.fromJson(sd);
      }

      emit(DriverLoaded(driver, stars: stars));
    } catch (e) {
      emit(DriverError(e.toString()));
    }
  }

  Future<void> _onUpdate(
    DriverUpdateRequested event,
    Emitter<DriverState> emit,
  ) async {
    final current = state;
    if (current is! DriverLoaded) return;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(updateDriverProfileMutation),
          variables: {
            'input': {
              if (event.firstName != null) 'firstName': event.firstName,
              if (event.lastName != null) 'lastName': event.lastName,
              if (event.carBrand != null) 'carBrand': event.carBrand,
              if (event.carModel != null) 'carModel': event.carModel,
              if (event.carColor != null) 'carColor': event.carColor,
              if (event.plateNumber != null) 'plateNumber': event.plateNumber,
              if (event.carYear != null) 'carYear': event.carYear,
            },
          },
        ),
      );
      if (result.hasException) return;
      final updated = current.driver.copyWith(
        firstName: event.firstName,
        lastName: event.lastName,
        carBrand: event.carBrand,
        carModel: event.carModel,
        carColor: event.carColor,
        plateNumber: event.plateNumber,
        carYear: event.carYear,
      );
      emit(DriverLoaded(updated, stars: current.stars));
    } catch (_) {}
  }

  Future<void> _onStars(
    DriverStarsLoadRequested event,
    Emitter<DriverState> emit,
  ) async {
    final current = state;
    if (current is! DriverLoaded) return;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.query(
        QueryOptions(document: gql(myStarsQuery)),
      );
      if (!result.hasException) {
        final sd =
            result.data?['myStars'] as Map<String, dynamic>?;
        if (sd != null) {
          emit(DriverLoaded(current.driver, stars: StarsModel.fromJson(sd)));
        }
      }
    } catch (_) {}
  }
}
