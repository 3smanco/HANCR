import 'package:equatable/equatable.dart';
import '../../core/models/order_model.dart';
import '../../core/models/service_model.dart';

abstract class OrderEvent extends Equatable {
  const OrderEvent();
  @override
  List<Object?> get props => [];
}

class OrderActiveCheckRequested extends OrderEvent {
  const OrderActiveCheckRequested();
}

class OrderCreateRequested extends OrderEvent {
  final GeoPoint origin;
  final GeoPoint destination;
  final String originAddress;
  final String destinationAddress;
  final ServiceModel service;
  final int regionId;
  final bool quietRide;
  final bool audioOff;
  final bool numberMasked;
  final String? receiverName;
  final String? receiverPhone;
  final int? bookedHours;
  final DateTime? scheduledAt;
  final String? couponCode;
  final String? paymentMode;

  /// محطات وسيطة بين الانطلاق والوجهة (Multi-stop)
  final List<GeoPoint> stops;
  final List<String> stopAddresses;

  /// وضع العائلة — يفضّل سائقة وسلوكاً عائلياً
  final bool familyMode;

  /// G1 — وضع الليل: سعر ثابت + مشاركة موقع مع جهات الطوارئ
  final bool nightShift;

  /// سائق مفضّل (VIP) — لو متاح وقريب يحجز له مباشرة
  final int? preferredDriverId;

  const OrderCreateRequested({
    required this.origin,
    required this.destination,
    required this.originAddress,
    required this.destinationAddress,
    required this.service,
    required this.regionId,
    this.quietRide = false,
    this.audioOff = false,
    this.numberMasked = false,
    this.receiverName,
    this.receiverPhone,
    this.bookedHours,
    this.scheduledAt,
    this.couponCode,
    this.paymentMode,
    this.stops = const [],
    this.stopAddresses = const [],
    this.familyMode = false,
    this.nightShift = false,
    this.preferredDriverId,
  });

  @override
  List<Object?> get props => [origin, destination, service.id];
}

class OrderCancelRequested extends OrderEvent {
  final int orderId;
  final String? reason;
  const OrderCancelRequested(this.orderId, {this.reason});
  @override
  List<Object?> get props => [orderId, reason];
}

class OrderRateDriverRequested extends OrderEvent {
  final int orderId;
  final double rating;
  final String? comment;
  final double? tip;

  const OrderRateDriverRequested({
    required this.orderId,
    required this.rating,
    this.comment,
    this.tip,
  });

  @override
  List<Object?> get props => [orderId, rating];
}

class OrderUpdatedFromSubscription extends OrderEvent {
  final OrderModel order;
  const OrderUpdatedFromSubscription(this.order);
  @override
  List<Object?> get props => [order];
}

/// استطلاع دوري للطلب النشط (شبكة أمان مستقلة عن WebSocket) — يحدّث الحالة
/// حتى لو فشلت الاشتراكات على شبكة الجوال.
class OrderActivePollRequested extends OrderEvent {
  const OrderActivePollRequested();
}

class OrderSubscriptionStart extends OrderEvent {
  const OrderSubscriptionStart();
}

class OrderSubscriptionStop extends OrderEvent {
  const OrderSubscriptionStop();
}

class OrderHistoryRequested extends OrderEvent {
  final int page;
  const OrderHistoryRequested({this.page = 0});
  @override
  List<Object?> get props => [page];
}
