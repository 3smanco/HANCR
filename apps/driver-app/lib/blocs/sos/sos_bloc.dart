import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/sos_gql.dart';
import '../../core/models/sos_model.dart';
import 'sos_event.dart';
import 'sos_state.dart';

/// SosBloc — مرآة لـ rider-app/SosBloc لكن يستخدم endpoints السائق.
class SosBloc extends Bloc<SosEvent, SosState> {
  SosBloc() : super(const SosInitial()) {
    on<SosLoadRequested>(_onLoad);
    on<SosContactAdded>(_onAddContact);
    on<SosContactRemoved>(_onRemoveContact);
    on<SosTriggered>(_onTrigger);
    on<SosCancelled>(_onCancel);
    on<SosToastCleared>(_onToastCleared);
  }

  void _onToastCleared(SosToastCleared e, Emitter<SosState> emit) {
    final s = state;
    if (s is SosLoaded && s.toast != null) {
      emit(s.copyWith(clearToast: true));
    }
  }

  Future<void> _onLoad(SosLoadRequested e, Emitter<SosState> emit) async {
    emit(const SosLoading());
    try {
      final client = await GraphQLClientManager.get();
      final contactsRes = await client.query(QueryOptions(
        document: gql(myDriverEmergencyContactsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (contactsRes.hasException) throw contactsRes.exception!;
      final contacts = (contactsRes.data!['myDriverEmergencyContacts'] as List)
          .cast<Map<String, dynamic>>()
          .map(EmergencyContactModel.fromJson)
          .toList();

      final incRes = await client.query(QueryOptions(
        document: gql(myActiveDriverSosQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      SosIncidentModel? active;
      if (!incRes.hasException && incRes.data?['myActiveDriverSos'] != null) {
        active = SosIncidentModel.fromJson(
          incRes.data!['myActiveDriverSos'] as Map<String, dynamic>,
        );
      }

      emit(SosLoaded(contacts: contacts, activeIncident: active));
    } catch (e) {
      emit(SosError('فشل تحميل جهات الطوارئ: $e'));
    }
  }

  Future<void> _onAddContact(
    SosContactAdded event,
    Emitter<SosState> emit,
  ) async {
    final s = state;
    if (s is! SosLoaded) return;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(addDriverEmergencyContactMutation),
        variables: {
          'input': {
            'name': event.name,
            'phoneNumber': event.phoneNumber,
            'relation': event.relation.gqlValue,
            'autoShareTrips': event.autoShareTrips,
            'priority': event.priority,
          },
        },
      ));
      if (result.hasException) throw result.exception!;
      final contact = EmergencyContactModel.fromJson(
        result.data!['addDriverEmergencyContact'] as Map<String, dynamic>,
      );
      emit(s.copyWith(
        contacts: [...s.contacts, contact],
        toast: 'تمت إضافة ${contact.name} بنجاح',
      ));
    } catch (e) {
      emit(s.copyWith(toast: 'فشل إضافة الجهة: ${_extractError(e)}'));
    }
  }

  Future<void> _onRemoveContact(
    SosContactRemoved event,
    Emitter<SosState> emit,
  ) async {
    final s = state;
    if (s is! SosLoaded) return;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(removeDriverEmergencyContactMutation),
        variables: {'contactId': event.contactId},
      ));
      if (result.hasException) throw result.exception!;
      emit(s.copyWith(
        contacts: s.contacts.where((c) => c.id != event.contactId).toList(),
        toast: 'تم حذف الجهة',
      ));
    } catch (e) {
      emit(s.copyWith(toast: 'فشل الحذف: ${_extractError(e)}'));
    }
  }

  Future<void> _onTrigger(
    SosTriggered event,
    Emitter<SosState> emit,
  ) async {
    final s = state;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(triggerDriverSosMutation),
        variables: {
          'input': {
            'latitude': event.latitude,
            'longitude': event.longitude,
            if (event.orderId != null) 'orderId': event.orderId,
          },
        },
      ));
      if (result.hasException) throw result.exception!;
      final inc = SosIncidentModel.fromJson(
        result.data!['triggerDriverSos'] as Map<String, dynamic>,
      );
      if (s is SosLoaded) {
        emit(s.copyWith(
          activeIncident: inc,
          toast: 'تم تفعيل الطوارئ — تم إشعار ${inc.contactsNotified} جهة',
        ));
      } else {
        add(const SosLoadRequested());
      }
    } catch (e) {
      if (s is SosLoaded) {
        emit(s.copyWith(toast: 'فشل تفعيل الطوارئ: ${_extractError(e)}'));
      } else {
        emit(SosError('فشل تفعيل الطوارئ: ${_extractError(e)}'));
      }
    }
  }

  Future<void> _onCancel(
    SosCancelled event,
    Emitter<SosState> emit,
  ) async {
    final s = state;
    if (s is! SosLoaded) return;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(cancelDriverSosMutation),
        variables: {'incidentId': event.incidentId},
      ));
      if (result.hasException) throw result.exception!;
      emit(s.copyWith(
        clearIncident: true,
        toast: 'تم إلغاء الإنذار',
      ));
    } catch (e) {
      emit(s.copyWith(toast: 'فشل الإلغاء: ${_extractError(e)}'));
    }
  }

  String _extractError(Object e) {
    final s = e.toString();
    final m = RegExp(r'"message"\s*:\s*"([^"]+)"').firstMatch(s);
    return m?.group(1) ?? s;
  }
}
