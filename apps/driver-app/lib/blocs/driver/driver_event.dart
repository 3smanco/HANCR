import 'package:equatable/equatable.dart';

abstract class DriverEvent extends Equatable {
  const DriverEvent();
  @override
  List<Object?> get props => [];
}

class DriverLoadRequested extends DriverEvent {
  const DriverLoadRequested();
}

class DriverUpdateRequested extends DriverEvent {
  final String? firstName;
  final String? lastName;
  final String? carBrand;
  final String? carModel;
  final String? carColor;
  final String? plateNumber;
  final int? carYear;

  const DriverUpdateRequested({
    this.firstName,
    this.lastName,
    this.carBrand,
    this.carModel,
    this.carColor,
    this.plateNumber,
    this.carYear,
  });

  @override
  List<Object?> get props => [
        firstName, lastName, carBrand, carModel,
        carColor, plateNumber, carYear,
      ];
}

class DriverStarsLoadRequested extends DriverEvent {
  const DriverStarsLoadRequested();
}
