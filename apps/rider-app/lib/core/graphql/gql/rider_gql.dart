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
      teamCode
      twoFactorEnabled
      googleLinked
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

// رابط رفع موقّع لصورة الملف الشخصي (presigned PUT) — يتبعه updateProfile(avatarUrl)
const String generateRiderUploadUrlMutation = r'''
  mutation GenerateRiderUploadUrl($input: GenerateRiderUploadUrlInput!) {
    generateRiderUploadUrl(input: $input) {
      uploadUrl
      publicUrl
      objectKey
      expiresIn
    }
  }
''';

const String nearestRegionQuery = r'''
  query NearestRegion($lat: Float!, $lng: Float!) {
    nearestRegion(lat: $lat, lng: $lng) {
      id
      name
      nameEn
      currency
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

// ─── Place search (Google Places عبر الخادم) ───
const String searchPlacesQuery = r'''
  query SearchPlaces($query: String!, $lat: Float, $lng: Float) {
    searchPlaces(query: $query, lat: $lat, lng: $lng) {
      placeId title subtitle lat lng distanceMeters
    }
  }
''';

const String placeDetailsQuery = r'''
  query PlaceDetails($placeId: String!) {
    placeDetails(placeId: $placeId) { lat lng address }
  }
''';

// ─── Reverse geocode (اسم الشارع من إحداثيات — لشاشة ضبط الالتقاط) ───
const String reverseGeocodeQuery = r'''
  query ReverseGeocode($lat: Float!, $lng: Float!) {
    reverseGeocode(lat: $lat, lng: $lng) { lat lng address }
  }
''';

// ─── Saved places (favorites) ───
const String savedPlacesQuery = r'''
  query SavedPlaces {
    savedPlaces { id label address lat lng type }
  }
''';

const String addSavedPlaceMutation = r'''
  mutation AddSavedPlace($input: SavedPlaceInput!) {
    addSavedPlace(input: $input) { id label address lat lng type }
  }
''';

const String deleteSavedPlaceMutation = r'''
  mutation DeleteSavedPlace($id: Int!) {
    deleteSavedPlace(id: $id)
  }
''';

// ─── App config (banners / SDUI) ───
const String appConfigQuery = r'''
  query AppConfig {
    appConfig {
      banners {
        id
        imageUrl
        title
        subtitle
        link
        order
      }
    }
  }
''';

// ─── N5 — Live SDUI theme (public, no auth) ───
const String appThemeQuery = r'''
  query AppTheme {
    appTheme
  }
''';

// ─── Coupons ───
const String validateCouponQuery = r'''
  query ValidateCoupon($code: String!, $fare: Int!, $regionId: Int!) {
    validateCoupon(code: $code, fare: $fare, regionId: $regionId) {
      code
      discountAmount
      costAfterCoupon
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

// ═══════════════════════════════════════════════
// الدفعة الثانية — العائلة / 2FA / الأجهزة
// ═══════════════════════════════════════════════

const String _poolFields = r'''
  id name type ownerId active isOwner createdAt
  members {
    id riderId riderName phone role
    monthlySpendLimit currentMonthSpend joinedAt
  }
''';

const String myPoolQuery = '''
  query MyPool {
    myPool { $_poolFields }
  }
''';

const String createFamilyMutation = '''
  mutation CreateFamily(\$name: String!) {
    createFamily(name: \$name) { $_poolFields }
  }
''';

const String inviteFamilyMemberMutation = '''
  mutation InviteFamilyMember(\$phone: String!, \$monthlySpendLimit: Float) {
    inviteFamilyMember(phone: \$phone, monthlySpendLimit: \$monthlySpendLimit) { $_poolFields }
  }
''';

const String updateFamilyMemberLimitMutation = '''
  mutation UpdateFamilyMemberLimit(\$memberId: Int!, \$monthlySpendLimit: Float) {
    updateFamilyMemberLimit(memberId: \$memberId, monthlySpendLimit: \$monthlySpendLimit) { $_poolFields }
  }
''';

const String removeFamilyMemberMutation = '''
  mutation RemoveFamilyMember(\$memberId: Int!) {
    removeFamilyMember(memberId: \$memberId) { $_poolFields }
  }
''';

const String leaveFamilyMutation = r'''
  mutation LeaveFamily { leaveFamily }
''';

const String deleteFamilyMutation = r'''
  mutation DeleteFamily { deleteFamily }
''';

// ─── التحقق بخطوتين (2FA) ───
const String startTwoFactorSetupMutation = r'''
  mutation StartTwoFactorSetup {
    startTwoFactorSetup { secret otpauthUri }
  }
''';

const String enableTwoFactorMutation = r'''
  mutation EnableTwoFactor($code: String!) {
    enableTwoFactor(code: $code) { recoveryCodes }
  }
''';

const String disableTwoFactorMutation = r'''
  mutation DisableTwoFactor($code: String!) {
    disableTwoFactor(code: $code)
  }
''';

// ─── الأجهزة / الجلسات ───
const String myDevicesQuery = r'''
  query MyDevices {
    myDevices { id deviceName platform lastActiveAt current createdAt }
  }
''';

const String revokeDeviceMutation = r'''
  mutation RevokeDevice($deviceId: Int!) {
    revokeDevice(deviceId: $deviceId)
  }
''';

const String revokeOtherDevicesMutation = r'''
  mutation RevokeOtherDevices {
    revokeOtherDevices
  }
''';

// ─── حذف الحساب (soft-delete) ───
const String requestAccountDeletionMutation = r'''
  mutation RequestAccountDeletion {
    requestAccountDeletion
  }
''';

// ═══════════════════════════════════════════════
// الدفعة الرابعة — المجموعات / الشكاوى / الأعمال
// ═══════════════════════════════════════════════

const String _groupFields = r'''
  id name type createdAt members { name phone }
''';

const String mySavedGroupsQuery = '''
  query MySavedGroups { mySavedGroups { $_groupFields } }
''';

const String createSavedGroupMutation = '''
  mutation CreateSavedGroup(\$name: String!, \$type: String, \$members: [SavedGroupMemberInput!]) {
    createSavedGroup(name: \$name, type: \$type, members: \$members) { $_groupFields }
  }
''';

const String updateSavedGroupMutation = '''
  mutation UpdateSavedGroup(\$id: Int!, \$name: String, \$type: String, \$members: [SavedGroupMemberInput!]) {
    updateSavedGroup(id: \$id, name: \$name, type: \$type, members: \$members) { $_groupFields }
  }
''';

const String deleteSavedGroupMutation = r'''
  mutation DeleteSavedGroup($id: Int!) { deleteSavedGroup(id: $id) }
''';

// ─── الشكاوى / الدعم ───
const String myComplaintsQuery = r'''
  query MyComplaints {
    myComplaints {
      id orderId category status description resolutionNote resolvedAt createdAt
      activities { id type note createdAt }
    }
  }
''';

const String submitComplaintMutation = r'''
  mutation SubmitComplaint($input: SubmitComplaintInput!) {
    submitComplaint(input: $input) { id category status createdAt }
  }
''';

const String replyToComplaintMutation = r'''
  mutation ReplyToComplaint($complaintId: Int!, $message: String!) {
    replyToComplaint(complaintId: $complaintId, message: $message)
  }
''';

// ─── شات الدعم الحي (راكب↔موظف) ───
const String mySupportConversationQuery = r'''
  query MySupportConversation {
    mySupportConversation { id status assignedAgentId lastMessageAt createdAt }
  }
''';

const String _supportMsgFields =
    r'id conversationId senderType senderId body imageUrl isRead createdAt';

const String supportMessagesQuery = '''
  query SupportMessages(\$conversationId: Int!) {
    supportMessages(conversationId: \$conversationId) { $_supportMsgFields }
  }
''';

const String sendSupportMessageMutation = '''
  mutation SendSupportMessage(\$conversationId: Int!, \$body: String!, \$imageUrl: String) {
    sendSupportMessage(conversationId: \$conversationId, body: \$body, imageUrl: \$imageUrl) { $_supportMsgFields }
  }
''';

const String supportMessageAddedSubscription = '''
  subscription SupportMessageAdded(\$conversationId: Int!) {
    supportMessageAdded(conversationId: \$conversationId) { $_supportMsgFields }
  }
''';

// ─── الأعمال (ملف الأعمال) — myCompanyQuery معرّف في company_gql.dart ───
const String setupBusinessProfileMutation = r'''
  mutation SetupBusinessProfile($name: String!, $billingEmail: String) {
    setupBusinessProfile(name: $name, billingEmail: $billingEmail) {
      companyId companyName companyBalance currency
      monthlyCapPerEmployee monthlySpent monthlyRemaining status
    }
  }
''';
