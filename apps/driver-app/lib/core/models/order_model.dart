class GeoPoint {
  final double lat;
  final double lng;
  const GeoPoint({required this.lat, required this.lng});

  factory GeoPoint.fromJson(Map<String, dynamic> json) => GeoPoint(
        lat: (json['lat'] as num).toDouble(),
        lng: (json['lng'] as num).toDouble(),
      );
}

/// عنصر في قائمة المشتريات (Grocery Run)
class ShoppingItem {
  final String name;
  final int qty;
  final String? note;
  const ShoppingItem({required this.name, required this.qty, this.note});

  factory ShoppingItem.fromJson(Map<String, dynamic> json) => ShoppingItem(
        name: json['name'] as String? ?? '',
        qty: json['qty'] as int? ?? 1,
        note: json['note'] as String?,
      );
}

enum OrderStatus {
  requested,
  notFound,
  found,
  driverAccepted,
  arrived,
  started,
  waitingForPostPay,
  waitingForReview,
  finished,
  canceledByRider,
  canceledByDriver,
  unknown;

  static OrderStatus fromString(String s) {
    switch (s.toLowerCase()) {
      case 'requested':        return OrderStatus.requested;
      case 'not_found':        return OrderStatus.notFound;
      case 'found':            return OrderStatus.found;
      case 'driver_accepted':  return OrderStatus.driverAccepted;
      case 'arrived':          return OrderStatus.arrived;
      case 'started':          return OrderStatus.started;
      case 'waiting_for_post_pay': return OrderStatus.waitingForPostPay;
      case 'waiting_for_review':   return OrderStatus.waitingForReview;
      case 'finished':         return OrderStatus.finished;
      case 'canceled_by_rider':  return OrderStatus.canceledByRider;
      case 'canceled_by_driver': return OrderStatus.canceledByDriver;
      default:                 return OrderStatus.unknown;
    }
  }

  bool get isActive => [
        OrderStatus.found,
        OrderStatus.driverAccepted,
        OrderStatus.arrived,
        OrderStatus.started,
        OrderStatus.waitingForPostPay,
      ].contains(this);

  bool get isFinished => [
        OrderStatus.finished,
        OrderStatus.canceledByRider,
        OrderStatus.canceledByDriver,
        OrderStatus.waitingForReview,
      ].contains(this);

  String get label {
    switch (this) {
      case OrderStatus.requested:       return 'Finding driver';
      case OrderStatus.notFound:        return 'No drivers found';
      case OrderStatus.found:           return 'Ride found';
      case OrderStatus.driverAccepted:  return 'On the way';
      case OrderStatus.arrived:         return 'Arrived at pickup';
      case OrderStatus.started:         return 'In progress';
      case OrderStatus.waitingForPostPay: return 'Awaiting payment';
      case OrderStatus.waitingForReview:  return 'Rate your ride';
      case OrderStatus.finished:        return 'Completed';
      case OrderStatus.canceledByRider: return 'Canceled by rider';
      case OrderStatus.canceledByDriver: return 'Canceled by driver';
      case OrderStatus.unknown:         return 'Unknown';
    }
  }
}

class DriverOrderModel {
  final int id;
  final String type;
  final OrderStatus status;
  final int riderId;
  final String? riderName;
  final String? riderPhone;
  final double riderRating;
  final List<GeoPoint> points;
  final List<String> addresses;
  final int distanceBest;
  final int durationBest;
  final double costBest;
  final double costAfterCoupon;
  final String currency;
  final String paymentMode;
  final bool quietRide;
  final int? requestedTemperature;
  final bool audioOff;
  final bool numberMasked;
  final String? otpCode;
  final String? receiverName;
  final String? receiverPhone;
  final bool isBidOrder;
  final DateTime? etaPickup;
  final DateTime? startTimestamp;
  final DateTime? finishTimestamp;
  final DateTime createdOn;

  // Phase H — driver-side awareness of new services
  final bool familyMode;
  final bool preferFemaleDriver;
  final int? preferredDriverId;
  final int? entitlementId;
  final int? companyId;
  final int? bookedHours;
  final bool nightShift;
  final List<ShoppingItem>? shoppingList;
  final double? budget;

  const DriverOrderModel({
    required this.id,
    required this.type,
    required this.status,
    required this.riderId,
    this.riderName,
    this.riderPhone,
    required this.riderRating,
    required this.points,
    required this.addresses,
    required this.distanceBest,
    required this.durationBest,
    required this.costBest,
    required this.costAfterCoupon,
    required this.currency,
    required this.paymentMode,
    required this.quietRide,
    this.requestedTemperature,
    required this.audioOff,
    required this.numberMasked,
    this.otpCode,
    this.receiverName,
    this.receiverPhone,
    required this.isBidOrder,
    this.etaPickup,
    this.startTimestamp,
    this.finishTimestamp,
    required this.createdOn,
    this.familyMode = false,
    this.preferFemaleDriver = false,
    this.preferredDriverId,
    this.entitlementId,
    this.companyId,
    this.bookedHours,
    this.nightShift = false,
    this.shoppingList,
    this.budget,
  });

  factory DriverOrderModel.fromJson(Map<String, dynamic> json) {
    final rawPoints = json['points'] as List<dynamic>? ?? [];
    final rawAddresses = json['addresses'] as List<dynamic>? ?? [];

    return DriverOrderModel(
      id: json['id'] as int,
      type: json['type'] as String? ?? 'standard',
      status: OrderStatus.fromString(json['status'] as String? ?? ''),
      riderId: json['riderId'] as int,
      riderName: json['riderName'] as String?,
      riderPhone: json['riderPhone'] as String?,
      riderRating: (json['riderRating'] as num? ?? 5.0).toDouble(),
      points: rawPoints
          .map((e) => GeoPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
      addresses: rawAddresses.map((e) => e as String).toList(),
      distanceBest: json['distanceBest'] as int? ?? 0,
      durationBest: json['durationBest'] as int? ?? 0,
      costBest: (json['costBest'] as num? ?? 0).toDouble(),
      costAfterCoupon: (json['costAfterCoupon'] as num? ?? 0).toDouble(),
      currency: json['currency'] as String? ?? 'SAR',
      paymentMode: json['paymentMode'] as String? ?? 'cash',
      quietRide: json['quietRide'] as bool? ?? false,
      requestedTemperature: json['requestedTemperature'] as int?,
      audioOff: json['audioOff'] as bool? ?? false,
      numberMasked: json['numberMasked'] as bool? ?? false,
      otpCode: json['otpCode'] as String?,
      receiverName: json['receiverName'] as String?,
      receiverPhone: json['receiverPhone'] as String?,
      isBidOrder: json['isBidOrder'] as bool? ?? false,
      etaPickup: json['etaPickup'] != null
          ? DateTime.parse(json['etaPickup'] as String)
          : null,
      startTimestamp: json['startTimestamp'] != null
          ? DateTime.parse(json['startTimestamp'] as String)
          : null,
      finishTimestamp: json['finishTimestamp'] != null
          ? DateTime.parse(json['finishTimestamp'] as String)
          : null,
      createdOn: json['createdOn'] != null
          ? DateTime.parse(json['createdOn'] as String)
          : DateTime.now(),
      familyMode: json['familyMode'] as bool? ?? false,
      preferFemaleDriver: json['preferFemaleDriver'] as bool? ?? false,
      preferredDriverId: json['preferredDriverId'] as int?,
      entitlementId: json['entitlementId'] as int?,
      companyId: json['companyId'] as int?,
      bookedHours: json['bookedHours'] as int?,
      nightShift: json['nightShift'] as bool? ?? false,
      shoppingList: (json['shoppingList'] as List<dynamic>?)
          ?.map((e) => ShoppingItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      budget: (json['budget'] as num?)?.toDouble(),
    );
  }

  String get originAddress =>
      addresses.isNotEmpty ? addresses.first : 'Pickup';
  String get destinationAddress =>
      addresses.length > 1 ? addresses.last : 'Destination';

  String get distanceLabel {
    if (distanceBest < 1000) return '${distanceBest}m';
    return '${(distanceBest / 1000).toStringAsFixed(1)}km';
  }

  String get durationLabel {
    if (durationBest < 60) return '${durationBest}s';
    final mins = (durationBest / 60).round();
    return '$mins min';
  }

  DriverOrderModel copyWith({OrderStatus? status}) => DriverOrderModel(
        id: id,
        type: type,
        status: status ?? this.status,
        riderId: riderId,
        riderName: riderName,
        riderPhone: riderPhone,
        riderRating: riderRating,
        points: points,
        addresses: addresses,
        distanceBest: distanceBest,
        durationBest: durationBest,
        costBest: costBest,
        costAfterCoupon: costAfterCoupon,
        currency: currency,
        paymentMode: paymentMode,
        quietRide: quietRide,
        requestedTemperature: requestedTemperature,
        audioOff: audioOff,
        numberMasked: numberMasked,
        otpCode: otpCode,
        receiverName: receiverName,
        receiverPhone: receiverPhone,
        isBidOrder: isBidOrder,
        etaPickup: etaPickup,
        startTimestamp: startTimestamp,
        finishTimestamp: finishTimestamp,
        createdOn: createdOn,
        familyMode: familyMode,
        preferFemaleDriver: preferFemaleDriver,
        preferredDriverId: preferredDriverId,
        entitlementId: entitlementId,
        companyId: companyId,
        bookedHours: bookedHours,
        nightShift: nightShift,
        shoppingList: shoppingList,
        budget: budget,
      );

  /// نوع رئيسي للعرض في الشاشات
  bool get isGrocery => shoppingList != null && shoppingList!.isNotEmpty;
  bool get isHourly => bookedHours != null && bookedHours! > 0;
  bool get isPrepaid => entitlementId != null || companyId != null;
}
