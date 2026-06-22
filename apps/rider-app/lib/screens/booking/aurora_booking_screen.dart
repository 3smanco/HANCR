import 'dart:async';
import 'dart:ui' show ImageFilter;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/aurora_map_style.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/graphql/gql/order_gql.dart';
import '../../core/graphql/gql/company_gql.dart';
import '../../core/models/order_model.dart';
import '../../core/models/service_model.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/car_art.dart';
import '../../core/motion/motion.dart';
import 'aurora_bid_waiting_screen.dart';
import 'reserve_modal.dart';

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

  // المنطقة (تُكتشف تلقائياً من GPS — تصحّح خطأ "خارج المنطقة" + العملة)
  int _regionId = AppConfig.defaultRegionId;

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
  bool _showOptions = false; // طيّ التفضيلات/المزايدة/الخصم خلف "خيارات"
  bool _businessProfile = false; // ملف Personal/Business (يوجّه الفوترة للشركة)

  // Phase 2 — اختصارات سريعة في شاشة الوجهة (محفوظة + أخيرة)
  List<Map<String, dynamic>> _savedShortcuts = [];
  List<({String label, double lat, double lng})> _recents = [];
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

  // ─── بحث الأماكن بالاسم (Google Places عبر الخادم) ───
  final TextEditingController _searchCtrl = TextEditingController();
  Timer? _searchDebounce;
  List<Map<String, dynamic>> _predictions = [];
  bool _searching = false;

  bool get _isDelivery => _selectedService?.serviceType == 'PackageDelivery';
  bool get _isHourly => _selectedService?.serviceType == 'HourlyChauffeur';

  /// الأجرة التقديرية الحالية لمعاينة الكوبون
  int get _estimatedFare {
    if (_isHourly && _selectedService?.hourlyRate != null) {
      return (_selectedService!.hourlyRate! * _bookedHours).round();
    }
    return (_routeFare ?? 0).round();
  }


  @override
  void initState() {
    super.initState();
    if (widget.presetDestination != null) {
      _destination = widget.presetDestination!;
      _destinationLabel = widget.presetDestinationLabel ?? tr('selectedDestination');
    }
    _initLocation();
    _loadMyCompany();
    _loadQuickPicks();
  }

  /// Phase 2 — يحمّل الأماكن المحفوظة (Home/Work) وآخر الوجهات لعرضها كاختصارات.
  Future<void> _loadQuickPicks() async {
    try {
      final client = await GraphQLClientManager.get();
      final saved = await client.query(QueryOptions(
        document: gql(savedPlacesQuery),
        fetchPolicy: FetchPolicy.cacheAndNetwork,
      ));
      final hist = await client.query(QueryOptions(
        document: gql(orderHistoryQuery),
        variables: {'limit': 12, 'offset': 0},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (!mounted) return;
      final places = (saved.data?['savedPlaces'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      final orders = (hist.data?['orderHistory'] as List<dynamic>? ?? [])
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final seen = <String>{};
      final recents = <({String label, double lat, double lng})>[];
      for (final o in orders) {
        if (o.points.length < 2) continue;
        final d = o.points.last;
        final label = o.destinationAddress;
        if (label == 'Unknown' || seen.contains(label)) continue;
        seen.add(label);
        recents.add((label: label, lat: d.lat, lng: d.lng));
        if (recents.length >= 5) break;
      }
      setState(() {
        _savedShortcuts = places;
        _recents = recents;
      });
    } catch (_) {
      // اختصارات اختيارية — تُتجاهل عند الفشل
    }
  }

  /// يثبّت وجهة مختارة (من اختصار/أخيرة) ويحرّك الكاميرا.
  Future<void> _chooseDestination(
      double lat, double lng, String label) async {
    FocusScope.of(context).unfocus();
    setState(() {
      _predictions = [];
      _searchCtrl.text = label;
      _destination = GeoPoint(lat: lat, lng: lng);
      _destinationLabel = label;
    });
    await _mapCtrl?.animateCamera(
      CameraUpdate.newLatLngZoom(LatLng(lat, lng), 16),
    );
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
      _detectRegion();
    } catch (_) {
      // تجاهل — نستخدم الموقع الافتراضي
    }
  }

  /// يكتشف منطقة الراكب من إحداثيات الالتقاط (يصحّح regionId والعملة).
  /// بدونه تُرسل الطلبات بمنطقة افتراضية خاطئة ⇒ "خارج المنطقة المحددة".
  Future<void> _detectRegion() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(nearestRegionQuery),
        variables: {'lat': _origin.lat, 'lng': _origin.lng},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final r = res.data?['nearestRegion'] as Map<String, dynamic>?;
      if (r == null || !mounted) return;
      setState(() {
        _regionId = (r['id'] as num).toInt();
        final cur = r['currency'] as String?;
        if (cur != null && cur.isNotEmpty) _routeCurrency = cur;
      });
      // أعِد تحميل الخدمات للمنطقة الصحيحة إن كانت مُحمّلة بمنطقة سابقة.
      if (_services.isNotEmpty) _loadServices();
    } catch (_) {
      // فشل الاكتشاف ⇒ نُبقي الافتراضي.
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
        variables: {'regionId': _regionId},
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

  // ─── بحث الأماكن ───
  void _onSearchChanged(String q) {
    _searchDebounce?.cancel();
    if (q.trim().length < 2) {
      setState(() => _predictions = []);
      return;
    }
    _searchDebounce = Timer(const Duration(milliseconds: 350), () => _runSearch(q));
  }

  Future<void> _runSearch(String q) async {
    setState(() => _searching = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(searchPlacesQuery),
        fetchPolicy: FetchPolicy.networkOnly,
        variables: {
          'query': q.trim(),
          // انحياز للموقع الحالي لنتائج أقرب
          'lat': _destination.lat,
          'lng': _destination.lng,
        },
      ));
      final list = (res.data?['searchPlaces'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      if (!mounted) return;
      setState(() {
        _predictions = list;
        _searching = false;
      });
    } catch (_) {
      if (mounted) setState(() => _searching = false);
    }
  }

  Future<void> _pickPrediction(Map<String, dynamic> p) async {
    FocusScope.of(context).unfocus();
    final title = p['title'] as String? ?? '';
    setState(() {
      _predictions = [];
      _searchCtrl.text = title;
    });
    // searchText يُرجع الإحداثيات مباشرة — نستخدمها فوراً (بلا نداء تفاصيل).
    double? lat = (p['lat'] as num?)?.toDouble();
    double? lng = (p['lng'] as num?)?.toDouble();
    String label = (p['subtitle'] as String?)?.isNotEmpty == true
        ? '$title — ${p['subtitle']}'
        : title;

    // احتياط: إن غابت الإحداثيات نجلبها عبر placeDetails.
    if (lat == null || lng == null) {
      setState(() => _searching = true);
      try {
        final client = await GraphQLClientManager.get();
        final res = await client.query(QueryOptions(
          document: gql(placeDetailsQuery),
          fetchPolicy: FetchPolicy.networkOnly,
          variables: {'placeId': p['placeId']},
        ));
        final d = res.data?['placeDetails'] as Map<String, dynamic>?;
        if (d != null) {
          lat = (d['lat'] as num).toDouble();
          lng = (d['lng'] as num).toDouble();
          label = (d['address'] as String?) ?? title;
        }
      } catch (_) {}
      if (mounted) setState(() => _searching = false);
    }

    if (lat == null || lng == null || !mounted) return;
    setState(() {
      _destination = GeoPoint(lat: lat!, lng: lng!);
      _destinationLabel = label;
    });
    await _mapCtrl?.animateCamera(
      CameraUpdate.newLatLngZoom(LatLng(lat, lng), 16),
    );
  }

  void _clearSearch() {
    _searchDebounce?.cancel();
    setState(() {
      _searchCtrl.clear();
      _predictions = [];
    });
    FocusScope.of(context).unfocus();
  }

  void _confirmDestination() {
    FocusScope.of(context).unfocus();
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
          _routeCurrency = d['currency'] as String? ?? _routeCurrency;
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
          regionId: _regionId,
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
    // مودال الحجز المسبق Cupertino (تحقّق ساعتين + سياسة إلغاء + Reserve).
    final categoryName = _selectedService?.displayName ?? tr('reservePrefix');
    final picked = await AdvancedReserveModal.show(context, categoryName);
    if (picked == null || !mounted) return;
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
          'regionId': _regionId,
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
          borderSide: BorderSide(color: AuroraColors.border),
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
            'regionId': _regionId,
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
    _searchDebounce?.cancel();
    _searchCtrl.dispose();
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
            ctx.push('/upcoming');
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
                  style: AuroraMapStyle.dark,
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
          // حقل البحث عن مكان بالاسم
          _searchField(),
          if (_predictions.isNotEmpty) ...[
            const SizedBox(height: AuroraSpacing.sm),
            ..._predictions.map(_predictionRow),
            const SizedBox(height: AuroraSpacing.sm),
            Divider(color: AuroraColors.border, height: AuroraSpacing.lg),
          ] else ...[
            // Phase 2 — اختصارات سريعة (Home/Work + آخر الوجهات)
            if (_searchCtrl.text.isEmpty &&
                (_savedShortcuts.isNotEmpty || _recents.isNotEmpty)) ...[
              const SizedBox(height: AuroraSpacing.sm),
              _quickPicks(),
              Divider(color: AuroraColors.border, height: AuroraSpacing.lg),
            ] else
              const SizedBox(height: AuroraSpacing.md),
          ],
          _routeRow(Icons.my_location, AuroraColors.success, _originLabel),
          // محطات وسيطة
          for (var i = 0; i < _stops.length; i++) ...[
            Divider(color: AuroraColors.border, height: AuroraSpacing.md),
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
                  icon: Icon(Icons.close,
                      color: AuroraColors.textSecondary, size: 18),
                  onPressed: () => setState(() => _stops.removeAt(i)),
                ),
              ],
            ),
          ],
          Divider(color: AuroraColors.border, height: AuroraSpacing.lg),
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

  Widget _searchField() {
    return Container(
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          const SizedBox(width: AuroraSpacing.md),
          _searching
              ? const Padding(
                  padding: EdgeInsets.all(2),
                  child: AuroraLoader(size: 18, stroke: 2),
                )
              : Icon(Icons.search, color: AuroraColors.textSecondary, size: 20),
          Expanded(
            child: TextField(
              controller: _searchCtrl,
              onChanged: _onSearchChanged,
              textInputAction: TextInputAction.search,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: InputDecoration(
                hintText: tr('searchPlaceHint'),
                hintStyle: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.textHint),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: AuroraSpacing.sm, vertical: 14),
              ),
            ),
          ),
          if (_searchCtrl.text.isNotEmpty)
            IconButton(
              icon: Icon(Icons.close,
                  color: AuroraColors.textSecondary, size: 18),
              onPressed: _clearSearch,
            ),
        ],
      ),
    );
  }

  /// Phase 2 — اختصارات Home/Work + آخر الوجهات (الحالة الفارغة).
  Widget _quickPicks() {
    final shortcuts = _savedShortcuts.where((p) {
      final t = (p['type'] as String?)?.toLowerCase();
      return t == 'home' || t == 'work';
    }).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (shortcuts.isNotEmpty) ...[
          const SizedBox(height: AuroraSpacing.sm),
          Wrap(
            spacing: AuroraSpacing.sm,
            runSpacing: AuroraSpacing.sm,
            children: shortcuts.map((p) {
              final isHome = (p['type'] as String?)?.toLowerCase() == 'home';
              return GestureDetector(
                onTap: () {
                  final lat = (p['lat'] as num?)?.toDouble();
                  final lng = (p['lng'] as num?)?.toDouble();
                  if (lat == null || lng == null) return;
                  _chooseDestination(lat, lng,
                      (p['label'] as String?) ?? (p['address'] as String? ?? ''));
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
                  decoration: BoxDecoration(
                    color: AuroraColors.ash,
                    borderRadius: BorderRadius.circular(AuroraRadius.pill),
                    border: Border.all(color: AuroraColors.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                          isHome
                              ? Icons.home_rounded
                              : Icons.work_outline_rounded,
                          size: 16,
                          color: AuroraColors.ember),
                      const SizedBox(width: 6),
                      Text(isHome ? tr('home') : tr('work'),
                          style: AuroraText.bodySmall
                              .copyWith(color: AuroraColors.pearl)),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: AuroraSpacing.xs),
        ],
        ..._recents.map(
          (r) => InkWell(
            onTap: () => _chooseDestination(r.lat, r.lng, r.label),
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(vertical: AuroraSpacing.sm),
              child: Row(
                children: [
                  Icon(Icons.history,
                      size: 18, color: AuroraColors.textSecondary),
                  const SizedBox(width: AuroraSpacing.md),
                  Expanded(
                    child: Text(r.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AuroraText.bodyMedium
                            .copyWith(color: AuroraColors.pearl)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _distLabel(int meters) {
    if (meters < 1000) return '$meters م';
    return '${(meters / 1000).toStringAsFixed(1)} كم';
  }

  Widget _predictionRow(Map<String, dynamic> p) {
    final title = p['title'] as String? ?? '';
    final subtitle = p['subtitle'] as String?;
    final dist = p['distanceMeters'] as int?;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _pickPrediction(p),
        borderRadius: BorderRadius.circular(AuroraRadius.sm),
        child: Padding(
          padding: const EdgeInsets.symmetric(
              horizontal: AuroraSpacing.sm, vertical: AuroraSpacing.md),
          child: Row(
            children: [
              Icon(Icons.place_outlined,
                  color: AuroraColors.ember, size: 20),
              const SizedBox(width: AuroraSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AuroraText.bodyMedium
                            .copyWith(color: AuroraColors.pearl)),
                    if (subtitle != null && subtitle.isNotEmpty)
                      Text(subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AuroraText.bodySmall),
                  ],
                ),
              ),
              if (dist != null) ...[
                const SizedBox(width: AuroraSpacing.sm),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.near_me_outlined,
                        color: AuroraColors.textSecondary, size: 14),
                    const SizedBox(height: 2),
                    Text(_distLabel(dist),
                        style: AuroraText.caption
                            .copyWith(color: AuroraColors.textSecondary)),
                  ],
                ),
              ],
            ],
          ),
        ),
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
                        ? '${tr('distance')} ${(_routeDistanceM! / 1000).toStringAsFixed(1)} ${tr('km')} • ${(_routeDurationS! / 60).ceil()} ${tr('minShort')}'
                        : '${tr('distance')} ~${_distanceKm().toStringAsFixed(1)} ${tr('km')}',
                style: AuroraText.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.md),

          if (_loadingServices)
            const Padding(
              padding: EdgeInsets.all(AuroraSpacing.xl),
              child: Center(child: AuroraLoader(size: 36)),
            )
          else if (_servicesError != null)
            _errorBox(_servicesError!)
          else
            ..._groupedServices(),

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
                    icon: Icon(Icons.remove_circle_outline,
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

          // ─── طريقة الدفع — تبقى ظاهرة (عرض نظيف مثل أوبر) ───
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

          // ─── خيارات إضافية (مطوية افتراضياً — تبسيط الواجهة) ───
          const SizedBox(height: AuroraSpacing.md),
          InkWell(
            onTap: () => setState(() => _showOptions = !_showOptions),
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
              decoration: BoxDecoration(
                color: AuroraColors.ash,
                borderRadius: BorderRadius.circular(AuroraRadius.md),
                border: Border.all(color: AuroraColors.border),
              ),
              child: Row(
                children: [
                  Icon(Icons.tune, size: 18, color: AuroraColors.ember),
                  const SizedBox(width: AuroraSpacing.sm),
                  Expanded(
                    child: Text(tr('moreOptions'),
                        style: AuroraText.bodyMedium
                            .copyWith(color: AuroraColors.pearl)),
                  ),
                  AnimatedRotation(
                    turns: _showOptions ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(Icons.keyboard_arrow_down,
                        size: 20, color: AuroraColors.textSecondary),
                  ),
                ],
              ),
            ),
          ),

          if (_showOptions) ...[
            const SizedBox(height: AuroraSpacing.md),

            // التفضيلات + الجدولة + المزايدة (للمشاوير فقط)
            if (!_isDelivery && !_isHourly) ...[
              Row(
                children: [
                  Expanded(
                    child: _prefChip(Icons.volume_off, tr('quietRide'),
                        _quietRide,
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
              _prefChip(
                Icons.family_restroom,
                tr('familyMode'),
                _familyMode,
                () => setState(() => _familyMode = !_familyMode),
              ),
              const SizedBox(height: AuroraSpacing.sm),
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
              _prefChip(Icons.gavel, tr('bidMode'), _bidMode,
                  () => setState(() => _bidMode = !_bidMode)),
              if (_bidMode) ...[
                const SizedBox(height: AuroraSpacing.sm),
                TextField(
                  controller: _bidPriceCtrl,
                  keyboardType: TextInputType.number,
                  style:
                      AuroraText.titleSmall.copyWith(color: AuroraColors.pearl),
                  decoration: InputDecoration(
                    hintText: tr('yourPrice'),
                    prefixIcon:
                        Icon(Icons.attach_money, color: AuroraColors.ember),
                    filled: true,
                    fillColor: AuroraColors.ash,
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AuroraRadius.md),
                      borderSide: BorderSide(color: AuroraColors.border),
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
                const SizedBox(height: AuroraSpacing.sm),
                InkWell(
                  onTap: _pickSchedule,
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AuroraSpacing.md,
                        vertical: AuroraSpacing.sm),
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
                            child: Icon(Icons.close,
                                size: 18, color: AuroraColors.textSecondary),
                          )
                        else
                          Icon(Icons.keyboard_arrow_down,
                              size: 18, color: AuroraColors.textSecondary),
                      ],
                    ),
                  ),
                ),
              ],
            ],

            // كود الخصم
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
                        decoration: _fieldDecoration(
                            tr('couponCode'), Icons.local_offer),
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
                            ? const AuroraLoader(size: 18, stroke: 2)
                            : Text(tr('apply')),
                      ),
                    ),
                  ],
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.md,
                      vertical: AuroraSpacing.sm),
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
                        child: Icon(Icons.close,
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
          ],

          // ─── شريط التفضيلات: الملف (Personal/Business) + الجدولة ───
          if (!_isDelivery && !_isHourly && !_bidMode) ...[
            const SizedBox(height: AuroraSpacing.md),
            Row(
              children: [
                Expanded(
                  child: _prefsPill(
                    icon: _businessProfile
                        ? Icons.business_center
                        : Icons.person_outline,
                    label: _businessProfile ? tr('business') : tr('personal'),
                    active: _businessProfile,
                    onTap: () {
                      setState(() {
                        _businessProfile = !_businessProfile;
                        _paymentMode = _businessProfile && _myCompany != null
                            ? 'Company'
                            : 'Cash';
                      });
                    },
                  ),
                ),
                const SizedBox(width: AuroraSpacing.sm),
                Expanded(
                  child: _prefsPill(
                    icon: Icons.schedule,
                    label: _scheduledAt != null
                        ? _formatSchedule(_scheduledAt!)
                        : tr('schedule'),
                    active: _scheduledAt != null,
                    onTap: _pickSchedule,
                  ),
                ),
              ],
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

  CarType _carTypeFor(ServiceModel s) {
    // تخصيص رندر السيارة حسب الفئة (يشمل فئات أوبر الجديدة).
    switch (s.nameEn) {
      case 'XL':
        return CarType.van;
      case 'Black':
      case 'VIP':
        return CarType.luxury;
      case 'Comfort':
        return CarType.suv;
    }
    if (s.isVip) return CarType.luxury;
    switch (s.serviceType) {
      case 'PackageDelivery':
        return CarType.van;
      case 'HourlyChauffeur':
        return CarType.luxury;
      default:
        return CarType.sedan;
    }
  }

  /// يجمّع الخدمات في أقسام بأسلوب أوبر (اقتصادي / مريح وفاخر / سعة وخاص).
  /// أي خدمة غير مصنّفة تظهر تحت "أخرى" حتى لا تختفي.
  List<Widget> _groupedServices() {
    const groups = <String, List<String>>{
      'economySection': ['Economy', 'Share'],
      'comfortSection': ['Comfort', 'Black', 'VIP'],
      'largeSection': ['XL', 'Parcel', 'Hourly'],
    };
    final widgets = <Widget>[];
    final shown = <int>{};
    groups.forEach((sectionKey, names) {
      final inGroup =
          _services.where((s) => names.contains(s.nameEn)).toList();
      if (inGroup.isEmpty) return;
      widgets.add(_sectionHeader(tr(sectionKey)));
      for (final s in inGroup) {
        widgets.add(_serviceRow(s));
        shown.add(s.id);
      }
    });
    final rest = _services.where((s) => !shown.contains(s.id)).toList();
    if (rest.isNotEmpty) {
      widgets.add(_sectionHeader(tr('otherSection')));
      widgets.addAll(rest.map(_serviceRow));
    }
    return widgets;
  }

  Widget _sectionHeader(String label) => Padding(
        padding: const EdgeInsets.only(
            top: AuroraSpacing.sm, bottom: AuroraSpacing.xs),
        child: Text(
          label,
          style: AuroraText.caption.copyWith(
            color: AuroraColors.textSecondary,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
        ),
      );

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
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AuroraRadius.sm + 2),
                boxShadow: selected ? AuroraShadows.iconGlow : null,
              ),
              child: CarArt(
                type: _carTypeFor(s),
                size: const Size(68, 46),
                radius: AuroraRadius.sm + 2,
              ),
            ),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.displayName, style: AuroraText.titleSmall),
                  const SizedBox(height: 2),
                  (selected && _routeFare != null)
                      ? CountUpText(
                          value: _routeFare!,
                          fractionDigits: 2,
                          suffix: ' $_routeCurrency',
                          style: AuroraText.bodySmall.copyWith(
                            color: AuroraColors.ember,
                            fontWeight: FontWeight.w700,
                          ),
                        )
                      : Text(
                          '${tr('startsFrom')} ${s.minimumFee.toStringAsFixed(0)} $_routeCurrency',
                          style: AuroraText.bodySmall.copyWith(
                            color: AuroraColors.textSecondary,
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

  /// كبسولة شريط التفضيلات (الملف / الجدولة).
  Widget _prefsPill({
    required IconData icon,
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return _prefChip(icon, label, active, onTap);
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
    // ورقة زجاجية قابلة للتمرير بحدّ أقصى للارتفاع — حتى يبقى زر الطلب
    // قابلاً للوصول دائماً مهما طال المحتوى (خدمات + تفضيلات + دفع + كوبون).
    final maxH = MediaQuery.of(context).size.height * 0.80;
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
        child: Container(
          width: double.infinity,
          constraints: BoxConstraints(maxHeight: maxH),
          decoration: BoxDecoration(
            color: AuroraColors.coal.withValues(alpha: 0.92),
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(
                top: BorderSide(color: AuroraColors.borderStrong)),
            boxShadow: const [
              BoxShadow(
                  color: Color(0x66000000),
                  blurRadius: 24,
                  offset: Offset(0, -8)),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // مقبض السحب
                Container(
                  margin: const EdgeInsets.only(top: AuroraSpacing.sm),
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AuroraColors.borderStrong,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(AuroraSpacing.lg,
                        AuroraSpacing.lg, AuroraSpacing.lg, AuroraSpacing.xl),
                    child: child,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
