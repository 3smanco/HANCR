import 'package:equatable/equatable.dart';

class GeoPoint extends Equatable {
  final double lat;
  final double lng;
  const GeoPoint({required this.lat, required this.lng});

  factory GeoPoint.fromJson(Map<String, dynamic> json) => GeoPoint(
        lat: (json['lat'] as num).toDouble(),
        lng: (json['lng'] as num).toDouble(),
      );

  Map<String, dynamic> toJson() => {'lat': lat, 'lng': lng};

  @override
  List<Object?> get props => [lat, lng];
}

enum OrderStatus {
  requested,
  notFound,
  found,
  driverAccepted,
  waitingForPrePay,
  arrived,
  started,
  waitingForPostPay,
  waitingForReview,
  finished,
  riderCanceled,
  driverCanceled,
  booked;

  static OrderStatus fromString(String s) {
    switch (s) {
      case 'Requested':
        return OrderStatus.requested;
      case 'NotFound':
        return OrderStatus.notFound;
      case 'Found':
        return OrderStatus.found;
      case 'DriverAccepted':
        return OrderStatus.driverAccepted;
      case 'WaitingForPrePay':
        return OrderStatus.waitingForPrePay;
      case 'Arrived':
        return OrderStatus.arrived;
      case 'Started':
        return OrderStatus.started;
      case 'WaitingForPostPay':
        return OrderStatus.waitingForPostPay;
      case 'WaitingForReview':
        return OrderStatus.waitingForReview;
      case 'Finished':
        return OrderStatus.finished;
      case 'RiderCanceled':
        return OrderStatus.riderCanceled;
      case 'DriverCanceled':
        return OrderStatus.driverCanceled;
      case 'Booked':
        return OrderStatus.booked;
      default:
        return OrderStatus.requested;
    }
  }

  bool get isActive => ![
        OrderStatus.notFound,
        OrderStatus.finished,
        OrderStatus.riderCanceled,
        OrderStatus.driverCanceled,
        OrderStatus.booked,
      ].contains(this);

  bool get isScheduled => this == OrderStatus.booked;

  bool get hasDriver => [
        OrderStatus.driverAccepted,
        OrderStatus.waitingForPrePay,
        OrderStatus.arrived,
        OrderStatus.started,
        OrderStatus.waitingForPostPay,
        OrderStatus.waitingForReview,
      ].contains(this);

  bool get isFinished => this == OrderStatus.finished;

  bool get awaitingReview => this == OrderStatus.waitingForReview;

  String get label {
    switch (this) {
      case OrderStatus.requested:
        return 'Looking for driver...';
      case OrderStatus.notFound:
        return 'No drivers available';
      case OrderStatus.found:
        return 'Driver found!';
      case OrderStatus.driverAccepted:
        return 'Driver is on the way';
      case OrderStatus.waitingForPrePay:
        return 'Waiting for payment';
      case OrderStatus.arrived:
        return 'Driver arrived';
      case OrderStatus.started:
        return 'Ride in progress';
      case OrderStatus.waitingForPostPay:
        return 'Processing payment';
      case OrderStatus.waitingForReview:
        return 'Rate your driver';
      case OrderStatus.finished:
        return 'Completed';
      case OrderStatus.riderCanceled:
        return 'Cancelled';
      case OrderStatus.driverCanceled:
        return 'Cancelled by driver';
      case OrderStatus.booked:
        return 'Scheduled';
    }
  }
}

class OrderModel extends Equatable {
  final int id;
  final String type;
  final OrderStatus status;
  final double costBest;
  final double costAfterCoupon;
  final double paidAmount;
  final String currency;
  final int distanceBest;
  final int durationBest;
  final List<GeoPoint> points;

  /// مسار الطريق الفعلي (يتبع الشوارع) — قد يكون فارغاً لطلبات قديمة.
  final List<GeoPoint> directions;
  final List<String> addresses;

  /// الخط المرسوم على الخريطة: المسار الفعلي إن توفّر، وإلا نقاط البداية/النهاية.
  List<GeoPoint> get routeLine => directions.length > 1 ? directions : points;
  final DateTime? etaPickup;

  /// لحظة وصول السائق لنقطة الالتقاط — مرجع عدّاد الانتظار (B2).
  final DateTime? arrivedAt;

  /// تكلفة الانتظار المتراكمة (من الخادم).
  final double waitCost;

  /// مدّة الانتظار المجانية بالثواني قبل بدء الرسوم.
  final int freeWaitSeconds;

  final DateTime? startTimestamp;
  final DateTime? finishTimestamp;
  final DateTime? expectedTimestamp; // موعد الرحلة المجدولة (Reserve)
  // Driver info
  final int? driverId;
  final String? driverName;
  final String? driverPhone;
  final double? driverRating;
  final String? carBrand;
  final String? carModel;
  final String? carColor;
  final String? plateNumber;
  final String? driverAvatarUrl;
  // Flags
  final bool quietRide;
  final bool audioOff;
  final bool numberMasked;
  final bool isBidOrder;
  // Parcel delivery
  final String? otpCode;
  final String? receiverName;
  final String? receiverPhone;
  // IDs
  final int riderId;
  final int serviceId;
  final int regionId;
  final DateTime createdOn;

  const OrderModel({
    required this.id,
    required this.type,
    required this.status,
    required this.costBest,
    required this.costAfterCoupon,
    required this.paidAmount,
    required this.currency,
    required this.distanceBest,
    required this.durationBest,
    required this.points,
    this.directions = const [],
    required this.addresses,
    this.etaPickup,
    this.arrivedAt,
    this.waitCost = 0,
    this.freeWaitSeconds = 120,
    this.startTimestamp,
    this.finishTimestamp,
    this.expectedTimestamp,
    this.driverId,
    this.driverName,
    this.driverPhone,
    this.driverRating,
    this.carBrand,
    this.carModel,
    this.carColor,
    this.plateNumber,
    this.driverAvatarUrl,
    required this.quietRide,
    required this.audioOff,
    required this.numberMasked,
    required this.isBidOrder,
    this.otpCode,
    this.receiverName,
    this.receiverPhone,
    required this.riderId,
    required this.serviceId,
    required this.regionId,
    required this.createdOn,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) => OrderModel(
        id: json['id'] as int,
        type: json['type'] as String? ?? 'Ride',
        status:
            OrderStatus.fromString(json['status'] as String? ?? 'Requested'),
        costBest: (json['costBest'] as num?)?.toDouble() ?? 0,
        costAfterCoupon: (json['costAfterCoupon'] as num?)?.toDouble() ?? 0,
        paidAmount: (json['paidAmount'] as num?)?.toDouble() ?? 0,
        currency: json['currency'] as String? ?? 'SAR',
        distanceBest: json['distanceBest'] as int? ?? 0,
        durationBest: json['durationBest'] as int? ?? 0,
        points: (json['points'] as List<dynamic>?)
                ?.map((p) => GeoPoint.fromJson(p as Map<String, dynamic>))
                .toList() ??
            [],
        directions: (json['directions'] as List<dynamic>?)
                ?.map((p) => GeoPoint.fromJson(p as Map<String, dynamic>))
                .toList() ??
            const [],
        addresses: (json['addresses'] as List<dynamic>?)?.cast<String>() ?? [],
        etaPickup: json['etaPickup'] != null
            ? DateTime.tryParse(json['etaPickup'] as String)
            : null,
        arrivedAt: json['arrivedAt'] != null
            ? DateTime.tryParse(json['arrivedAt'] as String)
            : null,
        waitCost: (json['waitCost'] as num?)?.toDouble() ?? 0,
        freeWaitSeconds: json['freeWaitSeconds'] as int? ?? 120,
        startTimestamp: json['startTimestamp'] != null
            ? DateTime.tryParse(json['startTimestamp'] as String)
            : null,
        finishTimestamp: json['finishTimestamp'] != null
            ? DateTime.tryParse(json['finishTimestamp'] as String)
            : null,
        expectedTimestamp: json['expectedTimestamp'] != null
            ? DateTime.tryParse(json['expectedTimestamp'] as String)
            : null,
        driverId: json['driverId'] as int?,
        driverName: json['driverName'] as String?,
        driverPhone: json['driverPhone'] as String?,
        driverRating: (json['driverRating'] as num?)?.toDouble(),
        carBrand: json['carBrand'] as String?,
        carModel: json['carModel'] as String?,
        carColor: json['carColor'] as String?,
        plateNumber: json['plateNumber'] as String?,
        driverAvatarUrl: json['driverAvatarUrl'] as String?,
        quietRide: json['quietRide'] as bool? ?? false,
        audioOff: json['audioOff'] as bool? ?? false,
        numberMasked: json['numberMasked'] as bool? ?? false,
        isBidOrder: json['isBidOrder'] as bool? ?? false,
        otpCode: json['otpCode'] as String?,
        receiverName: json['receiverName'] as String?,
        receiverPhone: json['receiverPhone'] as String?,
        riderId: json['riderId'] as int? ?? 0,
        serviceId: json['serviceId'] as int? ?? 0,
        regionId: json['regionId'] as int? ?? 0,
        createdOn: json['createdOn'] != null
            ? DateTime.tryParse(json['createdOn'] as String) ?? DateTime.now()
            : DateTime.now(),
      );

  String get originAddress =>
      addresses.isNotEmpty ? addresses.first : 'Unknown';
  String get destinationAddress =>
      addresses.length > 1 ? addresses.last : 'Unknown';

  String get distanceLabel {
    if (distanceBest >= 1000) {
      return '${(distanceBest / 1000).toStringAsFixed(1)} km';
    }
    return '$distanceBest m';
  }

  String get durationLabel {
    final mins = (durationBest / 60).ceil();
    if (mins >= 60) {
      final h = mins ~/ 60;
      final m = mins % 60;
      return '${h}h ${m}m';
    }
    return '$mins min';
  }

  @override
  List<Object?> get props => [id, status, driverId, etaPickup];
}
