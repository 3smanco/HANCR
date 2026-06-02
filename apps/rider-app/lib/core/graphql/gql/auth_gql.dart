// Auth GraphQL — يطابق rider-api (input objects + field "code")

const String sendOtpMutation = r'''
  mutation SendOtp($phone: String!) {
    sendOtp(input: { phone: $phone }) {
      success
      message
      devOtp
    }
  }
''';

const String verifyOtpMutation = r'''
  mutation VerifyOtp($phone: String!, $code: String!, $referralCode: String) {
    verifyOtp(input: { phone: $phone, code: $code, referralCode: $referralCode }) {
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

const String myReferralQuery = r'''
  query MyReferral {
    myReferral {
      code
      referredCount
      rewardedCount
    }
  }
''';
