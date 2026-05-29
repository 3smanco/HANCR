import 'package:equatable/equatable.dart';
import '../../core/models/sos_model.dart';

abstract class SosState extends Equatable {
  const SosState();
  @override
  List<Object?> get props => [];
}

class SosInitial extends SosState {
  const SosInitial();
}

class SosLoading extends SosState {
  const SosLoading();
}

class SosLoaded extends SosState {
  final List<EmergencyContactModel> contacts;
  final SosIncidentModel? activeIncident;
  final String? toast;

  const SosLoaded({
    required this.contacts,
    this.activeIncident,
    this.toast,
  });

  SosLoaded copyWith({
    List<EmergencyContactModel>? contacts,
    SosIncidentModel? activeIncident,
    String? toast,
    bool clearIncident = false,
    bool clearToast = false,
  }) {
    return SosLoaded(
      contacts: contacts ?? this.contacts,
      activeIncident:
          clearIncident ? null : (activeIncident ?? this.activeIncident),
      toast: clearToast ? null : (toast ?? this.toast),
    );
  }

  @override
  List<Object?> get props => [contacts, activeIncident, toast];
}

class SosError extends SosState {
  final String message;
  const SosError(this.message);
  @override
  List<Object?> get props => [message];
}
