const String driverMeQuery = r'''
  query DriverMe {
    driverMe {
      id
      phoneNumber
      countryCode
      firstName
      lastName
      avatarUrl
      status
      active
      banned
      rating
      ratingCount
      carBrand
      carModel
      carColor
      plateNumber
      carYear
      carPhotoUrl
      balance
      currency
      regionId
      createdAt
    }
  }
''';

const String updateDriverProfileMutation = r'''
  mutation UpdateDriverProfile($input: UpdateDriverInput!) {
    updateDriverProfile(input: $input) {
      id
      firstName
      lastName
      avatarUrl
      carBrand
      carModel
      carColor
      plateNumber
      carYear
    }
  }
''';

const String goOnlineMutation = r'''
  mutation GoOnline {
    goOnline
  }
''';

const String goOfflineMutation = r'''
  mutation GoOffline {
    goOffline
  }
''';

const String updateLocationMutation = r'''
  mutation UpdateLocation($input: UpdateLocationInput!) {
    updateLocation(input: $input) {
      driverId
      lat
      lng
      heading
      updatedAt
    }
  }
''';

const String myStarsQuery = r'''
  query MyStars {
    myStars {
      id
      totalStars
      currentCommissionPercent
      completedRides
      averageRating
      starsFromRating
      starsFromLongTrips
      starsFromPeakHours
      starsFromNoCancel
      noCancelStreakWeeks
      starsToNextLevel
      nextCommissionPercent
      updatedAt
    }
  }
''';
