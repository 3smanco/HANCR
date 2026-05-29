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
        QueryOptions(document: gql(driverActiveOrderQuery)),
      );
      if (!result.hasException) {
        final data =
            result.data?['driverActiveOrder'] as Map<String, dynamic>?;
        if (data != null) {
          emit(OrderActive(DriverOrderModel.fromJson(data)));
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
          final order =
              DriverOrderModel.fromJson(data as Map<String, dynamic>);
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
          final order =
              DriverOrderModel.fromJson(data as Map<String, dynamic>);
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
      emit(OrderCompleted(order));
    } else if (order.status.isActive) {
      emit(OrderActive(order));
    }
  }

  Future<void> _onAccept(
    OrderAcceptRequested event,
    Emitter<OrderState> emit,
  ) async {
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
        emit(OrderError(
          result.exception?.graphqlErrors.firstOrNull?.message ??
              'Accept failed',
        ));
        return;
      }
      final data =
          result.data?['acceptOrder'] as Map<String, dynamic>?;
      if (data != null) {
        emit(OrderActive(DriverOrderModel.fromJson(data)));
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
  ) async =>
      _mutateAndUpdate(
        emit,
        mutation: arrivedAtPickupMutation,
        key: 'arrivedAtPickup',
        orderId: event.orderId,
      );

  Future<void> _onStart(
    OrderStartRideRequested event,
    Emitter<OrderState> emit,
  ) async =>
      _mutateAndUpdate(
        emit,
        mutation: startRideMutation,
        key: 'startRide',
        orderId: event.orderId,
      );

  Future<void> _onFinish(
    OrderFinishRideRequested event,
    Emitter<OrderState> emit,
  ) async =>
      _mutateAndUpdate(
        emit,
        mutation: finishRideMutation,
        key: 'finishRide',
        orderId: event.orderId,
      );

  Future<void> _onCancel(
    OrderCancelRequested event,
    Emitter<OrderState> emit,
  ) async =>
      _mutateAndUpdate(
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
        emit(OrderCompleted(order));
      } else {
        emit(OrderActive(order));
      }
    } catch (_) {}
  }

  @override
  Future<void> close() async {
    await _newOrderSub?.cancel();
    await _orderUpdateSub?.cancel();
    return super.close();
  }
}
