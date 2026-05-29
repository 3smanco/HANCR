const String driverSendOtpMutation = r'''
  mutation DriverSendOtp($phone: String!) {
    driverSendOtp(phone: $phone) {
      success
      message
      devOtp
    }
  }
''';

const String driverVerifyOtpMutation = r'''
  mutation DriverVerifyOtp($phone: String!, $code: String!) {
    driverVerifyOtp(phone: $phone, code: $code) {
      accessToken
      isNewDriver
      driver {
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
        balance
        currency
        regionId
      }
    }
  }
''';
