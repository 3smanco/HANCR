// Live tracking subscription — موقع السائق على الخريطة.

const String driverLocationUpdatedSubscription = r'''
  subscription DriverLocationUpdated($driverId: Int!, $orderId: Int!) {
    driverLocationUpdated(driverId: $driverId, orderId: $orderId) {
      driverId
      lat
      lng
      heading
      updatedAt
    }
  }
''';
