import 'package:equatable/equatable.dart';
import '../../core/models/driver_model.dart';
import '../../core/models/stars_model.dart';

abstract class DriverState extends Equatable {
  const DriverState();
  @override
  List<Object?> get props => [];
}

class DriverInitial extends DriverState {
  const DriverInitial();
}

class DriverLoading extends DriverState {
  const DriverLoading();
}

class DriverLoaded extends DriverState {
  final DriverModel driver;
  final StarsModel? stars;
  const DriverLoaded(this.driver, {this.stars});
  @override
  List<Object?> get props => [driver, stars];
}

class DriverError extends DriverState {
  final String message;
  const DriverError(this.message);
  @override
  List<Object?> get props => [message];
}
