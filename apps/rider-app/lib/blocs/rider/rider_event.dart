import 'package:equatable/equatable.dart';

abstract class RiderEvent extends Equatable {
  const RiderEvent();
  @override
  List<Object?> get props => [];
}

class RiderLoadRequested extends RiderEvent {
  const RiderLoadRequested();
}

class RiderUpdateRequested extends RiderEvent {
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? avatarUrl;

  const RiderUpdateRequested({
    this.firstName,
    this.lastName,
    this.email,
    this.avatarUrl,
  });

  @override
  List<Object?> get props => [firstName, lastName, email, avatarUrl];
}
