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
