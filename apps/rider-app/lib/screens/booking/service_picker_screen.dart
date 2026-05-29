import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/models/order_model.dart';
import '../../core/models/service_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';

/// ServicePickerScreen — اختيار فئة السيارة (Uber "Choose a trip" style)
///
/// أعلى الشاشة: خريطة مع origin → destination route preview
/// أسفل: قائمة فئات قابلة للتمرير + CTA "Choose [tier]"
class ServicePickerScreen extends StatefulWidget {
  const ServicePickerScreen({
    required this.origin,
    required this.destination,
    required this.originAddress,
    required this.destinationAddress,
    required this.services,
    super.key,
  });

  final GeoPoint origin;
  final GeoPoint destination;
  final String originAddress;
  final String destinationAddress;
  final List<ServiceModel> services;

  @override
  State<ServicePickerScreen> createState() => _ServicePickerScreenState();
}

class _ServicePickerScreenState extends State<ServicePickerScreen> {
  int _selectedIdx = 0;
  GoogleMapController? _mapCtrl;

  ServiceModel get _selected => widget.services[_selectedIdx];

  @override
  void initState() {
    super.initState();
    // Auto-pick the cheapest tier (lowest baseFare) by default
    if (widget.services.isNotEmpty) {
      _selectedIdx = 0;
      double min = widget.services.first.baseFare;
      for (var i = 1; i < widget.services.length; i++) {
        if (widget.services[i].baseFare < min) {
          min = widget.services[i].baseFare;
          _selectedIdx = i;
        }
      }
    }
  }

  void _fitMapToRoute() {
    if (_mapCtrl == null) return;
    final bounds = LatLngBounds(
      southwest: LatLng(
        widget.origin.lat < widget.destination.lat
            ? widget.origin.lat
            : widget.destination.lat,
        widget.origin.lng < widget.destination.lng
            ? widget.origin.lng
            : widget.destination.lng,
      ),
      northeast: LatLng(
        widget.origin.lat > widget.destination.lat
            ? widget.origin.lat
            : widget.destination.lat,
        widget.origin.lng > widget.destination.lng
            ? widget.origin.lng
            : widget.destination.lng,
      ),
    );
    _mapCtrl!.animateCamera(CameraUpdate.newLatLngBounds(bounds, 80));
  }

  IconData _iconForService(ServiceModel s) {
    final name = s.name.toLowerCase();
    if (name.contains('eco') || name.contains('econ')) {
      return Icons.directions_car_rounded;
    }
    if (name.contains('plus') || name.contains('premier')) {
      return Icons.local_taxi_rounded;
    }
    if (name.contains('xl') || name.contains('van')) {
      return Icons.airport_shuttle_rounded;
    }
    if (name.contains('moto') || name.contains('bike')) {
      return Icons.two_wheeler_rounded;
    }
    return Icons.local_taxi_rounded;
  }

  String _etaLabel(ServiceModel s, int idx) {
    // simple deterministic mock per-tier ETA
    final base = 2 + idx;
    return '$base د • وصول قريب';
  }

  String? _badgeFor(int idx) {
    if (widget.services.length < 2) return null;
    if (idx == 0) return 'أرخص';
    if (idx == _selectedIdx && idx != 0) return 'أسرع';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HancrColors.background,
      body: Stack(
        children: [
          // ── Map ──
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: MediaQuery.of(context).size.height * 0.42,
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: LatLng(widget.origin.lat, widget.origin.lng),
                zoom: 14,
              ),
              onMapCreated: (c) {
                _mapCtrl = c;
                Future.delayed(
                  const Duration(milliseconds: 300),
                  _fitMapToRoute,
                );
              },
              markers: {
                Marker(
                  markerId: const MarkerId('origin'),
                  position: LatLng(widget.origin.lat, widget.origin.lng),
                  icon: BitmapDescriptor.defaultMarkerWithHue(
                    BitmapDescriptor.hueAzure,
                  ),
                ),
                Marker(
                  markerId: const MarkerId('destination'),
                  position: LatLng(
                    widget.destination.lat,
                    widget.destination.lng,
                  ),
                  icon: BitmapDescriptor.defaultMarkerWithHue(
                    BitmapDescriptor.hueViolet,
                  ),
                ),
              },
              polylines: {
                Polyline(
                  polylineId: const PolylineId('route'),
                  color: HancrColors.violet,
                  width: 4,
                  points: [
                    LatLng(widget.origin.lat, widget.origin.lng),
                    LatLng(widget.destination.lat, widget.destination.lng),
                  ],
                ),
              },
              myLocationEnabled: false,
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              mapToolbarEnabled: false,
            ),
          ),

          // ── Back button ──
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
                  ],
                ),
              ),
            ),
          ),

          // ── Bottom sheet (fixed) ──
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              decoration: const BoxDecoration(
                color: HancrColors.surface,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(HancrRadius.xxl),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x14000000),
                    blurRadius: 24,
                    offset: Offset(0, -8),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Drag handle
                    Container(
                      margin: const EdgeInsets.only(top: HancrSpacing.sm),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: HancrColors.borderStrong,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    // Title row
                    Padding(
                      padding: const EdgeInsets.fromLTRB(
                        HancrSpacing.lg,
                        HancrSpacing.md,
                        HancrSpacing.lg,
                        HancrSpacing.sm,
                      ),
                      child: Row(
                        children: [
                          const Expanded(
                            child: Text(
                              'اختر فئة الرحلة',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: HancrColors.textPrimary,
                              ),
                            ),
                          ),
                          HancrPillFilter(
                            label: 'الآن',
                            icon: Icons.access_time_rounded,
                            onTap: () {},
                            trailingIcon: Icons.keyboard_arrow_down_rounded,
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1, color: HancrColors.divider),
                    // List of options (scrollable)
                    ConstrainedBox(
                      constraints: BoxConstraints(
                        maxHeight:
                            MediaQuery.of(context).size.height * 0.38,
                      ),
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(
                          horizontal: HancrSpacing.lg,
                          vertical: HancrSpacing.md,
                        ),
                        itemCount: widget.services.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: HancrSpacing.sm),
                        itemBuilder: (_, idx) {
                          final s = widget.services[idx];
                          return HancrTripOption(
                            tierName: s.name,
                            priceLabel:
                                '${s.baseFare.toStringAsFixed(0)} ر.س',
                            eta: _etaLabel(s, idx),
                            subtitle: s.isVip ? 'فاخر — راحة قصوى' : null,
                            icon: _iconForService(s),
                            selected: idx == _selectedIdx,
                            badge: _badgeFor(idx),
                            onTap: () => setState(() => _selectedIdx = idx),
                          );
                        },
                      ),
                    ),
                    // CTA
                    Padding(
                      padding: const EdgeInsets.all(HancrSpacing.lg),
                      child: HancrButton.primary(
                        label: 'اختر ${_selected.name}',
                        icon: Icons.arrow_forward_rounded,
                        onPressed: () => Navigator.of(context).pop(_selected),
                      ),
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
