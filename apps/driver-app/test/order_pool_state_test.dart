import 'package:flutter_test/flutter_test.dart';
import 'package:hancr_driver/blocs/order/order_state.dart';
import 'package:hancr_driver/core/models/order_model.dart';

Map<String, dynamic> _orderJson({
  required int id,
  required String status,
  int? poolGroupId,
}) => {
  'id': id,
  'type': 'Ride',
  'status': status,
  'riderId': 10 + id,
  'riderName': 'Rider $id',
  'riderRating': 5,
  'points': [
    {'lat': 25.2, 'lng': 51.5},
    {'lat': 25.3, 'lng': 51.6},
  ],
  'addresses': ['Pickup', 'Destination'],
  'distanceBest': 1000,
  'durationBest': 600,
  'costBest': 20,
  'costAfterCoupon': 20,
  'currency': 'QAR',
  'paymentMode': 'Cash',
  'quietRide': false,
  'audioOff': false,
  'numberMasked': false,
  'isBidOrder': false,
  'poolGroupId': poolGroupId,
  'createdOn': '2026-06-25T00:00:00.000Z',
};

void main() {
  test('DriverOrderModel reads PascalCase status and pool group', () {
    final order = DriverOrderModel.fromJson(
      _orderJson(id: 1, status: 'DriverAccepted', poolGroupId: 99),
    );

    expect(order.status, OrderStatus.driverAccepted);
    expect(order.poolGroupId, 99);
    expect(order.isSharedPool, isTrue);
  });

  test('OrderActive can carry multiple active share orders', () {
    final first = DriverOrderModel.fromJson(
      _orderJson(id: 1, status: 'DriverAccepted', poolGroupId: 99),
    );
    final second = DriverOrderModel.fromJson(
      _orderJson(id: 2, status: 'Arrived', poolGroupId: 99),
    );
    final completed = DriverOrderModel.fromJson(
      _orderJson(id: 3, status: 'WaitingForReview', poolGroupId: 99),
    );

    final state = OrderActive(
      first,
      orders: [first, second],
      completedOrder: completed,
    );

    expect(state.activeOrders, [first, second]);
    expect(state.completedOrder, completed);
  });
}
