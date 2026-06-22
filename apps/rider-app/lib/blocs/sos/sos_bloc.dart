import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/sos_gql.dart';
import '../../core/models/sos_model.dart';
import 'sos_event.dart';
import 'sos_state.dart';

class SosBloc extends Bloc<SosEvent, SosState> {
  /// مؤقّت بثّ الموقع الحيّ (كل 3ث) أثناء حادثة نشطة.
  Timer? _telemetry;

  SosBloc() : super(const SosInitial()) {
    on<SosLoadRequested>(_onLoad);
    on<SosContactAdded>(_onAddContact);
    on<SosContactRemoved>(_onRemoveContact);
    on<SosTriggered>(_onTrigger);
    on<SosCancelled>(_onCancel);
    on<SosToastCleared>(_onToastCleared);
  }

  /// يبدأ بثّ موقع الراكب كل 3ث إلى الخادم (يُلتقط في خريطة الأدمن الحيّة).
  void _startTelemetry() {
    if (_telemetry != null) return;
    _telemetry = Timer.periodic(const Duration(seconds: 3), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
          ),
        ).timeout(const Duration(seconds: 5));
        final client = await GraphQLClientManager.get();
        await client.mutate(MutationOptions(
          document: gql(updateSosLocationMutation),
          variables: {'latitude': pos.latitude, 'longitude': pos.longitude},
        ));
      } catch (_) {
        // تجاهل أخطاء عابرة — لا نوقف البثّ.
      }
    });
  }

  void _stopTelemetry() {
    _telemetry?.cancel();
    _telemetry = null;
  }

  @override
  Future<void> close() {
    _stopTelemetry();
    return super.close();
  }

  void _onToastCleared(SosToastCleared e, Emitter<SosState> emit) {
    final s = state;
    if (s is SosLoaded && s.toast != null) {
      emit(s.copyWith(clearToast: true));
    }
  }

  // ── تحميل ─────────────────────────────────────────────────────────────────
  Future<void> _onLoad(
    SosLoadRequested event,
    Emitter<SosState> emit,
  ) async {
    emit(const SosLoading());
    try {
      final client = await GraphQLClientManager.get();
      final contactsRes = await client.query(QueryOptions(
        document: gql(myEmergencyContactsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (contactsRes.hasException) throw contactsRes.exception!;
      final contacts = (contactsRes.data!['myEmergencyContacts'] as List)
          .cast<Map<String, dynamic>>()
          .map(EmergencyContactModel.fromJson)
          .toList();

      final incRes = await client.query(QueryOptions(
        document: gql(myActiveSosQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      SosIncidentModel? active;
      if (!incRes.hasException && incRes.data?['myActiveSos'] != null) {
        active = SosIncidentModel.fromJson(
          incRes.data!['myActiveSos'] as Map<String, dynamic>,
        );
      }

      emit(SosLoaded(contacts: contacts, activeIncident: active));
      if (active != null) {
        _startTelemetry();
      } else {
        _stopTelemetry();
      }
    } catch (e) {
      emit(SosError('فشل تحميل جهات الطوارئ: $e'));
    }
  }

  // ── إضافة جهة طوارئ ──────────────────────────────────────────────────────
  Future<void> _onAddContact(
    SosContactAdded event,
    Emitter<SosState> emit,
  ) async {
    final s = state;
    if (s is! SosLoaded) return;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(addEmergencyContactMutation),
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
        result.data!['addEmergencyContact'] as Map<String, dynamic>,
      );
      emit(s.copyWith(
        contacts: [...s.contacts, contact],
        toast: 'تمت إضافة ${contact.name} بنجاح',
      ));
    } catch (e) {
      emit(s.copyWith(toast: 'فشل إضافة الجهة: ${_extractError(e)}'));
    }
  }

  // ── حذف جهة طوارئ ──────────────────────────────────────────────────────
  Future<void> _onRemoveContact(
    SosContactRemoved event,
    Emitter<SosState> emit,
  ) async {
    final s = state;
    if (s is! SosLoaded) return;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(removeEmergencyContactMutation),
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

  // ── 🚨 تفعيل SOS ────────────────────────────────────────────────────────
  Future<void> _onTrigger(
    SosTriggered event,
    Emitter<SosState> emit,
  ) async {
    final s = state;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(triggerSosMutation),
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
        result.data!['triggerSos'] as Map<String, dynamic>,
      );
      if (s is SosLoaded) {
        emit(s.copyWith(
          activeIncident: inc,
          toast: 'تم تفعيل الطوارئ — تم إشعار ${inc.contactsNotified} جهة',
        ));
        _startTelemetry();
      } else {
        // إن لم تكن الحالة محمَّلة، حمِّلها بعد التفعيل.
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

  // ── إلغاء SOS ────────────────────────────────────────────────────────────
  Future<void> _onCancel(
    SosCancelled event,
    Emitter<SosState> emit,
  ) async {
    final s = state;
    if (s is! SosLoaded) return;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(cancelSosMutation),
        variables: {'incidentId': event.incidentId},
      ));
      if (result.hasException) throw result.exception!;
      _stopTelemetry();
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
