const String meQuery = r'''
  query Me {
    me {
      id
      phoneNumber
      countryCode
      firstName
      lastName
      avatarUrl
      email
      balance
      currency
      rating
      totalRides
      banned
      active
      lastLoginAt
      createdAt
    }
  }
''';

const String updateProfileMutation = r'''
  mutation UpdateProfile($input: UpdateRiderInput!) {
    updateProfile(input: $input) {
      id
      firstName
      lastName
      email
      avatarUrl
    }
  }
''';

const String servicesQuery = r'''
  query Services($regionId: Int!) {
    services(regionId: $regionId) {
      id
      name
      nameEn
      serviceType
      baseFare
      minimumFee
      hourlyRate
      bidModeEnabled
      enabled
      displayOrder
      iconUrl
      isVip
    }
  }
''';

const String walletQuery = r'''
  query MyWallet {
    myWallet {
      balance
      currency
    }
  }
''';

// معاينة المسار — مسافة الطريق الفعلية + الأجرة + polyline
const String routePreviewQuery = r'''
  query RoutePreview($input: RoutePreviewInput!) {
    routePreview(input: $input) {
      distanceMeters
      durationSeconds
      estimatedFare
      currency
      polyline
    }
  }
''';

// ─── Bid Mode (المزايدة) ───
const String createBidMutation = r'''
  mutation CreateBid($input: CreateBidInput!) {
    createBid(input: $input) {
      id status riderProposedPrice currency expiresAt
    }
  }
''';

const String activeBidQuery = r'''
  query ActiveBid {
    activeBid {
      id status riderProposedPrice currency expiresAt
      offers {
        id driverId driverName driverRating
        carBrand carModel carColor plateNumber
        offeredPrice currency status
      }
    }
  }
''';

const String acceptBidOfferMutation = r'''
  mutation AcceptBidOffer($offerId: Int!) {
    acceptBidOffer(offerId: $offerId) { id status }
  }
''';
