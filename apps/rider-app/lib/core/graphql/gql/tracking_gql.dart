// Live tracking subscription — موقع السائق على الخريطة.

const String driverLocationUpdatedSubscription = r'''
  subscription DriverLocationUpdated($driverId: Int!) {
    driverLocationUpdated(driverId: $driverId) {
      driverId
      lat
      lng
      heading
      updatedAt
    }
  }
''';
