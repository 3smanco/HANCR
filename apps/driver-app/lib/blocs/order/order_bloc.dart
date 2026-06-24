import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/order_gql.dart';
import '../../core/models/order_model.dart';
import 'order_event.dart';
import 'order_state.dart';

class OrderBloc extends Bloc<OrderEvent, OrderState> {
  StreamSubscription<QueryResult<Object?>>? _newOrderSub;
  StreamSubscription<QueryResult<Object?>>? _orderUpdateSub;

  OrderBloc() : super(const OrderIdle()) {
    on<OrderCheckActiveRequested>(_onCheckActive);
    on<OrderSubscriptionStartRequested>(_onSubStart);
    on<NewOrderReceived>(_onNewOrder);
    on<OrderUpdatedFromSubscription>(_onOrderUpdate);
    on<OrderAcceptRequested>(_onAccept);
    on<OrderDeclineRequested>(_onDecline);
    on<OrderArrivedAtPickupRequested>(_onArrived);
    on<OrderStartRideRequested>(_onStart);
    on<OrderFinishRideRequested>(_onFinish);
    on<OrderCancelRequested>(_onCancel);
  }

  Future<void> _onCheckActive(
    OrderCheckActiveRequested event,
    Emitter<OrderState> emit,
  ) async {
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.query(
        QueryOptions(document: gql(driverActiveOrdersQuery)),
      );
      if (!result.hasException) {
        final data = result.data?['driverActiveOrders'] as List<dynamic>?;
        final orders = _sortActiveOrders(
          (data ?? [])
              .map((e) => DriverOrderModel.fromJson(e as Map<String, dynamic>))
              .toList(),
        );
        if (orders.isNotEmpty) {
          emit(OrderActive(orders.first, orders: orders));
          return;
        }
      } else {
        final fallback = await client.query(
          QueryOptions(document: gql(driverActiveOrderQuery)),
        );
        final data =
            fallback.data?['driverActiveOrder'] as Map<String, dynamic>?;
        if (!fallback.hasException && data != null) {
          final order = DriverOrderModel.fromJson(data);
          emit(OrderActive(order, orders: [order]));
          return;
        }
      }
      emit(const OrderIdle());
    } catch (_) {
      emit(const OrderIdle());
    }
  }

  Future<void> _onSubStart(
    OrderSubscriptionStartRequested event,
    Emitter<OrderState> emit,
  ) async {
    await _newOrderSub?.cancel();
    await _orderUpdateSub?.cancel();

    try {
      final client = await GraphQLClientManager.get();

      // New orders coming in
      final newOrderStream = client.subscribe(
        SubscriptionOptions(document: gql(newOrderAvailableSubscription)),
      );
      _newOrderSub = newOrderStream.listen((result) {
        final data = result.data?['newOrderAvailable'];
        if (data != null) {
          final order = DriverOrderModel.fromJson(data as Map<String, dynamic>);
          add(NewOrderReceived(order));
        }
      });

      // Updates to active order
      final updateStream = client.subscribe(
        SubscriptionOptions(document: gql(driverOrderUpdatedSubscription)),
      );
      _orderUpdateSub = updateStream.listen((result) {
        final data = result.data?['driverOrderUpdated'];
        if (data != null) {
          final order = DriverOrderModel.fromJson(data as Map<String, dynamic>);
          add(OrderUpdatedFromSubscription(order));
        }
      });
    } catch (_) {}
  }

  void _onNewOrder(NewOrderReceived event, Emitter<OrderState> emit) {
    // Only surface incoming if driver isn't already on a ride
    if (state is OrderIdle) {
      emit(OrderIncoming(event.order));
    }
  }

  void _onOrderUpdate(
    OrderUpdatedFromSubscription event,
    Emitter<OrderState> emit,
  ) {
    final order = event.order;
    if (order.status.isFinished) {
      final remaining = _withoutOrder(state, order.id);
      if (remaining.isNotEmpty) {
        emit(
          OrderActive(
            remaining.first,
            orders: remaining,
            completedOrder: order,
          ),
        );
      } else {
        emit(OrderCompleted(order));
      }
    } else if (order.status.isActive) {
      final orders = _mergeActiveOrder(state, order);
      emit(OrderActive(orders.first, orders: orders));
    }
  }

  Future<void> _onAccept(
    OrderAcceptRequested event,
    Emitter<OrderState> emit,
  ) async {
    final previous = state is OrderActive
        ? (state as OrderActive).activeOrders
        : const <DriverOrderModel>[];
    emit(const OrderLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(acceptOrderMutation),
          variables: {'orderId': event.orderId},
        ),
      );
      if (result.hasException) {
        emit(
          OrderError(
            result.exception?.graphqlErrors.firstOrNull?.message ??
                'Accept failed',
          ),
        );
        return;
      }
      final data = result.data?['acceptOrder'] as Map<String, dynamic>?;
      if (data != null) {
        final order = DriverOrderModel.fromJson(data);
        final orders = _mergeOrderInto(previous, order);
        emit(OrderActive(orders.first, orders: orders));
      }
    } catch (e) {
      emit(OrderError(e.toString()));
    }
  }

  void _onDecline(OrderDeclineRequested event, Emitter<OrderState> emit) {
    emit(const OrderIdle());
  }

  Future<void> _onArrived(
    OrderArrivedAtPickupRequested event,
    Emitter<OrderState> emit,
  ) async => _mutateAndUpdate(
    emit,
    mutation: arrivedAtPickupMutation,
    key: 'arrivedAtPickup',
    orderId: event.orderId,
  );

  Future<void> _onStart(
    OrderStartRideRequested event,
    Emitter<OrderState> emit,
  ) async => _mutateAndUpdate(
    emit,
    mutation: startRideMutation,
    key: 'startRide',
    orderId: event.orderId,
  );

  Future<void> _onFinish(
    OrderFinishRideRequested event,
    Emitter<OrderState> emit,
  ) async => _mutateAndUpdate(
    emit,
    mutation: finishRideMutation,
    key: 'finishRide',
    orderId: event.orderId,
  );

  Future<void> _onCancel(
    OrderCancelRequested event,
    Emitter<OrderState> emit,
  ) async => _mutateAndUpdate(
    emit,
    mutation: driverCancelOrderMutation,
    key: 'driverCancelOrder',
    orderId: event.orderId,
  );

  Future<void> _mutateAndUpdate(
    Emitter<OrderState> emit, {
    required String mutation,
    required String key,
    required int orderId,
  }) async {
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(mutation),
          variables: {'orderId': orderId},
        ),
      );
      if (result.hasException) return;
      final data = result.data?[key] as Map<String, dynamic>?;
      if (data == null) return;
      final order = DriverOrderModel.fromJson(data);
      if (order.status.isFinished) {
        final remaining = _withoutOrder(state, order.id);
        if (remaining.isNotEmpty) {
          emit(
            OrderActive(
              remaining.first,
              orders: remaining,
              completedOrder: order,
            ),
          );
        } else {
          emit(OrderCompleted(order));
        }
      } else {
        final orders = _mergeActiveOrder(state, order);
        emit(OrderActive(orders.first, orders: orders));
      }
    } catch (_) {}
  }

  /// تأكيد تسليم أمانة عبر OTP — يُستدعى مباشرة من الواجهة لتمرير رسائل الخطأ.
  /// يُرجع رسالة خطأ عند الفشل، أو null عند النجاح.
  Future<String?> confirmDelivery(int orderId, String otp) async {
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(confirmDeliveryMutation),
          variables: {'orderId': orderId, 'otp': otp},
        ),
      );
      if (result.hasException) {
        return result.exception?.graphqlErrors.isNotEmpty == true
            ? result.exception!.graphqlErrors.first.message
            : 'فشل تأكيد التسليم';
      }
      final data = result.data?['confirmDelivery'] as Map<String, dynamic>?;
      if (data == null) return 'لا توجد بيانات';
      // إعادة فحص الطلب النشط لتحديث الحالة (مكتمل / بانتظار التقييم)
      add(const OrderCheckActiveRequested());
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  static List<DriverOrderModel> _sortActiveOrders(
    List<DriverOrderModel> orders,
  ) {
    final sorted = [...orders];
    sorted.sort((a, b) {
      final pool = (a.poolGroupId ?? a.id).compareTo(b.poolGroupId ?? b.id);
      if (pool != 0) return pool;
      return a.createdOn.compareTo(b.createdOn);
    });
    return sorted;
  }

  static List<DriverOrderModel> _mergeOrderInto(
    List<DriverOrderModel> current,
    DriverOrderModel order,
  ) {
    final next = [...current];
    final idx = next.indexWhere((o) => o.id == order.id);
    if (idx >= 0) {
      next[idx] = order;
    } else {
      next.add(order);
    }
    return _sortActiveOrders(next);
  }

  static List<DriverOrderModel> _mergeActiveOrder(
    OrderState state,
    DriverOrderModel order,
  ) {
    final current = state is OrderActive
        ? state.activeOrders
        : const <DriverOrderModel>[];
    return _mergeOrderInto(current, order);
  }

  static List<DriverOrderModel> _withoutOrder(OrderState state, int orderId) {
    if (state is! OrderActive) return const [];
    return _sortActiveOrders(
      state.activeOrders.where((o) => o.id != orderId).toList(),
    );
  }

  @override
  Future<void> close() async {
    await _newOrderSub?.cancel();
    await _orderUpdateSub?.cancel();
    return super.close();
  }
}
