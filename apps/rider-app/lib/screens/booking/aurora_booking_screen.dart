import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:go_router/go_router.dart';

import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/graphql/gql/company_gql.dart';
import '../../core/models/order_model.dart';
import '../../core/models/service_model.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'aurora_bid_waiting_screen.dart';

/// AuroraBookingScreen — قلب تجربة الراكب: تحديد الوجهة + اختيار الخدمة + الطلب.
///
/// الخطوات:
///  1) اختيار الوجهة عبر تحريك الخريطة (الدبوس بالمركز = الوجهة).
///  2) اختيار الخدمة (تُحمَّل من الـ API) + تفضيلات الرحلة.
///  3) "اطلب الآن" → OrderCreateRequested → التتبع (عبر redirect).
class AuroraBookingScreen extends StatefulWidget {
  /// وجهة مبدئية اختيارية (من اختصار/مكان محفوظ).
  final GeoPoint? presetDestination;
  final String? presetDestinationLabel;

  /// نوع خدمة مُفضَّل لاختياره تلقائياً (PackageDelivery / HourlyChauffeur).
  final String? preferServiceType;

  const AuroraBookingScreen({
    super.key,
    this.presetDestination,
    this.presetDestinationLabel,
    this.preferServiceType,
  });

  @override
  State<AuroraBookingScreen> createState() => _AuroraBookingScreenState();
}

enum _BookingStep { pickDestination, pickService }

class _AuroraBookingScreenState extends State<AuroraBookingScreen> {
  GoogleMapController? _mapCtrl;

  // الموقع
  GeoPoint _origin =
      const GeoPoint(lat: AppConfig.defaultLat, lng: AppConfig.defaultLng);
  GeoPoint _destination =
      const GeoPoint(lat: AppConfig.defaultLat, lng: AppConfig.defaultLng);
  String _originLabel = tr('myLocation');
  String _destinationLabel = tr('moveMapHint');

  _BookingStep _step = _BookingStep.pickDestination;

  // الخدمات
  List<ServiceModel> _services = [];
  ServiceModel? _selectedService;
  bool _loadingServices = false;
  String? _servicesError;

  // المسار الفعلي (Google Directions عبر الـ API)
  int? _routeDistanceM;
  int? _routeDurationS;
  double? _routeFare;
  String _routeCurrency = 'ر.س';
  bool _loadingRoute = false;
  final Set<Polyline> _polylines = {};

  // التفضيلات
  bool _quietRide = false;
  bool _audioOff = false;
  bool _familyMode = false;
  bool _nightShift = false;
  bool _bidMode = false;
  final TextEditingController _bidPriceCtrl = TextEditingController();
  bool _sendingBid = false;
  DateTime? _scheduledAt;
  // توصيل أمانات
  final TextEditingController _receiverNameCtrl = TextEditingController();
  final TextEditingController _receiverPhoneCtrl = TextEditingController();
  // سائق بالساعة
  int _bookedHours = 1;

  // كوبون الخصم
  final TextEditingController _couponCtrl = TextEditingController();
  String? _appliedCoupon;
  double? _couponDiscount;
  bool _couponLoading = false;
  String? _couponError;

  // طريقة الدفع (Cash / Wallet / Company)
  String _paymentMode = 'Cash';

  // F2 — إذا كان الراكب موظفاً في شركة فعّالة، نعرض خيار "ادفع من حساب الشركة"
  Map<String, dynamic>? _myCompany;

  // محطات وسيطة (Multi-stop) — قائمة نقاط بين الانطلاق والوجهة
  final List<({GeoPoint point, String label})> _stops = [];

  bool get _isDelivery => _selectedService?.serviceType == 'PackageDelivery';
  bool get _isHourly => _selectedService?.serviceType == 'HourlyChauffeur';

  /// الأجرة التقديرية الحالية لمعاينة الكوبون
  int get _estimatedFare {
    if (_isHourly && _selectedService?.hourlyRate != null) {
      return (_selectedService!.hourlyRate! * _bookedHours).round();
    }
    return (_routeFare ?? 0).round();
  }

  // نمط داكن غنيّ بالتفاصيل: شوارع + طرق سريعة + مياه + حدائق + معالم + مناطق إدارية + أسماء المدن.
  static const String _darkMapStyle = '''
[
  {"elementType":"geometry","stylers":[{"color":"#13100E"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#C9BDB6"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#0A0807"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#332C28"}]},
  {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#B9ADA6"}]},
  {"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#3D352F"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#4A4039"}]},
  {"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#E0CFC2"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#16243A"}]},
  {"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#7FA0C8"}]},
  {"featureType":"poi","elementType":"geometry","stylers":[{"color":"#1B2A1C"}]},
  {"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#9DB39B"}]},
  {"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#16301A"}]},
  {"featureType":"poi.business","elementType":"labels.icon","stylers":[{"saturation":-40}]},
  {"featureType":"transit","elementType":"labels.text.fill","stylers":[{"color":"#B0A8C0"}]},
  {"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#5A4F47"}]},
  {"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#F0DECF"}]},
  {"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#C2B3A6"}]}
]
''';

  @override
  void initState() {
    super.initState();
    if (widget.presetDestination != null) {
      _destination = widget.presetDestination!;
      _destinationLabel = widget.presetDestinationLabel ?? 'الوجهة المحددة';
    }
    _initLocation();
    _loadMyCompany();
  }

  Future<void> _loadMyCompany() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(myCompanyQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (!mounted) return;
      final data = res.data?['myCompany'] as Map<String, dynamic>?;
      if (data != null) setState(() => _myCompany = data);
    } catch (_) {}
  }

  Future<void> _initLocation() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        return; // نُبقي على الموقع الافتراضي (الرياض)
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      if (!mounted) return;
      setState(() {
        _origin = GeoPoint(lat: pos.latitude, lng: pos.longitude);
        if (widget.presetDestination == null) {
          _destination = _origin;
        }
      });
      _mapCtrl?.animateCamera(
        CameraUpdate.newLatLng(LatLng(_origin.lat, _origin.lng)),
      );
    } catch (_) {
      // تجاهل — نستخدم الموقع الافتراضي
    }
  }

  Future<void> _loadServices() async {
    setState(() {
      _loadingServices = true;
      _servicesError = null;
    });
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(servicesQuery),
        variables: const {'regionId': AppConfig.defaultRegionId},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (res.hasException) {
        throw Exception(res.exception?.graphqlErrors.firstOrNull?.message ??
            'تعذّر تحميل الخدمات');
      }
      final list = (res.data?['services'] as List<dynamic>? ?? [])
          .map((e) => ServiceModel.fromJson(e as Map<String, dynamic>))
          .toList();
      if (!mounted) return;
      // اختيار الخدمة المفضّلة (توصيل/بالساعة) إن طُلبت، وإلا أول خدمة
      ServiceModel? preferred;
      if (widget.preferServiceType != null) {
        for (final s in list) {
          if (s.serviceType == widget.preferServiceType) {
            preferred = s;
            break;
          }
        }
      }
      setState(() {
        _services = list;
        _selectedService =
            preferred ?? (list.isNotEmpty ? list.first : null);
        _loadingServices = false;
      });
      if (_selectedService != null) _loadRoute();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _servicesError = e.toString();
        _loadingServices = false;
      });
    }
  }

  Future<void> _saveCurrentPlace() async {
    final labelCtrl = TextEditingController();
    String type = 'other';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('savePlace'), style: AuroraText.titleSmall),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: labelCtrl,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: _fieldDecoration(tr('placeLabel'), Icons.label_outline),
            ),
            const SizedBox(height: AuroraSpacing.sm),
            StatefulBuilder(
              builder: (_, setSt) => Row(
                children: [
                  for (final t in const ['home', 'work', 'other'])
                    Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(tr('place_$t')),
                        selected: type == t,
                        onSelected: (_) => setSt(() => type = t),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dctx, false),
              child: Text(tr('cancel'))),
          TextButton(
              onPressed: () => Navigator.pop(dctx, true),
              child: Text(tr('save'))),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final label = labelCtrl.text.trim().isEmpty
        ? _destinationLabel
        : labelCtrl.text.trim();
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(addSavedPlaceMutation),
        variables: {
          'input': {
            'label': label,
            'address': _destinationLabel,
            'lat': _destination.lat,
            'lng': _destination.lng,
            'type': type,
          },
        },
      ));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tr('placeSaved')),
            backgroundColor: AuroraColors.success,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(tr('saveFailed'))),
        );
      }
    }
  }

  void _confirmDestination() {
    setState(() => _step = _BookingStep.pickService);
    if (_services.isEmpty) {
      _loadServices();
    } else {
      _loadRoute();
    }
  }

  /// يحمّل المسار الفعلي (مسافة بالطريق + أجرة + polyline) للخدمة المختارة.
  Future<void> _loadRoute() async {
    final service = _selectedService;
    if (service == null) return;
    setState(() => _loadingRoute = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(routePreviewQuery),
        fetchPolicy: FetchPolicy.networkOnly,
        variables: {
          'input': {
            'origin': {'lat': _origin.lat, 'lng': _origin.lng},
            'destination': {'lat': _destination.lat, 'lng': _destination.lng},
            'serviceId': service.id,
          }
        },
      ));
      final d = res.data?['routePreview'] as Map<String, dynamic>?;
      if (!mounted) return;
      if (d != null) {
        setState(() {
          _routeDistanceM = (d['distanceMeters'] as num?)?.toInt();
          _routeDurationS = (d['durationSeconds'] as num?)?.toInt();
          _routeFare = (d['estimatedFare'] as num?)?.toDouble();
          _routeCurrency = d['currency'] as String? ?? 'ر.س';
          _drawPolyline(d['polyline'] as String?);
          _loadingRoute = false;
        });
      } else {
        setState(() => _loadingRoute = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loadingRoute = false);
    }
  }

  void _drawPolyline(String? encoded) {
    _polylines.clear();
    if (encoded == null || encoded.isEmpty) return;
    final pts = _decodePolyline(encoded);
    if (pts.isEmpty) return;
    _polylines.add(Polyline(
      polylineId: const PolylineId('route'),
      color: AuroraColors.ember,
      width: 5,
      points: pts,
    ));
    // ضبط الكاميرا لتشمل المسار
    final bounds = _boundsOf(pts);
    _mapCtrl?.animateCamera(CameraUpdate.newLatLngBounds(bounds, 80));
  }

  /// فك ترميز Google encoded polyline.
  List<LatLng> _decodePolyline(String e) {
    final List<LatLng> poly = [];
    int index = 0, lat = 0, lng = 0;
    while (index < e.length) {
      int b, shift = 0, result = 0;
      do {
        b = e.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
      shift = 0;
      result = 0;
      do {
        b = e.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
      poly.add(LatLng(lat / 1e5, lng / 1e5));
    }
    return poly;
  }

  LatLngBounds _boundsOf(List<LatLng> pts) {
    double minLat = pts.first.latitude, maxLat = pts.first.latitude;
    double minLng = pts.first.longitude, maxLng = pts.first.longitude;
    for (final p in pts) {
      minLat = p.latitude < minLat ? p.latitude : minLat;
      maxLat = p.latitude > maxLat ? p.latitude : maxLat;
      minLng = p.longitude < minLng ? p.longitude : minLng;
      maxLng = p.longitude > maxLng ? p.longitude : maxLng;
    }
    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  void _requestRide() {
    final service = _selectedService;
    if (service == null) return;
    if (_bidMode && !_isDelivery && !_isHourly) {
      _sendBid(service);
      return;
    }
    // التحقق من بيانات المستلم للتوصيل
    if (_isDelivery) {
      final name = _receiverNameCtrl.text.trim();
      final phone = _receiverPhoneCtrl.text.trim();
      if (name.isEmpty || phone.length < 6) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tr('receiverRequired')),
            backgroundColor: AuroraColors.smoke,
          ),
        );
        return;
      }
    }
    context.read<OrderBloc>().add(OrderCreateRequested(
          origin: _origin,
          destination: _destination,
          originAddress: _originLabel,
          destinationAddress: _destinationLabel,
          service: service,
          regionId: AppConfig.defaultRegionId,
          quietRide: _quietRide,
          audioOff: _audioOff,
          scheduledAt: _isDelivery || _isHourly ? null : _scheduledAt,
          receiverName: _isDelivery ? _receiverNameCtrl.text.trim() : null,
          receiverPhone: _isDelivery ? _receiverPhoneCtrl.text.trim() : null,
          bookedHours: _isHourly ? _bookedHours : null,
          couponCode: _appliedCoupon,
          paymentMode: _paymentMode,
          stops: _stops.map((s) => s.point).toList(),
          stopAddresses: _stops.map((s) => s.label).toList(),
          familyMode: _familyMode,
          nightShift: _nightShift,
        ));
  }

  /// يضيف محطة وسيطة من مركز الخريطة الحالي.
  void _addStopAtCurrentMap() {
    if (_stops.length >= 3) return;
    setState(() {
      _stops.add((point: _destination, label: _destinationLabel));
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(tr('stopAdded'))),
    );
  }

  Future<void> _pickSchedule() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(minutes: 30)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 14)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(now.add(const Duration(minutes: 30))),
    );
    if (time == null || !mounted) return;
    final picked = DateTime(
        date.year, date.month, date.day, time.hour, time.minute);
    if (picked.isBefore(now.add(const Duration(minutes: 5)))) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr('scheduleTooSoon')), backgroundColor: AuroraColors.smoke),
      );
      return;
    }
    setState(() => _scheduledAt = picked);
  }

  String _formatSchedule(DateTime dt) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(dt.day)}/${two(dt.month)} — ${two(dt.hour)}:${two(dt.minute)}';
  }

  Future<void> _applyCoupon() async {
    final code = _couponCtrl.text.trim().toUpperCase();
    if (code.isEmpty) return;
    final fare = _estimatedFare;
    if (fare <= 0) {
      setState(() => _couponError = tr('couponWaitFare'));
      return;
    }
    setState(() {
      _couponLoading = true;
      _couponError = null;
    });
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(validateCouponQuery),
        variables: {
          'code': code,
          'fare': fare,
          'regionId': AppConfig.defaultRegionId,
        },
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (res.hasException) {
        throw Exception(res.exception?.graphqlErrors.firstOrNull?.message ??
            tr('couponInvalid'));
      }
      final d = res.data?['validateCoupon'] as Map<String, dynamic>?;
      if (d == null) throw Exception(tr('couponInvalid'));
      if (!mounted) return;
      setState(() {
        _appliedCoupon = d['code'] as String?;
        _couponDiscount = (d['discountAmount'] as num?)?.toDouble();
        _couponLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _couponLoading = false;
        _couponError = e.toString().replaceFirst('Exception: ', '');
        _appliedCoupon = null;
        _couponDiscount = null;
      });
    }
  }

  void _removeCoupon() {
    setState(() {
      _appliedCoupon = null;
      _couponDiscount = null;
      _couponError = null;
      _couponCtrl.clear();
    });
  }

  InputDecoration _fieldDecoration(String hint, IconData icon) =>
      InputDecoration(
        hintText: hint,
        hintStyle: AuroraText.bodyMedium
            .copyWith(color: AuroraColors.textSecondary),
        prefixIcon: Icon(icon, color: AuroraColors.ember, size: 20),
        filled: true,
        fillColor: AuroraColors.ash,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          borderSide: const BorderSide(color: AuroraColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          borderSide: BorderSide(color: AuroraColors.ember, width: 1.5),
        ),
      );

  Future<void> _sendBid(ServiceModel service) async {
    final price = double.tryParse(_bidPriceCtrl.text.trim()) ?? 0;
    if (price < 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr('yourPrice')), backgroundColor: AuroraColors.smoke),
      );
      return;
    }
    setState(() => _sendingBid = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(createBidMutation),
        variables: {
          'input': {
            'points': [
              {'lat': _origin.lat, 'lng': _origin.lng},
              {'lat': _destination.lat, 'lng': _destination.lng},
            ],
            'addresses': [_originLabel, _destinationLabel],
            'proposedPrice': price,
            'serviceId': service.id,
            'regionId': AppConfig.defaultRegionId,
          }
        },
      ));
      if (res.hasException) throw res.exception!;
      final bid = res.data?['createBid'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() => _sendingBid = false);
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => AuroraBidWaitingScreen(
          proposedPrice: price,
          currency: bid?['currency'] as String? ?? 'ر.س',
        ),
      ));
    } catch (e) {
      if (mounted) {
        setState(() => _sendingBid = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$e'), backgroundColor: AuroraColors.danger),
        );
      }
    }
  }

  double _distanceKm() {
    final m = Geolocator.distanceBetween(
      _origin.lat,
      _origin.lng,
      _destination.lat,
      _destination.lng,
    );
    return m / 1000;
  }

  @override
  void dispose() {
    _mapCtrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: BlocConsumer<OrderBloc, OrderState>(
        listener: (ctx, state) {
          if (state is OrderError) {
            ScaffoldMessenger.of(ctx).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AuroraColors.danger,
              ),
            );
          } else if (state is OrderScheduled) {
            // حجز مسبق تم بنجاح — عرض تأكيد والعودة للرئيسية
            ScaffoldMessenger.of(ctx).showSnackBar(
              SnackBar(
                content: Text(tr('rideScheduledOk')),
                backgroundColor: AuroraColors.success,
              ),
            );
            ctx.go('/home');
          }
          // OrderCreated / OrderActive → الـ router يوجّه تلقائياً لـ /tracking
        },
        builder: (context, orderState) {
          final creating = orderState is OrderLoading;
          return Stack(
            children: [
              // ─── Map ───
              Positioned.fill(
                child: GoogleMap(
                  style: _darkMapStyle,
                  initialCameraPosition: CameraPosition(
                    target: LatLng(_destination.lat, _destination.lng),
                    zoom: 14,
                  ),
                  onMapCreated: (c) => _mapCtrl = c,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                  compassEnabled: false,
                  polylines: _polylines,
                  onCameraMove: (pos) {
                    _destination =
                        GeoPoint(lat: pos.target.latitude, lng: pos.target.longitude);
                  },
                  onCameraIdle: () {
                    if (_step == _BookingStep.pickDestination) {
                      setState(() => _destinationLabel =
                          'الوجهة: ${_destination.lat.toStringAsFixed(4)}, ${_destination.lng.toStringAsFixed(4)}');
                    }
                  },
                ),
              ),

              // ─── Center destination pin ───
              if (_step == _BookingStep.pickDestination)
                Center(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: 40),
                    child: Icon(Icons.location_on,
                        color: AuroraColors.ember, size: 48),
                  ),
                ),

              // ─── Back button ───
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                right: AuroraSpacing.lg,
                child: _circleBtn(Icons.arrow_back, () {
                  if (_step == _BookingStep.pickService) {
                    setState(() => _step = _BookingStep.pickDestination);
                  } else {
                    Navigator.of(context).maybePop();
                  }
                }),
              ),

              // ─── My-location recenter ───
              Positioned(
                bottom: _step == _BookingStep.pickDestination ? 240 : 420,
                left: AuroraSpacing.lg,
                child: _circleBtn(Icons.my_location, () {
                  _mapCtrl?.animateCamera(
                    CameraUpdate.newLatLng(LatLng(_origin.lat, _origin.lng)),
                  );
                }),
              ),

              // ─── Bottom sheet ───
              Align(
                alignment: Alignment.bottomCenter,
                child: _step == _BookingStep.pickDestination
                    ? _destinationSheet()
                    : _serviceSheet(creating),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        shape: BoxShape.circle,
        border: Border.all(color: AuroraColors.border),
        boxShadow: AuroraShadows.cardDepth,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Icon(icon, color: AuroraColors.pearl, size: 20),
        ),
      ),
    );
  }

  // ─── Sheet: تحديد الوجهة ───
  Widget _destinationSheet() {
    return _sheetContainer(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _routeRow(Icons.my_location, AuroraColors.success, _originLabel),
          // محطات وسيطة
          for (var i = 0; i < _stops.length; i++) ...[
            const Divider(color: AuroraColors.border, height: AuroraSpacing.md),
            Row(
              children: [
                Expanded(
                  child: _routeRow(
                      Icons.flag_outlined,
                      AuroraColors.info,
                      _stops[i].label.isEmpty
                          ? '${tr('stop')} ${i + 1}'
                          : _stops[i].label),
                ),
                IconButton(
                  icon: const Icon(Icons.close,
                      color: AuroraColors.textSecondary, size: 18),
                  onPressed: () => setState(() => _stops.removeAt(i)),
                ),
              ],
            ),
          ],
          const Divider(color: AuroraColors.border, height: AuroraSpacing.lg),
          Row(
            children: [
              Expanded(
                child: _routeRow(
                    Icons.location_on, AuroraColors.ember, _destinationLabel),
              ),
              IconButton(
                icon: Icon(Icons.bookmark_add_outlined,
                    color: AuroraColors.ember),
                tooltip: tr('savePlace'),
                onPressed: _saveCurrentPlace,
              ),
            ],
          ),
          if (_stops.length < 3)
            TextButton.icon(
              onPressed: _addStopAtCurrentMap,
              icon: Icon(Icons.add_location_alt_outlined,
                  color: AuroraColors.ember, size: 18),
              label: Text(tr('addStop'),
                  style: AuroraText.bodySmall
                      .copyWith(color: AuroraColors.ember)),
            ),
          const SizedBox(height: AuroraSpacing.sm),
          AuroraButton.primary(
            label: tr('confirmDestination'),
            icon: Icons.check,
            onPressed: _confirmDestination,
          ),
        ],
      ),
    );
  }

  Widget _routeRow(IconData icon, Color color, String label) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: AuroraSpacing.md),
        Expanded(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
          ),
        ),
      ],
    );
  }

  // ─── Sheet: اختيار الخدمة ───
  Widget _serviceSheet(bool creating) {
    return _sheetContainer(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(tr('chooseRideType'), style: AuroraText.titleMedium),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.route, size: 14, color: AuroraColors.textSecondary),
              const SizedBox(width: 4),
              Text(
                _loadingRoute
                    ? tr('calculatingRoute')
                    : _routeDistanceM != null
                        ? 'المسافة ${(_routeDistanceM! / 1000).toStringAsFixed(1)} كم • ${(_routeDurationS! / 60).ceil()} دقيقة (بالطريق)'
                        : 'المسافة ~${_distanceKm().toStringAsFixed(1)} كم',
                style: AuroraText.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.md),

          if (_loadingServices)
            Padding(
              padding: EdgeInsets.all(AuroraSpacing.xl),
              child: Center(
                  child: CircularProgressIndicator(color: AuroraColors.ember)),
            )
          else if (_servicesError != null)
            _errorBox(_servicesError!)
          else
            ..._services.map(_serviceRow),

          const SizedBox(height: AuroraSpacing.md),

          // ─── توصيل الأمانات: بيانات المستلم ───
          if (_isDelivery) ...[
            Text(tr('receiverInfo'),
                style: AuroraText.titleSmall.copyWith(color: AuroraColors.pearl)),
            const SizedBox(height: AuroraSpacing.sm),
            TextField(
              controller: _receiverNameCtrl,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: _fieldDecoration(tr('receiverName'), Icons.person),
            ),
            const SizedBox(height: AuroraSpacing.sm),
            TextField(
              controller: _receiverPhoneCtrl,
              keyboardType: TextInputType.phone,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: _fieldDecoration(tr('receiverPhone'), Icons.phone),
            ),
            const SizedBox(height: AuroraSpacing.sm),
          ],

          // ─── سائق بالساعة: عدد الساعات ───
          if (_isHourly) ...[
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
              decoration: BoxDecoration(
                color: AuroraColors.ash,
                borderRadius: BorderRadius.circular(AuroraRadius.md),
                border: Border.all(color: AuroraColors.border),
              ),
              child: Row(
                children: [
                  Icon(Icons.timer, size: 18, color: AuroraColors.ember),
                  const SizedBox(width: AuroraSpacing.sm),
                  Expanded(
                    child: Text(
                      '${tr('hours')}: $_bookedHours',
                      style: AuroraText.bodyMedium
                          .copyWith(color: AuroraColors.pearl),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline,
                        color: AuroraColors.textSecondary),
                    onPressed: _bookedHours > 1
                        ? () => setState(() => _bookedHours--)
                        : null,
                  ),
                  Text('$_bookedHours',
                      style: AuroraText.titleMedium
                          .copyWith(color: AuroraColors.ember)),
                  IconButton(
                    icon: Icon(Icons.add_circle_outline,
                        color: AuroraColors.ember),
                    onPressed: _bookedHours < 12
                        ? () => setState(() => _bookedHours++)
                        : null,
                  ),
                ],
              ),
            ),
            if (_selectedService?.hourlyRate != null)
              Padding(
                padding: const EdgeInsets.only(top: AuroraSpacing.xs),
                child: Text(
                  '${tr('estimatedPrice')}: ${(_selectedService!.hourlyRate! * _bookedHours).toStringAsFixed(0)}',
                  style: AuroraText.bodySmall,
                ),
              ),
            const SizedBox(height: AuroraSpacing.sm),
          ],

          // التفضيلات + المزايدة (للمشاوير فقط)
          if (!_isDelivery && !_isHourly) ...[
          Row(
            children: [
              Expanded(
                child: _prefChip(Icons.volume_off, tr('quietRide'), _quietRide,
                    () => setState(() => _quietRide = !_quietRide)),
              ),
              const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: _prefChip(Icons.music_off, tr('noMusic'), _audioOff,
                    () => setState(() => _audioOff = !_audioOff)),
              ),
            ],
          ),

          const SizedBox(height: AuroraSpacing.sm),

          // وضع العائلة (يفضّل سائقة)
          _prefChip(
            Icons.family_restroom,
            tr('familyMode'),
            _familyMode,
            () => setState(() => _familyMode = !_familyMode),
          ),

          const SizedBox(height: AuroraSpacing.sm),

          // G1 — وضع الليل (سعر ثابت + مشاركة موقع مع جهات الطوارئ)
          _prefChip(
            Icons.nightlight_round,
            tr('nightShift'),
            _nightShift,
            () => setState(() => _nightShift = !_nightShift),
          ),
          if (_nightShift)
            Padding(
              padding: const EdgeInsets.only(top: AuroraSpacing.xs),
              child: Text(
                tr('nightShiftHint'),
                style: AuroraText.bodySmall
                    .copyWith(color: AuroraColors.textSecondary),
              ),
            ),

          const SizedBox(height: AuroraSpacing.sm),

          // وضع المزايدة (اقترح سعرك)
          _prefChip(Icons.gavel, tr('bidMode'), _bidMode,
              () => setState(() => _bidMode = !_bidMode)),
          if (_bidMode) ...[
            const SizedBox(height: AuroraSpacing.sm),
            TextField(
              controller: _bidPriceCtrl,
              keyboardType: TextInputType.number,
              style: AuroraText.titleSmall.copyWith(color: AuroraColors.pearl),
              decoration: InputDecoration(
                hintText: tr('yourPrice'),
                prefixIcon:
                    Icon(Icons.attach_money, color: AuroraColors.ember),
                filled: true,
                fillColor: AuroraColors.ash,
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  borderSide: const BorderSide(color: AuroraColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  borderSide:
                      BorderSide(color: AuroraColors.ember, width: 1.5),
                ),
              ),
            ),
          ],

          if (!_bidMode) ...[
            const SizedBox(height: AuroraSpacing.md),
            InkWell(
              onTap: _pickSchedule,
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
                decoration: BoxDecoration(
                  color: AuroraColors.ash,
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  border: Border.all(
                    color: _scheduledAt != null
                        ? AuroraColors.ember
                        : AuroraColors.border,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _scheduledAt != null
                          ? Icons.event_available
                          : Icons.schedule,
                      size: 18,
                      color: _scheduledAt != null
                          ? AuroraColors.ember
                          : AuroraColors.textSecondary,
                    ),
                    const SizedBox(width: AuroraSpacing.sm),
                    Expanded(
                      child: Text(
                        _scheduledAt != null
                            ? _formatSchedule(_scheduledAt!)
                            : tr('rideNow'),
                        style: TextStyle(
                          color: _scheduledAt != null
                              ? AuroraColors.textPrimary
                              : AuroraColors.textSecondary,
                          fontWeight: _scheduledAt != null
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ),
                    if (_scheduledAt != null)
                      GestureDetector(
                        onTap: () => setState(() => _scheduledAt = null),
                        child: const Icon(Icons.close,
                            size: 18, color: AuroraColors.textSecondary),
                      )
                    else
                      const Icon(Icons.keyboard_arrow_down,
                          size: 18, color: AuroraColors.textSecondary),
                  ],
                ),
              ),
            ),
          ],
          ], // نهاية قسم المشاوير فقط

          // ─── طريقة الدفع ───
          if (!_bidMode) ...[
            const SizedBox(height: AuroraSpacing.md),
            Row(
              children: [
                Expanded(
                  child: _payChip(
                    icon: Icons.payments_outlined,
                    label: tr('cash'),
                    selected: _paymentMode == 'Cash',
                    onTap: () => setState(() => _paymentMode = 'Cash'),
                  ),
                ),
                const SizedBox(width: AuroraSpacing.sm),
                Expanded(
                  child: _payChip(
                    icon: Icons.account_balance_wallet_outlined,
                    label: tr('wallet'),
                    selected: _paymentMode == 'Wallet',
                    onTap: () => setState(() => _paymentMode = 'Wallet'),
                  ),
                ),
              ],
            ),
            if (_myCompany != null) ...[
              const SizedBox(height: AuroraSpacing.sm),
              _payChip(
                icon: Icons.business_outlined,
                label:
                    '${tr('payWithCompany')} · ${_myCompany!['companyName']}',
                selected: _paymentMode == 'Company',
                onTap: () => setState(() => _paymentMode = 'Company'),
              ),
            ],
          ],

          // ─── كود الخصم ───
          if (!_bidMode) ...[
            const SizedBox(height: AuroraSpacing.md),
            if (_appliedCoupon == null)
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _couponCtrl,
                      textCapitalization: TextCapitalization.characters,
                      style: AuroraText.bodyMedium
                          .copyWith(color: AuroraColors.pearl),
                      decoration:
                          _fieldDecoration(tr('couponCode'), Icons.local_offer),
                    ),
                  ),
                  const SizedBox(width: AuroraSpacing.sm),
                  SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _couponLoading ? null : _applyCoupon,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AuroraColors.smoke,
                        foregroundColor: AuroraColors.ember,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AuroraRadius.md),
                        ),
                      ),
                      child: _couponLoading
                          ? SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: AuroraColors.ember))
                          : Text(tr('apply')),
                    ),
                  ),
                ],
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
                decoration: BoxDecoration(
                  color: AuroraColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  border: Border.all(
                      color: AuroraColors.success.withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.check_circle,
                        color: AuroraColors.success, size: 18),
                    const SizedBox(width: AuroraSpacing.sm),
                    Expanded(
                      child: Text(
                        '$_appliedCoupon — ${tr('youSaved')} ${_couponDiscount?.toStringAsFixed(0) ?? ''} $_routeCurrency',
                        style: AuroraText.bodySmall
                            .copyWith(color: AuroraColors.pearl),
                      ),
                    ),
                    GestureDetector(
                      onTap: _removeCoupon,
                      child: const Icon(Icons.close,
                          size: 18, color: AuroraColors.textSecondary),
                    ),
                  ],
                ),
              ),
            if (_couponError != null)
              Padding(
                padding: const EdgeInsets.only(top: AuroraSpacing.xs),
                child: Text(_couponError!,
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.danger)),
              ),
          ],

          const SizedBox(height: AuroraSpacing.lg),
          AuroraButton.primary(
            label: _isDelivery
                ? tr('requestDelivery')
                : _isHourly
                    ? tr('bookHourly')
                    : _bidMode
                        ? tr('sendBid')
                        : (_scheduledAt != null
                            ? tr('scheduleRide')
                            : tr('requestNow')),
            icon: _isDelivery
                ? Icons.local_shipping
                : _isHourly
                    ? Icons.timer
                    : _bidMode
                        ? Icons.gavel
                        : (_scheduledAt != null
                            ? Icons.event
                            : Icons.local_taxi),
            loading: creating || _sendingBid,
            onPressed: (_selectedService != null && !creating && !_sendingBid)
                ? _requestRide
                : null,
          ),
        ],
      ),
    );
  }

  Widget _serviceRow(ServiceModel s) {
    final selected = _selectedService?.id == s.id;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedService = s);
        _loadRoute();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
        padding: const EdgeInsets.all(AuroraSpacing.md),
        decoration: BoxDecoration(
          color: selected ? AuroraColors.smoke : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(
            color: selected ? AuroraColors.ember : AuroraColors.border,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AuroraColors.coal,
                borderRadius: BorderRadius.circular(AuroraRadius.sm),
              ),
              child: Icon(
                s.isVip ? Icons.diamond_outlined : Icons.local_taxi,
                color: AuroraColors.ember,
                size: 22,
              ),
            ),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.name, style: AuroraText.titleSmall),
                  const SizedBox(height: 2),
                  Text(
                    (selected && _routeFare != null)
                        ? '${_routeFare!.toStringAsFixed(2)} $_routeCurrency'
                        : 'تبدأ من ${s.minimumFee.toStringAsFixed(0)} ر.س',
                    style: AuroraText.bodySmall.copyWith(
                      color: (selected && _routeFare != null)
                          ? AuroraColors.ember
                          : AuroraColors.textSecondary,
                      fontWeight: (selected && _routeFare != null)
                          ? FontWeight.w700
                          : FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            if (selected)
              Icon(Icons.check_circle,
                  color: AuroraColors.ember, size: 22),
          ],
        ),
      ),
    );
  }

  Widget _prefChip(IconData icon, String label, bool on, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: on ? AuroraColors.smoke : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.sm),
          border: Border.all(
              color: on ? AuroraColors.ember : AuroraColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 16,
                color: on ? AuroraColors.ember : AuroraColors.textSecondary),
            const SizedBox(width: 6),
            Text(label,
                style: AuroraText.bodySmall.copyWith(
                  color: on ? AuroraColors.ember : AuroraColors.textSecondary,
                )),
          ],
        ),
      ),
    );
  }

  Widget _payChip({
    required IconData icon,
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return _prefChip(icon, label, selected, onTap);
  }

  Widget _errorBox(String msg) {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.dangerBg,
        borderRadius: BorderRadius.circular(AuroraRadius.sm),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline,
              color: AuroraColors.danger, size: 18),
          const SizedBox(width: AuroraSpacing.sm),
          Expanded(
              child: Text(msg,
                  style: AuroraText.bodySmall
                      .copyWith(color: AuroraColors.danger))),
          TextButton(
            onPressed: _loadServices,
            child: Text('إعادة',
                style: AuroraText.bodySmall
                    .copyWith(color: AuroraColors.ember)),
          ),
        ],
      ),
    );
  }

  Widget _sheetContainer({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(
          AuroraSpacing.lg, AuroraSpacing.lg, AuroraSpacing.lg, AuroraSpacing.xl),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: AuroraColors.border)),
        boxShadow: [
          BoxShadow(color: Color(0x66000000), blurRadius: 24, offset: Offset(0, -8)),
        ],
      ),
      child: SafeArea(top: false, child: child),
    );
  }
}
