import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../blocs/location/location_bloc.dart';
import '../../../blocs/location/location_state.dart';
import '../../../blocs/order/order_bloc.dart';
import '../../../blocs/order/order_state.dart';
import '../../../core/config/app_config.dart';

class MapView extends StatefulWidget {
  const MapView({super.key});
  @override
  State<MapView> createState() => _MapViewState();
}

class _MapViewState extends State<MapView> {
  GoogleMapController? _ctrl;

  @override
  Widget build(BuildContext context) {
    return BlocListener<LocationBloc, LocationState>(
      listener: (ctx, state) {
        if (state is LocationTracking) {
          _ctrl?.animateCamera(
            CameraUpdate.newLatLng(LatLng(state.lat, state.lng)),
          );
        }
      },
      child: BlocBuilder<OrderBloc, OrderState>(
        builder: (ctx, orderState) {
          final markers = <Marker>{};

          if (orderState is OrderActive) {
            final order = orderState.order;
            if (order.points.isNotEmpty) {
              markers.add(Marker(
                markerId: const MarkerId('pickup'),
                position: LatLng(
                    order.points.first.lat, order.points.first.lng),
                icon: BitmapDescriptor.defaultMarkerWithHue(
                    BitmapDescriptor.hueGreen),
                infoWindow: const InfoWindow(title: 'Pickup'),
              ));
            }
            if (order.points.length > 1) {
              markers.add(Marker(
                markerId: const MarkerId('destination'),
                position:
                    LatLng(order.points.last.lat, order.points.last.lng),
                icon: BitmapDescriptor.defaultMarkerWithHue(
                    BitmapDescriptor.hueOrange),
                infoWindow: const InfoWindow(title: 'Destination'),
              ));
            }
          }

          return GoogleMap(
            onMapCreated: (ctrl) => _ctrl = ctrl,
            initialCameraPosition: const CameraPosition(
              target: LatLng(AppConfig.defaultLat, AppConfig.defaultLng),
              zoom: 14,
            ),
            markers: markers,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
          );
        },
      ),
    );
  }
}
