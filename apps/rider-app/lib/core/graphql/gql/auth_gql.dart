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
  mutation VerifyOtp($phone: String!, $code: String!) {
    verifyOtp(input: { phone: $phone, code: $code }) {
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
