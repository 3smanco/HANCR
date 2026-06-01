import 'package:equatable/equatable.dart';
import '../../core/models/order_model.dart';

abstract class OrderState extends Equatable {
  const OrderState();
  @override
  List<Object?> get props => [];
}

class OrderInitial extends OrderState {
  const OrderInitial();
}

class OrderLoading extends OrderState {
  const OrderLoading();
}

/// No active order
class OrderIdle extends OrderState {
  const OrderIdle();
}

/// Order is active and being tracked
class OrderActive extends OrderState {
  final OrderModel order;
  const OrderActive(this.order);
  @override
  List<Object?> get props => [order];
}

/// Order just created (transition state)
class OrderCreated extends OrderState {
  final OrderModel order;
  const OrderCreated(this.order);
  @override
  List<Object?> get props => [order];
}

/// Order scheduled for later (Booked) — not active yet
class OrderScheduled extends OrderState {
  final OrderModel order;
  const OrderScheduled(this.order);
  @override
  List<Object?> get props => [order];
}

/// Order completed — show rating screen
class OrderAwaitingReview extends OrderState {
  final OrderModel order;
  const OrderAwaitingReview(this.order);
  @override
  List<Object?> get props => [order];
}

/// Rating submitted
class OrderRatingSubmitted extends OrderState {
  const OrderRatingSubmitted();
}

/// History loaded
class OrderHistoryLoaded extends OrderState {
  final List<OrderModel> orders;
  final bool hasMore;
  const OrderHistoryLoaded({required this.orders, this.hasMore = false});
  @override
  List<Object?> get props => [orders, hasMore];
}

class OrderError extends OrderState {
  final String message;
  const OrderError(this.message);
  @override
  List<Object?> get props => [message];
}
