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
  mutation VerifyOtp($phone: String!, $code: String!, $referralCode: String, $pendingToken: String, $deviceName: String, $platform: String) {
    verifyOtp(input: { phone: $phone, code: $code, referralCode: $referralCode, pendingToken: $pendingToken, deviceName: $deviceName, platform: $platform }) {
      accessToken
      isNewUser
      twoFactorRequired
      pendingToken
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

// ─── إكمال الدخول بالتحقق بخطوتين ───
const String verifyTwoFactorMutation = r'''
  mutation VerifyTwoFactor($pendingToken: String!, $code: String!, $deviceName: String, $platform: String) {
    verifyTwoFactor(pendingToken: $pendingToken, code: $code, deviceName: $deviceName, platform: $platform) {
      accessToken
      isNewUser
      rider { id phoneNumber firstName lastName }
    }
  }
''';

// ─── دخول الإيميل (OTP) ───
const String sendEmailOtpMutation = r'''
  mutation SendEmailOtp($email: String!) {
    sendEmailOtp(input: { email: $email }) {
      success
      message
      devOtp
    }
  }
''';

const String verifyEmailOtpMutation = r'''
  mutation VerifyEmailOtp($email: String!, $code: String!, $referralCode: String) {
    verifyEmailOtp(input: { email: $email, code: $code, referralCode: $referralCode }) {
      success
      needsPhone
      pendingToken
      accessToken
      isNewUser
      message
      rider { id phoneNumber firstName email balance currency banned active }
    }
  }
''';

// ─── دخول Google ───
const String googleAuthMutation = r'''
  mutation GoogleAuth($idToken: String!, $referralCode: String) {
    googleAuth(input: { idToken: $idToken, referralCode: $referralCode }) {
      success
      needsPhone
      pendingToken
      accessToken
      isNewUser
      message
      rider { id phoneNumber firstName email balance currency banned active }
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
