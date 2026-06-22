import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/order_gql.dart';
import '../../core/models/order_model.dart';
import 'order_event.dart';
import 'order_state.dart';

class OrderBloc extends Bloc<OrderEvent, OrderState> {
  StreamSubscription<QueryResult<Object?>>? _sub;

  OrderBloc() : super(const OrderInitial()) {
    on<OrderActiveCheckRequested>(_onActiveCheck);
    on<OrderCreateRequested>(_onCreate);
    on<OrderCancelRequested>(_onCancel);
    on<OrderRateDriverRequested>(_onRate);
    on<OrderUpdatedFromSubscription>(_onSubUpdate);
    on<OrderSubscriptionStart>(_onSubStart);
    on<OrderSubscriptionStop>(_onSubStop);
    on<OrderHistoryRequested>(_onHistory);
  }

  // ── Active Order Check ────────────────────────────────────────────────────
  Future<void> _onActiveCheck(
    OrderActiveCheckRequested event,
    Emitter<OrderState> emit,
  ) async {
    emit(const OrderLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.query(
        QueryOptions(document: gql(activeOrderQuery)),
      );
      final data = result.data?['activeOrder'] as Map<String, dynamic>?;
      if (data == null) {
        emit(const OrderIdle());
      } else {
        final order = OrderModel.fromJson(data);
        if (order.status.awaitingReview) {
          emit(OrderAwaitingReview(order));
        } else if (order.status.isActive) {
          emit(OrderActive(order));
          add(const OrderSubscriptionStart());
        } else {
          emit(const OrderIdle());
        }
      }
    } catch (_) {
      emit(const OrderIdle());
    }
  }

  // ── Create Order ──────────────────────────────────────────────────────────
  Future<void> _onCreate(
    OrderCreateRequested event,
    Emitter<OrderState> emit,
  ) async {
    emit(const OrderLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(createOrderMutation),
          variables: {
            'input': {
              'points': [
                event.origin.toJson(),
                ...event.stops.map((s) => s.toJson()),
                event.destination.toJson(),
              ],
              'addresses': [
                event.originAddress,
                ...event.stopAddresses,
                event.destinationAddress,
              ],
              'serviceId': event.service.id,
              'regionId': event.regionId,
              'quietRide': event.quietRide,
              'audioOff': event.audioOff,
              'numberMasked': event.numberMasked,
              if (event.receiverName != null)
                'receiverName': event.receiverName,
              if (event.receiverPhone != null)
                'receiverPhone': event.receiverPhone,
              if (event.bookedHours != null) 'bookedHours': event.bookedHours,
              if (event.scheduledAt != null)
                'scheduledAt': event.scheduledAt!.toUtc().toIso8601String(),
              if (event.couponCode != null && event.couponCode!.isNotEmpty)
                'couponCode': event.couponCode,
              if (event.paymentMode != null) 'paymentMode': event.paymentMode,
              if (event.familyMode) 'familyMode': true,
              if (event.nightShift) 'nightShift': true,
              if (event.preferredDriverId != null)
                'preferredDriverId': event.preferredDriverId,
            },
          },
        ),
      );
      if (result.hasException) {
        final msg = result.exception?.graphqlErrors.firstOrNull?.message ??
            'Failed to create order';
        emit(OrderError(msg));
        return;
      }
      final data = result.data?['createOrder'] as Map<String, dynamic>?;
      if (data == null) {
        emit(const OrderError('Order creation failed'));
        return;
      }
      final order = OrderModel.fromJson(data);
      // حجز مسبق (Booked) — لا يُتتبَّع الآن
      if (order.status == OrderStatus.booked) {
        emit(OrderScheduled(order));
        return;
      }
      emit(OrderActive(order));
      add(const OrderSubscriptionStart());
    } catch (e) {
      emit(OrderError(e.toString()));
    }
  }

  // ── Cancel Order ──────────────────────────────────────────────────────────
  Future<void> _onCancel(
    OrderCancelRequested event,
    Emitter<OrderState> emit,
  ) async {
    try {
      add(const OrderSubscriptionStop());
      final client = await GraphQLClientManager.get();
      await client.mutate(
        MutationOptions(
          document: gql(cancelOrderMutation),
          variables: {'orderId': event.orderId},
        ),
      );
      emit(const OrderIdle());
    } catch (_) {
      emit(const OrderIdle());
    }
  }

  // ── Rate Driver ───────────────────────────────────────────────────────────
  Future<void> _onRate(
    OrderRateDriverRequested event,
    Emitter<OrderState> emit,
  ) async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(
        MutationOptions(
          document: gql(rateDriverMutation),
          variables: {
            'input': {
              'orderId': event.orderId,
              'rating': event.rating,
              if (event.comment != null) 'comment': event.comment,
              if (event.tip != null) 'tip': event.tip,
            },
          },
        ),
      );
      emit(const OrderRatingSubmitted());
    } catch (_) {
      emit(const OrderRatingSubmitted());
    }
  }

  // ── Subscription Update ───────────────────────────────────────────────────
  Future<void> _onSubUpdate(
    OrderUpdatedFromSubscription event,
    Emitter<OrderState> emit,
  ) async {
    final order = event.order;
    if (order.status.awaitingReview) {
      add(const OrderSubscriptionStop());
      emit(OrderAwaitingReview(order));
    } else if (order.status.isFinished ||
        order.status == OrderStatus.riderCanceled ||
        order.status == OrderStatus.driverCanceled) {
      add(const OrderSubscriptionStop());
      emit(const OrderIdle());
    } else {
      emit(OrderActive(order));
    }
  }

  // ── Subscription ──────────────────────────────────────────────────────────
  Future<void> _onSubStart(
    OrderSubscriptionStart event,
    Emitter<OrderState> emit,
  ) async {
    await _sub?.cancel();
    try {
      final client = await GraphQLClientManager.get();
      final stream = client.subscribe(
        SubscriptionOptions(document: gql(orderUpdatedSubscription)),
      );
      _sub = stream.listen((result) {
        if (result.hasException) return;
        final data = result.data?['orderUpdated'] as Map<String, dynamic>?;
        if (data != null) {
          add(OrderUpdatedFromSubscription(OrderModel.fromJson(data)));
        }
      });
    } catch (_) {}
  }

  Future<void> _onSubStop(
    OrderSubscriptionStop event,
    Emitter<OrderState> emit,
  ) async {
    await _sub?.cancel();
    _sub = null;
  }

  // ── History ───────────────────────────────────────────────────────────────
  Future<void> _onHistory(
    OrderHistoryRequested event,
    Emitter<OrderState> emit,
  ) async {
    emit(const OrderLoading());
    try {
      final client = await GraphQLClientManager.get();
      const limit = 20;
      final result = await client.query(
        QueryOptions(
          document: gql(orderHistoryQuery),
          variables: {'limit': limit, 'offset': event.page * limit},
        ),
      );
      final list = (result.data?['orderHistory'] as List<dynamic>?) ?? [];
      final orders = list
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
      emit(OrderHistoryLoaded(
        orders: orders,
        hasMore: orders.length == limit,
      ));
    } catch (e) {
      emit(OrderError(e.toString()));
    }
  }

  @override
  Future<void> close() async {
    await _sub?.cancel();
    return super.close();
  }
}
