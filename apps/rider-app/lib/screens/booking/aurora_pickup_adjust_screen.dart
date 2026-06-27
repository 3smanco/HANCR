import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:graphql_flutter/graphql_flutter.dart';

import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/models/order_model.dart';
import '../../core/motion/haptics.dart';
import '../../core/theme/aurora_map_style.dart';
import '../../core/theme/aurora_theme.dart';
import '../../core/widgets/aurora/aurora_button.dart';

/// نتيجة شاشة ضبط الالتقاط: الإحداثيات المؤكَّدة + العنوان المُحلّل.
typedef PickupAdjustResult = ({GeoPoint point, String address});

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  AuroraPickupAdjustScreen — ضبط نقطة الالتقاء الدقيق           ║
/// ║                                                               ║
/// ║  خطوة إجبارية بعد اختيار الخدمة وقبل المطابقة:                  ║
/// ║  - خريطة كامل الشاشة بزووم مكثّف حول GPS الراكب.               ║
/// ║  - دبوس ember ثابت في المركز؛ تتحرك الخريطة تحته.              ║
/// ║  - Tooltip يعرض اسم الشارع الحيّ (reverseGeocode) أثناء السكون.║
/// ║  - مناطق ركوب معتمدة خضراء + Snap-to مغناطيسي لأقربها.         ║
/// ║  - زر «تأكيد الالتقاط» يُعيد الإحداثيات المقفلة لدورة الطلب.    ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraPickupAdjustScreen extends StatefulWidget {
  const AuroraPickupAdjustScreen({
    required this.initialOrigin,
    required this.originAddress,
    this.estimatedFare,
    this.currency = 'ر.س',
    this.pickupZones = const [],
    super.key,
  });

  /// نقطة الالتقاط الأولية (من GPS الجهاز / اختيار المستخدم).
  final GeoPoint initialOrigin;
  final String originAddress;

  /// السعر التقديري (من routePreview) — يُعرض في البطاقة السفلية إن توفّر.
  final double? estimatedFare;
  final String currency;

  /// مناطق الركوب المعتمدة (Designated Pickup Zones) للانجذاب المغناطيسي.
  final List<GeoPoint> pickupZones;

  @override
  State<AuroraPickupAdjustScreen> createState() =>
      _AuroraPickupAdjustScreenState();
}

class _AuroraPickupAdjustScreenState extends State<AuroraPickupAdjustScreen>
    with SingleTickerProviderStateMixin {
  GoogleMapController? _mapCtrl;
  late LatLng _center;
  late final AnimationController _pulseCtrl;

  bool _isDragging = false;
  bool _snapped = false; // مركز الشاشة منجذب لمنطقة ركوب معتمدة
  String? _streetName; // اسم الشارع الحيّ من reverseGeocode
  bool _resolving = false;
  Timer? _debounce;

  /// عتبة الانجذاب لمنطقة ركوب معتمدة (بالأمتار).
  static const double _snapRadiusMeters = 55;

  @override
  void initState() {
    super.initState();
    _center = LatLng(widget.initialOrigin.lat, widget.initialOrigin.lng);
    _streetName = widget.originAddress.isEmpty ? null : widget.originAddress;
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat();
    // حلّ اسم الشارع للنقطة الأولية.
    _resolveStreet(_center);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _pulseCtrl.dispose();
    _mapCtrl?.dispose();
    super.dispose();
  }

  // ── Reverse geocode (debounced) ─────────────────────────────────────────
  Future<void> _resolveStreet(LatLng at) async {
    setState(() => _resolving = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(
        QueryOptions(
          document: gql(reverseGeocodeQuery),
          variables: {'lat': at.latitude, 'lng': at.longitude},
          fetchPolicy: FetchPolicy.noCache,
        ),
      );
      final data = res.data?['reverseGeocode'] as Map<String, dynamic>?;
      final addr = data?['address'] as String?;
      if (mounted && addr != null && addr.trim().isNotEmpty) {
        setState(() => _streetName = addr.trim());
      }
    } catch (_) {
      /* فشل الشبكة — نُبقي آخر اسم معروف */
    } finally {
      if (mounted) setState(() => _resolving = false);
    }
  }

  // ── Snap-to nearest pickup zone ─────────────────────────────────────────
  /// مسافة هافرسين التقريبية بالأمتار.
  double _distanceMeters(LatLng a, LatLng b) {
    const r = 6371000.0;
    final dLat = (b.latitude - a.latitude) * math.pi / 180;
    final dLng = (b.longitude - a.longitude) * math.pi / 180;
    final la1 = a.latitude * math.pi / 180;
    final la2 = b.latitude * math.pi / 180;
    final h = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(la1) * math.cos(la2) * math.sin(dLng / 2) * math.sin(dLng / 2);
    return 2 * r * math.asin(math.min(1, math.sqrt(h)));
  }

  /// يبحث عن أقرب منطقة معتمدة ضمن العتبة ويلتصق بها مغناطيسياً.
  Future<void> _trySnap(LatLng at) async {
    if (widget.pickupZones.isEmpty) return;
    GeoPoint? nearest;
    double best = double.infinity;
    for (final z in widget.pickupZones) {
      final d = _distanceMeters(at, LatLng(z.lat, z.lng));
      if (d < best) {
        best = d;
        nearest = z;
      }
    }
    if (nearest != null && best <= _snapRadiusMeters) {
      final target = LatLng(nearest.lat, nearest.lng);
      // تفادي الالتصاق المتكرر إن كنا ملتصقين فعلاً.
      if (_distanceMeters(at, target) > 2) {
        await _mapCtrl?.animateCamera(CameraUpdate.newLatLng(target));
        await Haptics.selection();
      }
      if (mounted) setState(() => _snapped = true);
    } else if (_snapped && mounted) {
      setState(() => _snapped = false);
    }
  }

  // ── Map callbacks ───────────────────────────────────────────────────────
  void _onCameraMoveStarted() {
    _debounce?.cancel();
    if (!_isDragging) setState(() => _isDragging = true);
  }

  void _onCameraMove(CameraPosition pos) => _center = pos.target;

  void _onCameraIdle() {
    setState(() => _isDragging = false);
    final at = _center;
    // تأخير بسيط لتجميع حركات السحب المتتالية.
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 380), () async {
      await _trySnap(at);
      await _resolveStreet(_snapped ? _center : at);
    });
  }

  void _recenter() {
    _mapCtrl?.animateCamera(
      CameraUpdate.newLatLngZoom(
        LatLng(widget.initialOrigin.lat, widget.initialOrigin.lng),
        17,
      ),
    );
  }

  void _confirm() {
    Haptics.success();
    Navigator.of(context).pop<PickupAdjustResult>((
      point: GeoPoint(lat: _center.latitude, lng: _center.longitude),
      address: _streetName ?? widget.originAddress,
    ));
  }

  // ── Build ───────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: Stack(
        children: [
          _buildMap(),
          _buildCenterPin(),
          _buildTopBar(),
          _buildBottomSheet(),
        ],
      ),
    );
  }

  Widget _buildMap() {
    final zones = <Circle>{
      for (var i = 0; i < widget.pickupZones.length; i++)
        Circle(
          circleId: CircleId('zone_$i'),
          center: LatLng(widget.pickupZones[i].lat, widget.pickupZones[i].lng),
          radius: 12,
          fillColor: AuroraColors.success.withValues(alpha: 0.35),
          strokeColor: AuroraColors.success,
          strokeWidth: 2,
        ),
    };
    return GoogleMap(
      style: AuroraMapStyle.dark,
      initialCameraPosition: CameraPosition(target: _center, zoom: 17),
      onMapCreated: (c) => _mapCtrl = c,
      myLocationEnabled: false,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
      compassEnabled: false,
      circles: zones,
      onCameraMoveStarted: _onCameraMoveStarted,
      onCameraMove: _onCameraMove,
      onCameraIdle: _onCameraIdle,
    );
  }

  /// الدبوس المركزي الثابت بهوية Aurora (ember + glow + نبض).
  Widget _buildCenterPin() {
    final accent = _snapped ? AuroraColors.success : AuroraColors.ember;
    return IgnorePointer(
      child: Center(
        child: AnimatedBuilder(
          animation: _pulseCtrl,
          builder: (_, __) {
            final t = _pulseCtrl.value;
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // فقاعة Tooltip
                _Tooltip(
                  text: _isDragging
                      ? tr('pickupAdjustHint')
                      : (_resolving
                          ? tr('locatingPickup')
                          : (_streetName ?? tr('pickupAdjustHint'))),
                  snapped: _snapped,
                ),
                const SizedBox(height: 6),
                // الرأس: حلقة نبض + نقطة متوهّجة
                SizedBox(
                  width: 84,
                  height: 84,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 26 + 56 * t,
                        height: 26 + 56 * t,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: accent.withValues(alpha: 0.28 * (1 - t)),
                        ),
                      ),
                      AnimatedScale(
                        duration: const Duration(milliseconds: 180),
                        scale: _isDragging ? 1.18 : 1,
                        child: Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: accent,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: AuroraShadows.emberGlow,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // الجذع
                Container(
                  width: 2.5,
                  height: 16,
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // ظلّ أرضي صغير
                Container(
                  width: 10,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 42), // إزاحة لأعلى لمحاذاة الطرف بالمركز
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AuroraSpacing.lg),
          child: Row(
            children: [
              _CircleIconBtn(
                icon: Icons.arrow_back_rounded,
                onTap: () => Navigator.of(context).maybePop(),
              ),
              const Spacer(),
              _CircleIconBtn(
                icon: Icons.my_location_rounded,
                onTap: _recenter,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomSheet() {
    return Align(
      alignment: Alignment.bottomCenter,
      child: SafeArea(
        top: false,
        child: Container(
          margin: const EdgeInsets.all(AuroraSpacing.lg),
          padding: const EdgeInsets.all(AuroraSpacing.lg),
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.xl),
            border: Border.all(color: AuroraColors.border),
            boxShadow: AuroraShadows.cardDepth,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Icon(Icons.location_on_rounded,
                      color: AuroraColors.ember, size: 20),
                  const SizedBox(width: AuroraSpacing.sm),
                  Expanded(
                    child: Text(tr('pickupAdjustTitle'),
                        style: AuroraText.titleSmall),
                  ),
                ],
              ),
              const SizedBox(height: AuroraSpacing.xs),
              Text(
                _streetName ?? tr('pickupAdjustHint'),
                style: AuroraText.bodyMedium,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (_snapped) ...[
                const SizedBox(height: AuroraSpacing.sm),
                Row(
                  children: [
                    Icon(Icons.verified_rounded,
                        size: 16, color: AuroraColors.success),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        tr('pickupZoneNearby'),
                        style: AuroraText.bodySmall
                            .copyWith(color: AuroraColors.success),
                      ),
                    ),
                  ],
                ),
              ],
              if (widget.estimatedFare != null) ...[
                const SizedBox(height: AuroraSpacing.md),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
                  decoration: BoxDecoration(
                    color: AuroraColors.emberMute.withValues(alpha: 0.45),
                    borderRadius: BorderRadius.circular(AuroraRadius.sm),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.payments_rounded,
                          size: 18, color: AuroraColors.emberLight),
                      const SizedBox(width: AuroraSpacing.sm),
                      Expanded(
                        child: Text(tr('estimatedFareLabel'),
                            style: AuroraText.bodySmall
                                .copyWith(color: AuroraColors.textPrimary)),
                      ),
                      Text(
                        '${widget.estimatedFare!.toStringAsFixed(0)} ${widget.currency}',
                        style: AuroraText.titleSmall
                            .copyWith(color: AuroraColors.emberLight),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: AuroraSpacing.lg),
              AuroraButton.primary(
                label: tr('confirmPickup'),
                icon: Icons.check_rounded,
                onPressed: _confirm,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// فقاعة نصية سوداء صغيرة ملتصقة بالدبوس.
class _Tooltip extends StatelessWidget {
  const _Tooltip({required this.text, required this.snapped});
  final String text;
  final bool snapped;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 240),
      padding:
          const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: AuroraColors.obsidian.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
        border: Border.all(
          color: snapped ? AuroraColors.success : AuroraColors.borderGlow,
        ),
        boxShadow: AuroraShadows.cardDepth,
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: AuroraText.bodySmall.copyWith(
          color: AuroraColors.pearl,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _CircleIconBtn extends StatelessWidget {
  const _CircleIconBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AuroraColors.ash,
      shape: const CircleBorder(),
      elevation: 4,
      shadowColor: Colors.black54,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, color: AuroraColors.pearl, size: 22),
        ),
      ),
    );
  }
}
