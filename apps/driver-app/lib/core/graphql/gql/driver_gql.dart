// ─── N5 — Live SDUI theme (public, no auth) ───
const String appThemeQuery = r'''
  query AppTheme {
    appTheme
  }
''';

// ─── N10 — Driver tools: daily earnings + demand heatmap ───
const String myDailyEarningsQuery = r'''
  query MyDailyEarnings($days: Int!) {
    myDailyEarnings(days: $days) { date amount }
  }
''';

const String demandZonesQuery = r'''
  query DemandZones {
    demandZones { lat lng weight }
  }
''';

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
      gender
      kidsApproved
      nightApproved
      approvalStatus
      rejectionReason
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
      gender
      kidsApproved
      nightApproved
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

const String driverAnnouncementsQuery = r'''
  query DriverAnnouncements {
    driverAnnouncements { id title body url createdAt }
  }
''';
