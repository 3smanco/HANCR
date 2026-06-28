import 'package:equatable/equatable.dart';
import '../../core/models/order_model.dart';

abstract class OrderEvent extends Equatable {
  const OrderEvent();
  @override
  List<Object?> get props => [];
}

class OrderCheckActiveRequested extends OrderEvent {
  const OrderCheckActiveRequested();
}

class OrderSubscriptionStartRequested extends OrderEvent {
  const OrderSubscriptionStartRequested();
}

/// "سحب" الطلب الوارد المتاح صراحةً — يُطلَق عند نقر إشعار FCM أو الإقلاع
/// البارد، حيث يكون اشتراك `newOrderAvailable` قد فات الحدث.
class OrderIncomingCheckRequested extends OrderEvent {
  const OrderIncomingCheckRequested();
}

class NewOrderReceived extends OrderEvent {
  final DriverOrderModel order;
  const NewOrderReceived(this.order);
  @override
  List<Object?> get props => [order];
}

class OrderUpdatedFromSubscription extends OrderEvent {
  final DriverOrderModel order;
  const OrderUpdatedFromSubscription(this.order);
  @override
  List<Object?> get props => [order];
}

class OrderAcceptRequested extends OrderEvent {
  final int orderId;
  const OrderAcceptRequested(this.orderId);
  @override
  List<Object?> get props => [orderId];
}

class OrderDeclineRequested extends OrderEvent {
  const OrderDeclineRequested();
}

class OrderArrivedAtPickupRequested extends OrderEvent {
  final int orderId;
  const OrderArrivedAtPickupRequested(this.orderId);
  @override
  List<Object?> get props => [orderId];
}

class OrderStartRideRequested extends OrderEvent {
  final int orderId;
  const OrderStartRideRequested(this.orderId);
  @override
  List<Object?> get props => [orderId];
}

class OrderFinishRideRequested extends OrderEvent {
  final int orderId;
  const OrderFinishRideRequested(this.orderId);
  @override
  List<Object?> get props => [orderId];
}

class OrderCancelRequested extends OrderEvent {
  final int orderId;
  const OrderCancelRequested(this.orderId);
  @override
  List<Object?> get props => [orderId];
}
