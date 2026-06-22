import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/models/rider_model.dart';
import 'rider_event.dart';
import 'rider_state.dart';

class RiderBloc extends Bloc<RiderEvent, RiderState> {
  RiderBloc() : super(const RiderInitial()) {
    on<RiderLoadRequested>(_onLoad);
    on<RiderUpdateRequested>(_onUpdate);
  }

  Future<void> _onLoad(
    RiderLoadRequested event,
    Emitter<RiderState> emit,
  ) async {
    emit(const RiderLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.query(
        QueryOptions(document: gql(meQuery)),
      );
      if (result.hasException) {
        emit(RiderError(result.exception?.graphqlErrors.firstOrNull?.message ??
            'Failed to load profile'));
        return;
      }
      final data = result.data?['me'] as Map<String, dynamic>?;
      if (data == null) {
        emit(const RiderError('Profile not found'));
        return;
      }
      emit(RiderLoaded(RiderModel.fromJson(data)));
    } catch (e) {
      emit(RiderError(e.toString()));
    }
  }

  Future<void> _onUpdate(
    RiderUpdateRequested event,
    Emitter<RiderState> emit,
  ) async {
    final current = state;
    if (current is! RiderLoaded) return;

    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(updateProfileMutation),
          variables: {
            'input': {
              if (event.firstName != null) 'firstName': event.firstName,
              if (event.lastName != null) 'lastName': event.lastName,
              if (event.email != null) 'email': event.email,
              if (event.avatarUrl != null) 'avatarUrl': event.avatarUrl,
            },
          },
        ),
      );
      if (result.hasException) return;
      final updated = current.rider.copyWith(
        firstName: event.firstName,
        lastName: event.lastName,
        email: event.email,
        avatarUrl: event.avatarUrl,
      );
      emit(RiderLoaded(updated));
    } catch (_) {}
  }
}
