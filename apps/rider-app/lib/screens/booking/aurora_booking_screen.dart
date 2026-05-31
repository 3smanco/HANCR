import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:graphql_flutter/graphql_flutter.dart';

import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
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

  const AuroraBookingScreen({
    super.key,
    this.presetDestination,
    this.presetDestinationLabel,
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
  bool _bidMode = false;
  final TextEditingController _bidPriceCtrl = TextEditingController();
  bool _sendingBid = false;

  static const String _darkMapStyle = '''
[
  {"elementType":"geometry","stylers":[{"color":"#13100E"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#A89B96"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#0A0807"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#2A2421"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#3D3530"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#1F1A17"}]},
  {"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]}
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
      setState(() {
        _services = list;
        _selectedService = list.isNotEmpty ? list.first : null;
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
    if (_bidMode) {
      _sendBid(service);
      return;
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
        ));
  }

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
                const Center(
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
          const Divider(color: AuroraColors.border, height: AuroraSpacing.lg),
          _routeRow(Icons.location_on, AuroraColors.ember, _destinationLabel),
          const SizedBox(height: AuroraSpacing.lg),
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
            const Padding(
              padding: EdgeInsets.all(AuroraSpacing.xl),
              child: Center(
                  child: CircularProgressIndicator(color: AuroraColors.ember)),
            )
          else if (_servicesError != null)
            _errorBox(_servicesError!)
          else
            ..._services.map(_serviceRow),

          const SizedBox(height: AuroraSpacing.md),

          // التفضيلات
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
                    const Icon(Icons.attach_money, color: AuroraColors.ember),
                filled: true,
                fillColor: AuroraColors.ash,
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  borderSide: const BorderSide(color: AuroraColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  borderSide:
                      const BorderSide(color: AuroraColors.ember, width: 1.5),
                ),
              ),
            ),
          ],

          const SizedBox(height: AuroraSpacing.lg),
          AuroraButton.primary(
            label: _bidMode ? tr('sendBid') : tr('requestNow'),
            icon: _bidMode ? Icons.gavel : Icons.local_taxi,
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
              const Icon(Icons.check_circle,
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

  Widget _errorBox(String msg) {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.dangerBg,
        borderRadius: BorderRadius.circular(AuroraRadius.sm),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline,
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
      decoration: const BoxDecoration(
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
