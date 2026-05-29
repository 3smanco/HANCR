import 'package:equatable/equatable.dart';
import '../../core/models/order_model.dart';

abstract class OrderState extends Equatable {
  const OrderState();
  @override
  List<Object?> get props => [];
}

/// No active order — driver is waiting/online
class OrderIdle extends OrderState {
  const OrderIdle();
}

/// Loading state
class OrderLoading extends OrderState {
  const OrderLoading();
}

/// A NEW order has come in — show accept/decline sheet
class OrderIncoming extends OrderState {
  final DriverOrderModel order;
  const OrderIncoming(this.order);
  @override
  List<Object?> get props => [order];
}

/// Driver accepted and is navigating to rider
class OrderActive extends OrderState {
  final DriverOrderModel order;
  const OrderActive(this.order);
  @override
  List<Object?> get props => [order];
}

/// Ride is finished / canceled — show summary briefly
class OrderCompleted extends OrderState {
  final DriverOrderModel order;
  const OrderCompleted(this.order);
  @override
  List<Object?> get props => [order];
}

class OrderError extends OrderState {
  final String message;
  const OrderError(this.message);
  @override
  List<Object?> get props => [message];
}
