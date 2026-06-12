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
  mutation DriverVerifyOtp($phone: String!, $code: String!, $pendingToken: String) {
    driverVerifyOtp(phone: $phone, code: $code, pendingToken: $pendingToken) {
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

// ─── دخول الإيميل (OTP) ───
const String driverSendEmailOtpMutation = r'''
  mutation DriverSendEmailOtp($email: String!) {
    driverSendEmailOtp(email: $email) {
      success
      message
      devOtp
    }
  }
''';

const String driverVerifyEmailOtpMutation = r'''
  mutation DriverVerifyEmailOtp($email: String!, $code: String!) {
    driverVerifyEmailOtp(email: $email, code: $code) {
      success
      needsPhone
      pendingToken
      accessToken
      isNewDriver
      message
      driver { id phoneNumber firstName email status active banned currency }
    }
  }
''';

// ─── دخول Google ───
const String driverGoogleAuthMutation = r'''
  mutation DriverGoogleAuth($idToken: String!) {
    driverGoogleAuth(idToken: $idToken) {
      success
      needsPhone
      pendingToken
      accessToken
      isNewDriver
      message
      driver { id phoneNumber firstName email status active banned currency }
    }
  }
''';
