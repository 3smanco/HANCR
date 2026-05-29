const String sendOtpMutation = r'''
  mutation SendOtp($phone: String!) {
    sendOtp(phone: $phone) {
      success
      devOtp
    }
  }
''';

const String verifyOtpMutation = r'''
  mutation VerifyOtp($phone: String!, $otp: String!) {
    verifyOtp(phone: $phone, otp: $otp) {
      accessToken
      isNewUser
      rider {
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
      }
    }
  }
''';
