import 'package:equatable/equatable.dart';
import '../../core/models/rider_model.dart';

abstract class RiderState extends Equatable {
  const RiderState();
  @override
  List<Object?> get props => [];
}

class RiderInitial extends RiderState {
  const RiderInitial();
}

class RiderLoading extends RiderState {
  const RiderLoading();
}

class RiderLoaded extends RiderState {
  final RiderModel rider;
  const RiderLoaded(this.rider);
  @override
  List<Object?> get props => [rider];
}

class RiderError extends RiderState {
  final String message;
  const RiderError(this.message);
  @override
  List<Object?> get props => [message];
}
