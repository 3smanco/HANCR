import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/models/order_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/aurora_map_style.dart';
import '../../core/widgets/hancr_widgets.dart';

/// PickupConfirmationScreen — تأكيد نقطة الالتقاء (Uber-style)
///
/// خريطة كاملة + bottom sheet ثابت بـ:
/// - عنوان النقطة + زر "تعديل"
/// - السعر التقديري
/// - CTA "تأكيد الالتقاط" violet
///
/// يتم استدعاؤها بعد اختيار الوجهة، وتعود بـ `GeoPoint` المؤكَّدة عند الـ pop.
class PickupConfirmationScreen extends StatefulWidget {
  const PickupConfirmationScreen({
    required this.initialOrigin,
    required this.destination,
    required this.originAddress,
    required this.destinationAddress,
    this.estimatedFare,
    this.estimatedEta,
    super.key,
  });

  final GeoPoint initialOrigin;
  final GeoPoint destination;
  final String originAddress;
  final String destinationAddress;
  final double? estimatedFare;
  final int? estimatedEta;

  @override
  State<PickupConfirmationScreen> createState() =>
      _PickupConfirmationScreenState();
}

class _PickupConfirmationScreenState extends State<PickupConfirmationScreen>
    with SingleTickerProviderStateMixin {
  GoogleMapController? _mapCtrl;
  late LatLng _pickupPin;
  late AnimationController _pulseCtrl;
  bool _isDragging = false;

  @override
  void initState() {
    super.initState();
    _pickupPin = LatLng(widget.initialOrigin.lat, widget.initialOrigin.lng);
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  void _confirm() {
    Navigator.of(context).pop(
      GeoPoint(lat: _pickupPin.latitude, lng: _pickupPin.longitude),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // ── Map ──
          GoogleMap(
            style: AuroraMapStyle.dark,
            initialCameraPosition: CameraPosition(
              target: _pickupPin,
              zoom: 16,
            ),
            onMapCreated: (c) => _mapCtrl = c,
            myLocationEnabled: false,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            onCameraMoveStarted: () => setState(() => _isDragging = true),
            onCameraMove: (pos) => _pickupPin = pos.target,
            onCameraIdle: () => setState(() => _isDragging = false),
          ),

          // ── Pulse pin (centered) ──
          Center(
            child: AnimatedBuilder(
              animation: _pulseCtrl,
              builder: (_, __) {
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    // Pulse ring
                    Container(
                      width: 80 * _pulseCtrl.value,
                      height: 80 * _pulseCtrl.value,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: HancrColors.violet.withValues(
                          alpha: 0.4 * (1 - _pulseCtrl.value),
                        ),
                      ),
                    ),
                    // Pin
                    AnimatedScale(
                      duration: const Duration(milliseconds: 200),
                      scale: _isDragging ? 1.15 : 1,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: HancrColors.navy,
                              borderRadius:
                                  BorderRadius.circular(HancrRadius.pill),
                              boxShadow: HancrShadows.card,
                            ),
                            child: const Text(
                              'حرّك للضبط',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          // Stem
                          Container(
                            width: 2,
                            height: 14,
                            color: HancrColors.navy,
                          ),
                          // Dot
                          Container(
                            width: 18,
                            height: 18,
                            decoration: BoxDecoration(
                              color: HancrColors.violet,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      HancrColors.violet.withValues(alpha: 0.5),
                                  blurRadius: 8,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // ── Top bar (back + recenter) ──
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(HancrSpacing.lg),
                child: Row(
                  children: [
                    HancrIconButton(
                      icon: Icons.arrow_back_rounded,
                      onPressed: () => Navigator.maybePop(context),
                      shadow: true,
                    ),
                    const Spacer(),
                    HancrIconButton(
                      icon: Icons.my_location_rounded,
                      onPressed: () => _mapCtrl?.animateCamera(
                        CameraUpdate.newLatLngZoom(
                          LatLng(
                            widget.initialOrigin.lat,
                            widget.initialOrigin.lng,
                          ),
                          16,
                        ),
                      ),
                      shadow: true,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Bottom sheet ──
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              top: false,
              child: Container(
                margin: const EdgeInsets.all(HancrSpacing.lg),
                padding: const EdgeInsets.all(HancrSpacing.lg),
                decoration: BoxDecoration(
                  color: HancrColors.surface,
                  borderRadius: BorderRadius.circular(HancrRadius.xxl),
                  boxShadow: HancrShadows.cardElevated,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Title
                    const Row(
                      children: [
                        Icon(
                          Icons.location_on_rounded,
                          color: HancrColors.violet,
                          size: 20,
                        ),
                        SizedBox(width: HancrSpacing.sm),
                        Expanded(
                          child: Text(
                            'تأكيد نقطة الالتقاء',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: HancrColors.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: HancrSpacing.sm),
                    Text(
                      widget.originAddress.isEmpty
                          ? 'حدِّد موقعك بدقة على الخريطة'
                          : widget.originAddress,
                      style: const TextStyle(
                        fontSize: 14,
                        color: HancrColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                    if (widget.estimatedFare != null) ...[
                      const SizedBox(height: HancrSpacing.lg),
                      Container(
                        padding: const EdgeInsets.all(HancrSpacing.md),
                        decoration: BoxDecoration(
                          color: HancrColors.violetLight.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(HancrRadius.md),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.payments_rounded,
                              size: 20,
                              color: HancrColors.violetDeep,
                            ),
                            const SizedBox(width: HancrSpacing.sm),
                            const Expanded(
                              child: Text(
                                'السعر التقديري',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: HancrColors.textPrimary,
                                ),
                              ),
                            ),
                            Text(
                              '${widget.estimatedFare!.toStringAsFixed(0)} ر.س',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: HancrColors.violetDeep,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: HancrSpacing.lg),
                    HancrButton.primary(
                      label: 'تأكيد الالتقاط',
                      icon: Icons.check_rounded,
                      onPressed: _confirm,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
