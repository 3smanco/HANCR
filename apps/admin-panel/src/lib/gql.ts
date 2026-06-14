/**
 * GraphQL operations for HANCR admin-api (port 3002)
 *
 * IMPORTANT: All field names match the actual admin-api schema as introspected
 * on 2026-05-28. Do not rename without verifying via `__type` introspection.
 */
import { gql } from '@apollo/client';

// ─── GEOGRAPHY (الطبقة العالمية — فلتر الدولة/المدينة) ───────────────────────

export const LIST_COUNTRIES = gql`
  query Countries($onlyEnabled: Boolean) {
    countries(onlyEnabled: $onlyEnabled) {
      id iso2 name nameEn currency timezone flag dialCode units enabled cityCount
    }
  }
`;

export const LIST_CITIES = gql`
  query Cities($filter: CitiesFilterInput, $onlyEnabled: Boolean) {
    cities(filter: $filter, onlyEnabled: $onlyEnabled) {
      id countryId name nameEn timezone enabled
    }
  }
`;

export const GLOBAL_LIVE_OVERVIEW = gql`
  query GlobalLiveOverview {
    globalLiveOverview {
      totalOnlineDrivers
      totalActiveOrders
      activeCountries
      countries {
        countryId iso2 name nameEn flag currency timezone
        centerLat centerLng enabled onlineDrivers activeOrders
      }
    }
  }
`;

export const GLOBAL_REVENUE_MATRIX = gql`
  query GlobalRevenueMatrix($days: Int) {
    globalRevenueMatrix(days: $days) {
      baseCurrency totalRevenueBase totalPlatformBase periodDays fxSource fxLastSync
      countries {
        countryId iso2 name nameEn flag currency orders
        revenueNative revenueBase platformNative platformBase growthPct
      }
    }
  }
`;

// ─── AUTH ──────────────────────────────────────────────────────────────────

// ─── OPERATORS / RBAC (Phase I5) ──────────────────────────────────────────

export const LIST_OPERATORS = gql`
  query AdminOperators {
    adminOperators {
      id email fullName role active lastLoginAt createdAt
    }
  }
`;

export const CREATE_OPERATOR = gql`
  mutation CreateOperator($input: CreateOperatorInput!) {
    createOperator(input: $input) {
      id email fullName role active createdAt
    }
  }
`;

export const UPDATE_OPERATOR = gql`
  mutation UpdateOperator($input: UpdateOperatorInput!) {
    updateOperator(input: $input) {
      id email fullName role active
    }
  }
`;

export const RESET_OPERATOR_PASSWORD = gql`
  mutation ResetOperatorPassword($input: ResetOperatorPasswordInput!) {
    resetOperatorPassword(input: $input) { id email }
  }
`;

export const DELETE_OPERATOR = gql`
  mutation DeleteOperator($id: Int!) {
    deleteOperator(id: $id)
  }
`;

// ─── MARKETING (Phase I6) ──────────────────────────────────────────────────

// Announcements
export const LIST_ANNOUNCEMENTS = gql`
  query AdminAnnouncements {
    adminAnnouncements {
      id title body target url startsAt endsAt active createdAt
    }
  }
`;

export const CREATE_ANNOUNCEMENT = gql`
  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
    createAnnouncement(input: $input) {
      id title target active startsAt endsAt
    }
  }
`;

export const UPDATE_ANNOUNCEMENT = gql`
  mutation UpdateAnnouncement($input: UpdateAnnouncementInput!) {
    updateAnnouncement(input: $input) {
      id title body target url startsAt endsAt active
    }
  }
`;

export const DELETE_ANNOUNCEMENT = gql`
  mutation DeleteAnnouncement($id: Int!) {
    deleteAnnouncement(id: $id)
  }
`;

// Gift batches
export const LIST_GIFT_BATCHES = gql`
  query AdminGiftBatches {
    adminGiftBatches {
      id name amount currency totalCount claimedCount expiresAt createdAt
    }
  }
`;

export const CREATE_GIFT_BATCH = gql`
  mutation CreateGiftBatch($input: CreateGiftBatchInput!) {
    createGiftBatch(input: $input) {
      batch {
        id name amount currency totalCount claimedCount expiresAt createdAt
      }
      codes
    }
  }
`;

export const GIFT_BATCH_CODES = gql`
  query GiftBatchCodes($batchId: Int!) {
    giftBatchCodes(batchId: $batchId)
  }
`;

// ─── PAYOUTS (Phase I4) ────────────────────────────────────────────────────

export const ELIGIBLE_DRIVERS = gql`
  query EligibleDrivers {
    eligibleDrivers {
      driverId driverName phoneNumber balance currency
      defaultPayoutMethodId defaultMethodSummary
    }
  }
`;

export const LIST_PAYOUT_SESSIONS = gql`
  query PayoutSessions {
    payoutSessions {
      id initiatedBy totalAmount currency driverCount mode status
      note createdAt completedAt
    }
  }
`;

export const PAYOUT_SESSION_DETAIL = gql`
  query PayoutSession($id: Int!) {
    payoutSession(id: $id) {
      id initiatedBy totalAmount currency driverCount mode status
      note createdAt completedAt
      entries {
        id sessionId driverId driverName driverPhone amount
        payoutMethodId methodSummary status gatewayRef errorMessage
        createdAt completedAt
      }
    }
  }
`;

export const CREATE_PAYOUT_SESSION = gql`
  mutation CreatePayoutSession($input: CreatePayoutSessionInput!) {
    createPayoutSession(input: $input) {
      id totalAmount currency driverCount status
      entries { id driverId amount status }
    }
  }
`;

export const PROCESS_PAYOUT_SESSION = gql`
  mutation ProcessPayoutSession($id: Int!) {
    processPayoutSession(id: $id) {
      id status completedAt
      entries { id status errorMessage completedAt }
    }
  }
`;

// ─── LIVE MAP (Phase I8) ───────────────────────────────────────────────────

export const LIVE_DRIVERS = gql`
  query LiveDrivers {
    liveDrivers {
      total idle inRide
      drivers {
        driverId driverName driverPhone plateNumber carBrand carModel
        lat lng heading status currentOrderId
      }
    }
  }
`;

// ─── SYSTEM SETTINGS (Phase I7) ────────────────────────────────────────────

export const CANCEL_REASONS = gql`
  query CancelReasons {
    cancelReasons {
      id code labelAr labelEn appliesTo sortOrder active createdAt
    }
  }
`;

export const UPSERT_CANCEL_REASON = gql`
  mutation UpsertCancelReason($input: UpsertCancelReasonInput!) {
    upsertCancelReason(input: $input) {
      id code labelAr labelEn appliesTo sortOrder active
    }
  }
`;

export const DELETE_CANCEL_REASON = gql`
  mutation DeleteCancelReason($id: Int!) {
    deleteCancelReason(id: $id)
  }
`;

export const REVIEW_PARAMETERS = gql`
  query ReviewParameters {
    reviewParameters {
      id code labelAr labelEn target sortOrder active createdAt
    }
  }
`;

export const UPSERT_REVIEW_PARAMETER = gql`
  mutation UpsertReviewParameter($input: UpsertReviewParameterInput!) {
    upsertReviewParameter(input: $input) {
      id code labelAr labelEn target sortOrder active
    }
  }
`;

export const DELETE_REVIEW_PARAMETER = gql`
  mutation DeleteReviewParameter($id: Int!) {
    deleteReviewParameter(id: $id)
  }
`;

// ─── FLEETS (Phase I10) ────────────────────────────────────────────────────

export const LIST_FLEETS = gql`
  query AdminFleets {
    adminFleets {
      id name ownerName contactPhone contactEmail
      balance currency commissionPercent exclusivityRegionIds
      active driverCount createdAt
    }
  }
`;

export const FLEET_DRIVERS = gql`
  query FleetDrivers($fleetId: Int!) {
    fleetDrivers(fleetId: $fleetId) {
      driverId driverName phoneNumber plateNumber approvalStatus
    }
  }
`;

export const CREATE_FLEET = gql`
  mutation CreateFleet($input: CreateFleetInput!) {
    createFleet(input: $input) {
      id name balance currency commissionPercent active
    }
  }
`;

export const UPDATE_FLEET = gql`
  mutation UpdateFleet($input: UpdateFleetInput!) {
    updateFleet(input: $input) {
      id name commissionPercent exclusivityRegionIds active
    }
  }
`;

export const TOP_UP_FLEET = gql`
  mutation TopUpFleet($input: TopUpFleetInput!) {
    topUpFleet(input: $input) {
      id balance currency
    }
  }
`;

export const DELETE_FLEET = gql`
  mutation DeleteFleet($id: Int!) {
    deleteFleet(id: $id)
  }
`;

export const ASSIGN_DRIVER_TO_FLEET = gql`
  mutation AssignDriverToFleet($input: AssignDriverToFleetInput!) {
    assignDriverToFleet(input: $input) {
      driverId driverName phoneNumber approvalStatus
    }
  }
`;

export const UNASSIGN_DRIVER_FROM_FLEET = gql`
  mutation UnassignDriverFromFleet($driverId: Int!) {
    unassignDriverFromFleet(driverId: $driverId)
  }
`;

// ─── PRICING ZONES (Phase I11) ─────────────────────────────────────────────

export const PRICING_ZONES = gql`
  query PricingZones {
    pricingZones {
      id name regionId serviceId fleetId
      baseFare perKm perMinute multiplier
      startsAt endsAt polygon active createdAt
    }
  }
`;

export const UPSERT_PRICING_ZONE = gql`
  mutation UpsertPricingZone($input: UpsertPricingZoneInput!) {
    upsertPricingZone(input: $input) {
      id name regionId serviceId fleetId
      baseFare perKm perMinute multiplier active
    }
  }
`;

export const DELETE_PRICING_ZONE = gql`
  mutation DeletePricingZone($id: Int!) {
    deletePricingZone(id: $id)
  }
`;

// Referrals
export const REFERRAL_STATS = gql`
  query AdminReferralStats {
    adminReferralStats {
      totalInvited
      topReferrers {
        riderId name phone referralCode invitedCount
      }
    }
  }
`;

export const ADMIN_LOGIN = gql`
  mutation AdminLogin($email: String!, $password: String!) {
    adminLogin(email: $email, password: $password) {
      accessToken
      email
      role
      fullName
    }
  }
`;

// ─── DASHBOARD / ANALYTICS ─────────────────────────────────────────────────

export const DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboardStats {
      totalRiders
      totalDrivers
      activeDrivers
      pendingDriverApprovals
      totalOrders
      completedOrders
      canceledOrders
      totalRevenue
      platformRevenue
    }
  }
`;

export const REVENUE_CHART = gql`
  query RevenueStats($days: Int!) {
    revenueStats(days: $days) {
      date
      orderCount
      revenue
      platformRevenue
    }
  }
`;

// ─── RIDERS ────────────────────────────────────────────────────────────────

export const LIST_RIDERS = gql`
  query AdminListRiders($page: Int!, $limit: Int!) {
    adminListRiders(page: $page, limit: $limit) {
      items {
        id
        firstName
        lastName
        phoneNumber
        email
        rating
        totalRides
        balance
        currency
        active
        banned
        createdAt
      }
      total
      page
      limit
    }
  }
`;

export const BAN_RIDER = gql`
  mutation BanRider($id: Int!, $reason: String!) {
    banRider(id: $id, reason: $reason) {
      id
      banned
    }
  }
`;

export const UNBAN_RIDER = gql`
  mutation UnbanRider($id: Int!) {
    unbanRider(id: $id) {
      id
      banned
    }
  }
`;

export const CREATE_RIDER = gql`
  mutation AdminCreateRider($input: AdminCreateRiderInput!) {
    adminCreateRider(input: $input) {
      id
      firstName
      phoneNumber
    }
  }
`;

export const UPDATE_RIDER = gql`
  mutation AdminUpdateRider($input: AdminUpdateRiderInput!) {
    adminUpdateRider(input: $input) {
      id
      firstName
      lastName
      email
      phoneNumber
    }
  }
`;

// ─── DRIVERS ───────────────────────────────────────────────────────────────

export const LIST_DRIVERS = gql`
  query AdminListDrivers($page: Int!, $limit: Int!, $pendingOnly: Boolean) {
    adminListDrivers(page: $page, limit: $limit, pendingOnly: $pendingOnly) {
      items {
        id
        firstName
        lastName
        phoneNumber
        status
        rating
        ratingCount
        balance
        currency
        active
        banned
        carBrand
        carModel
        carYear
        carColor
        plateNumber
        createdAt
        gender
        kidsApproved
        nightApproved
        approvalStatus
        rejectionReason
      }
      total
      page
      limit
    }
  }
`;

// ─── DRIVER DETAIL (Phase I1) ──────────────────────────────────────────────

export const DRIVER_DETAIL = gql`
  query AdminDriverDetail($id: Int!) {
    adminDriverDetail(id: $id) {
      id firstName lastName phoneNumber avatarUrl status
      active banned rating ratingCount
      carBrand carModel carColor plateNumber carYear
      balance currency gender
      kidsApproved nightApproved approvalStatus rejectionReason
      createdAt
      documents {
        id type url expiresAt status rejectedReason
        uploadedAt reviewedAt reviewedBy
      }
      recentOrders { id type status cost currency createdOn }
      recentTransactions {
        id type direction amount balanceAfter currency status
        description createdAt
      }
      reviews { id orderId rating comment createdAt }
    }
  }
`;

export const SET_DRIVER_STATUS = gql`
  mutation SetDriverStatus($input: SetDriverStatusInput!) {
    setDriverStatus(input: $input) {
      id approvalStatus rejectionReason active
    }
  }
`;

export const REVIEW_DRIVER_DOCUMENT = gql`
  mutation ReviewDriverDocument($input: ReviewDocumentInput!) {
    reviewDriverDocument(input: $input) {
      id status rejectedReason reviewedAt
    }
  }
`;

// ─── ORDER DETAIL (Phase I2) ───────────────────────────────────────────────

export const ORDER_DETAIL = gql`
  query AdminOrderDetail($id: Int!) {
    adminOrderDetail(id: $id) {
      id type status currency
      riderId riderName riderPhone
      driverId driverName driverPhone
      serviceId serviceName regionId
      points { lat lng }
      addresses distanceBest durationBest
      costBest costAfterCoupon paidAmount providerShare discountAmount
      couponCode paymentMode
      familyMode preferFemaleDriver nightShift
      preferredDriverId bookedHours entitlementId companyId
      startTimestamp finishTimestamp etaPickup createdOn
      activities { id type createdAt }
      messages { id senderType senderId message sentAt }
    }
  }
`;

export const ORDER_CANDIDATES = gql`
  query AdminOrderCandidates($orderId: Int!) {
    adminOrderCandidates(orderId: $orderId) {
      driverId driverName driverPhone distanceMeters etaMinutes status
    }
  }
`;

export const ASSIGN_DRIVER = gql`
  mutation AdminAssignDriver($orderId: Int!, $driverId: Int!) {
    adminAssignDriver(orderId: $orderId, driverId: $driverId) {
      id status driverId driverName
    }
  }
`;

// ─── WALLETS DASHBOARD (Phase I3) ──────────────────────────────────────────

export const WALLET_BALANCES = gql`
  query AdminWalletBalances(
    $ownerType: WalletOwnerType!
    $page: Int!
    $limit: Int!
    $search: String
  ) {
    adminWalletBalances(
      ownerType: $ownerType
      page: $page
      limit: $limit
      search: $search
    ) {
      items {
        ownerId ownerType name phone balance currency status
      }
      total page limit
    }
  }
`;

export const WALLET_TRANSACTIONS = gql`
  query AdminWalletTransactions(
    $ownerType: WalletOwnerType!
    $ownerId: Int!
    $limit: Int!
    $offset: Int!
  ) {
    adminWalletTransactions(
      ownerType: $ownerType
      ownerId: $ownerId
      limit: $limit
      offset: $offset
    ) {
      items {
        id type direction amount balanceAfter currency status
        gateway orderId description createdAt completedAt
      }
      total totalCredits totalDebits
    }
  }
`;

export const ADJUST_WALLET = gql`
  mutation AdminAdjustWallet($input: AdjustWalletInput!) {
    adminAdjustWallet(input: $input) {
      id type direction amount balanceAfter currency status
      description createdAt
    }
  }
`;

// ─── COMPLAINTS INBOX (Phase I9) ───────────────────────────────────────────

export const LIST_COMPLAINTS = gql`
  query AdminComplaints($page: Int!, $limit: Int!, $status: String) {
    adminComplaints(page: $page, limit: $limit, status: $status) {
      items {
        id orderId reportedByType reportedById reporterName
        category description status resolutionNote
        createdAt resolvedAt
      }
      total page limit submittedCount underReviewCount
    }
  }
`;

export const COMPLAINT_DETAIL = gql`
  query AdminComplaintDetail($id: Int!) {
    adminComplaintDetail(id: $id) {
      id orderId reportedByType reportedById reporterName
      category description status resolutionNote
      createdAt resolvedAt
      activities {
        id actorType actorId type note createdAt
      }
    }
  }
`;

export const UPDATE_COMPLAINT_STATUS = gql`
  mutation UpdateComplaintStatus($input: UpdateComplaintStatusInput!) {
    updateComplaintStatus(input: $input) {
      id status resolutionNote resolvedAt
      activities { id actorType type note createdAt }
    }
  }
`;

export const ADD_COMPLAINT_NOTE = gql`
  mutation AddComplaintNote($input: AddComplaintNoteInput!) {
    addComplaintNote(input: $input) {
      id activities { id actorType type note createdAt }
    }
  }
`;

export const SET_DRIVER_APPROVAL = gql`
  mutation SetDriverApproval(
    $driverId: Int!
    $kidsApproved: Boolean
    $nightApproved: Boolean
  ) {
    setDriverApproval(
      driverId: $driverId
      kidsApproved: $kidsApproved
      nightApproved: $nightApproved
    ) {
      id
      kidsApproved
      nightApproved
    }
  }
`;

export const APPROVE_DRIVER = gql`
  mutation ApproveDriver($id: Int!) {
    approveDriver(id: $id) {
      id
      active
    }
  }
`;

export const CREATE_DRIVER = gql`
  mutation AdminCreateDriver($input: AdminCreateDriverInput!) {
    adminCreateDriver(input: $input) {
      id
      firstName
      phoneNumber
      active
    }
  }
`;

export const UPDATE_DRIVER = gql`
  mutation AdminUpdateDriver($input: AdminUpdateDriverInput!) {
    adminUpdateDriver(input: $input) {
      id
      firstName
      lastName
      phoneNumber
      carBrand
      carModel
      carColor
      plateNumber
      carYear
    }
  }
`;

export const BAN_DRIVER = gql`
  mutation BanDriver($id: Int!) {
    banDriver(id: $id) {
      id
      banned
    }
  }
`;

export const UNBAN_DRIVER = gql`
  mutation UnbanDriver($id: Int!) {
    unbanDriver(id: $id) {
      id
      banned
    }
  }
`;

// ─── ORDERS ────────────────────────────────────────────────────────────────

export const LIST_ORDERS = gql`
  query AdminOrders($page: Int!, $limit: Int!, $status: String) {
    adminOrders(page: $page, limit: $limit, status: $status) {
      items {
        id
        status
        type
        serviceName
        regionName
        costBest
        costAfterCoupon
        paidAmount
        currency
        distanceBest
        durationBest
        paymentMode
        riderId
        riderPhone
        driverId
        driverPhone
        createdOn
        finishTimestamp
      }
      total
      page
      limit
    }
  }
`;

export const FORCE_CANCEL_ORDER = gql`
  mutation ForceCancel($id: Int!) {
    forceCancel(id: $id) {
      id
      status
    }
  }
`;

// ─── REGIONS ───────────────────────────────────────────────────────────────

export const LIST_REGIONS = gql`
  query AdminRegions {
    adminRegions {
      id
      name
      nameEn
      currency
      enabled
      bidModeEnabled
      defaultSearchRadius
    }
  }
`;

export const TOGGLE_REGION_ENABLED = gql`
  mutation ToggleRegionEnabled($id: Int!) {
    toggleRegionEnabled(id: $id) {
      id
      enabled
    }
  }
`;

// ─── SERVICES ──────────────────────────────────────────────────────────────

export const LIST_SERVICES = gql`
  query AdminServices($regionId: Int) {
    adminServices(regionId: $regionId) {
      id
      name
      nameEn
      serviceType
      regionId
      baseFare
      perHundredMeters
      perMinuteDrive
      minimumFee
      providerSharePercent
      bidModeEnabled
      enabled
      displayOrder
      isVip
      searchRadius
    }
  }
`;

export const TOGGLE_SERVICE_ENABLED = gql`
  mutation ToggleServiceEnabled($id: Int!) {
    toggleServiceEnabled(id: $id) {
      id
      enabled
    }
  }
`;

export const UPDATE_SERVICE = gql`
  mutation UpdateService($id: Int!, $input: UpdateServiceInput!) {
    updateService(id: $id, input: $input) {
      id
      baseFare
      perHundredMeters
      perMinuteDrive
      perMinuteWait
      minimumFee
      providerSharePercent
    }
  }
`;

// ─── COUPONS (Phase 2.1) ───────────────────────────────────────────────────

const COUPON_FIELDS = `
  id code type value maxDiscount minFare maxUses usedCount
  perUserLimit regionIds expiresAt active createdAt
`;

export const LIST_COUPONS = gql`
  query AdminCoupons {
    adminCoupons { ${COUPON_FIELDS} }
  }
`;

export const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(input: $input) { ${COUPON_FIELDS} }
  }
`;

export const UPDATE_COUPON = gql`
  mutation UpdateCoupon($id: Int!, $input: UpdateCouponInput!) {
    updateCoupon(id: $id, input: $input) { ${COUPON_FIELDS} }
  }
`;

export const TOGGLE_COUPON_ACTIVE = gql`
  mutation ToggleCouponActive($id: Int!) {
    toggleCouponActive(id: $id) { id active }
  }
`;

export const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: Int!) {
    deleteCoupon(id: $id)
  }
`;

// ─── RIDE BUNDLES (Phase F1) ────────────────────────────────────────────────

const BUNDLE_FIELDS = `
  id name ridesCount price currency
  validityDays maxDistanceKm regionId active createdAt
`;

export const LIST_BUNDLES = gql`
  query AdminBundles {
    adminBundles { ${BUNDLE_FIELDS} }
  }
`;

export const CREATE_BUNDLE = gql`
  mutation CreateBundle($input: CreateBundleInput!) {
    createBundle(input: $input) { ${BUNDLE_FIELDS} }
  }
`;

export const UPDATE_BUNDLE = gql`
  mutation UpdateBundle($id: Int!, $input: UpdateBundleInput!) {
    updateBundle(id: $id, input: $input) { ${BUNDLE_FIELDS} }
  }
`;

export const TOGGLE_BUNDLE_ACTIVE = gql`
  mutation ToggleBundleActive($id: Int!) {
    toggleBundleActive(id: $id) { id active }
  }
`;

export const DELETE_BUNDLE = gql`
  mutation DeleteBundle($id: Int!) {
    deleteBundle(id: $id)
  }
`;

// ─── CORPORATE ACCOUNTS (Phase F2) ──────────────────────────────────────────

const COMPANY_FIELDS = `
  id name contactEmail contactPhone balance currency
  monthlyCapPerEmployee status createdAt employeeCount
`;

const EMPLOYEE_FIELDS = `
  id companyId riderId riderName riderPhone monthlySpent
  monthlyPeriod status createdAt
`;

export const LIST_COMPANIES = gql`
  query AdminCompanies {
    adminCompanies { ${COMPANY_FIELDS} }
  }
`;

export const LIST_COMPANY_EMPLOYEES = gql`
  query CompanyEmployees($companyId: Int!) {
    companyEmployees(companyId: $companyId) { ${EMPLOYEE_FIELDS} }
  }
`;

export const COMPANY_ORDERS_CSV = gql`
  query CompanyOrdersCsv($companyId: Int!, $from: String, $to: String) {
    companyOrdersCsv(companyId: $companyId, from: $from, to: $to)
  }
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) { ${COMPANY_FIELDS} }
  }
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($id: Int!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) { ${COMPANY_FIELDS} }
  }
`;

export const TOP_UP_COMPANY = gql`
  mutation TopUpCompany($input: TopUpCompanyInput!) {
    topUpCompany(input: $input) { ${COMPANY_FIELDS} }
  }
`;

export const DELETE_COMPANY = gql`
  mutation DeleteCompany($id: Int!) {
    deleteCompany(id: $id)
  }
`;

export const ADD_COMPANY_EMPLOYEE = gql`
  mutation AddCompanyEmployee($input: AddEmployeeInput!) {
    addCompanyEmployee(input: $input) { ${EMPLOYEE_FIELDS} }
  }
`;

export const REVOKE_COMPANY_EMPLOYEE = gql`
  mutation RevokeCompanyEmployee($id: Int!) {
    revokeCompanyEmployee(id: $id)
  }
`;

// ─── BROADCAST NOTIFICATIONS (Phase 3.1) ──────────────────────────────────

export const BROADCAST_NOTIFICATION = gql`
  mutation BroadcastNotification($title: String!, $body: String!, $target: BroadcastTarget!) {
    broadcastNotification(title: $title, body: $body, target: $target) {
      totalTokens
      sent
      failed
    }
  }
`;

// ─── APP CONFIG (Feature Flags + Theme + SDUI) ─────────────────────────────

export const GET_APP_CONFIG = gql`
  query AppConfig($configKey: String!) {
    appConfig(configKey: $configKey) {
      id
      configKey
      version
      themeConfig
      homeScreenConfig
      featureFlags
      loyaltyConfig
      updatedAt
    }
  }
`;

export const LIST_APP_CONFIGS = gql`
  query AppConfigs {
    appConfigs {
      id
      configKey
      version
      updatedAt
    }
  }
`;

export const UPDATE_FEATURE_FLAGS = gql`
  mutation UpdateAppConfig($configKey: String!, $input: UpdateAppConfigInput!) {
    updateAppConfig(configKey: $configKey, input: $input) {
      id
      configKey
      featureFlags
      themeConfig
      homeScreenConfig
      loyaltyConfig
      updatedAt
    }
  }
`;

// ─── BANNERS (Phase 3.3 — SDUI via app-config) ────────────────────────────

export const UPDATE_APP_CONFIG = gql`
  mutation UpdateAppConfigHome($configKey: String!, $input: UpdateAppConfigInput!) {
    updateAppConfig(configKey: $configKey, input: $input) {
      id
      homeScreenConfig
      updatedAt
    }
  }
`;

// ─── SOS / Safety ──────────────────────────────────────────────────────────

export const SOS_INCIDENTS = gql`
  query SosIncidents($statuses: [SosStatus!], $limit: Int = 50, $offset: Int = 0) {
    sosIncidents(statuses: $statuses, limit: $limit, offset: $offset) {
      id
      triggeredBy
      triggeredById
      orderId
      latitude
      longitude
      lastLatitude
      lastLongitude
      status
      adminNote
      contactsNotified
      policeNotified
      createdAt
      resolvedAt
    }
    activeSosCount
  }
`;

export const RESOLVE_SOS = gql`
  mutation ResolveSos($input: ResolveSosInput!) {
    resolveSosIncident(input: $input) {
      id
      status
      adminNote
      resolvedAt
    }
  }
`;

export const ESCALATE_SOS = gql`
  mutation EscalateSos($incidentId: Int!, $adminNote: String!) {
    escalateSosIncident(incidentId: $incidentId, adminNote: $adminNote) {
      id
      status
      adminNote
      policeNotified
    }
  }
`;

// ─── J2 — Marketing leads ──────────────────────────────────────────────────

export const LIST_LEADS = gql`
  query ListLeads($page: Int, $limit: Int, $type: String, $status: String) {
    adminLeads(page: $page, limit: $limit, type: $type, status: $status) {
      items {
        id
        type
        name
        email
        phone
        company
        city
        message
        status
        createdAt
      }
      total
      page
      limit
      newCount
      contactedCount
    }
  }
`;

export const UPDATE_LEAD_STATUS = gql`
  mutation UpdateLeadStatus($input: UpdateLeadStatusInput!) {
    updateLeadStatus(input: $input) {
      id
      status
    }
  }
`;

// ─── K3 — Provider config (SMS + Gateways) ─────────────────────────────────

export const PROVIDER_CONFIG = gql`
  query ProviderConfig {
    appConfig(configKey: "main") {
      id
      smsConfig
      gatewayConfig
    }
  }
`;

export const UPDATE_SMS_CONFIG = gql`
  mutation UpdateSmsConfig($smsConfig: JSON!) {
    updateAppConfig(configKey: "main", input: { smsConfig: $smsConfig }) {
      id
      smsConfig
    }
  }
`;

export const UPDATE_GATEWAY_CONFIG = gql`
  mutation UpdateGatewayConfig($gatewayConfig: JSON!) {
    updateAppConfig(configKey: "main", input: { gatewayConfig: $gatewayConfig }) {
      id
      gatewayConfig
    }
  }
`;

// ─── K4 — Dispatcher panel ─────────────────────────────────────────────────

export const ADMIN_RIDER_LOOKUP = gql`
  query AdminRiderLookup($phone: String!) {
    adminRiderLookup(phone: $phone) {
      id
      name
      phone
    }
  }
`;

export const ADMIN_CREATE_MANUAL_ORDER = gql`
  mutation AdminCreateManualOrder($input: AdminCreateOrderInput!) {
    adminCreateManualOrder(input: $input) {
      id
      status
      driverId
      costBest
    }
  }
`;

// ─── M2 — Driver applications inbox ────────────────────────────────────────

export const ADMIN_DRIVER_APPLICATIONS = gql`
  query AdminDriverApplications($page: Int, $limit: Int, $status: String) {
    adminDriverApplications(page: $page, limit: $limit, status: $status) {
      items {
        id fullName email phone city
        nationalIdNumber dateOfBirth
        vehicleBrand vehicleModel vehicleYear vehicleColor plateNumber
        docNationalIdUrl docLicenseUrl docVehicleRegistrationUrl docInsuranceUrl docProfilePhotoUrl
        status rejectionReason reviewedAt createdAt
      }
      total submittedCount inReviewCount
    }
  }
`;

export const UPDATE_DRIVER_APPLICATION_STATUS = gql`
  mutation UpdateDriverApplicationStatus($input: UpdateApplicationStatusInput!) {
    updateDriverApplicationStatus(input: $input) {
      id status rejectionReason reviewedAt
    }
  }
`;

// ─── N2 — SDUI control: operations / loyalty / pricing-rules / theme / home ──

export const SDUI_CONFIG = gql`
  query SduiConfig {
    appConfig(configKey: "main") {
      id
      operationsConfig
      loyaltyConfig
      pricingRulesConfig
      themeConfig
      homeScreenConfig
      featureFlags
    }
  }
`;

export const UPDATE_OPERATIONS_CONFIG = gql`
  mutation UpdateOperationsConfig($operationsConfig: JSON!) {
    updateAppConfig(configKey: "main", input: { operationsConfig: $operationsConfig }) {
      id
      operationsConfig
    }
  }
`;

export const UPDATE_LOYALTY_CONFIG = gql`
  mutation UpdateLoyaltyConfig($loyaltyConfig: JSON!) {
    updateAppConfig(configKey: "main", input: { loyaltyConfig: $loyaltyConfig }) {
      id
      loyaltyConfig
    }
  }
`;

export const UPDATE_PRICING_RULES_CONFIG = gql`
  mutation UpdatePricingRulesConfig($pricingRulesConfig: JSON!) {
    updateAppConfig(configKey: "main", input: { pricingRulesConfig: $pricingRulesConfig }) {
      id
      pricingRulesConfig
    }
  }
`;

export const UPDATE_THEME_CONFIG = gql`
  mutation UpdateThemeConfig($themeConfig: JSON!) {
    updateAppConfig(configKey: "main", input: { themeConfig: $themeConfig }) {
      id
      themeConfig
    }
  }
`;

export const UPDATE_HOME_LAYOUT_CONFIG = gql`
  mutation UpdateHomeLayoutConfig($homeScreenConfig: JSON!) {
    updateAppConfig(configKey: "main", input: { homeScreenConfig: $homeScreenConfig }) {
      id
      homeScreenConfig
    }
  }
`;

// ─── N3 — Rider detail + loyalty admin + wallet reverse ────────────────────

export const ADMIN_RIDER_DETAIL = gql`
  query AdminRiderDetail($id: Int!) {
    adminRiderDetail(id: $id) {
      rider {
        id phoneNumber countryCode firstName lastName email avatarUrl
        active banned banReason balance currency rating totalRides
        lastLoginAt createdAt updatedAt
      }
      recentOrders {
        id status costAfterCoupon currency serviceName
        driverId driverName createdOn
      }
      ordersCompleted ordersCancelled totalSpent
      savedPlaces { id label address lat lng }
    }
  }
`;

export const ADMIN_RIDER_LOYALTY = gql`
  query AdminRiderLoyalty($riderId: Int!) {
    adminRiderLoyalty(riderId: $riderId) {
      riderId tier
      totalMiles availableMiles lifetimeMiles
      freeUpgradesRemaining hasFreeCancellation
      surgeImmunityUntil updatedAt
    }
  }
`;

export const ADMIN_ADJUST_LOYALTY = gql`
  mutation AdminAdjustLoyalty($input: AdjustLoyaltyInput!) {
    adminAdjustRiderLoyalty(input: $input) {
      riderId tier
      availableMiles lifetimeMiles totalMiles
    }
  }
`;

export const ADMIN_REVERSE_WALLET_TX = gql`
  mutation AdminReverseWalletTx($transactionId: Int!, $reason: String!) {
    adminReverseWalletTransaction(transactionId: $transactionId, reason: $reason) {
      id type direction amount balanceAfter status createdAt description
    }
  }
`;

// ─── N11 — ذكاء اللوحة (surge + campaigns) ────────────────────────────────

export const SURGE_STATE = gql`
  query SurgeState {
    surgeState {
      recentDemand
      driversOnline
      suggestedMultiplier
      currentMultiplier
      autoSurge
    }
  }
`;

export const DISPATCH_CAMPAIGNS = gql`
  mutation DispatchDueCampaigns {
    dispatchDueCampaigns
  }
`;

// ─── Phase 5 — CRM عالمي: ملف VIP 360 + كشف احتيال عبر-حدود ───────────────────

export const VIP_PROFILE = gql`
  query VipProfile($riderId: Int!) {
    vipProfile(riderId: $riderId) {
      riderId
      name
      phoneNumber
      tier
      lifetimeSpendBase
      baseCurrency
      totalRides
      countriesVisited
      walletBalance
      walletCurrency
      byCountry {
        countryIso
        countryName
        flag
        currency
        orders
        spentNative
        spentBase
      }
      fraudSignals {
        kind
        severity
        orderIdA
        orderIdB
        countryA
        countryB
        minutesApart
        message
      }
    }
  }
`;

// ─── Phase 6 — امتثال السائق المتكيّف لكل دولة ────────────────────────────────

export const DRIVER_COMPLIANCE = gql`
  query DriverCompliance($driverId: Int!) {
    driverCompliance(driverId: $driverId) {
      driverId
      driverName
      countryIso
      countryName
      status
      missing
      expired
      expiringSoon
      items {
        type
        state
        required
        expiresAt
        daysToExpiry
      }
    }
  }
`;

// ─── Phase 7 — تنبيهات انتهاء وثائق الأسطول الإقليمية ─────────────────────────

export const FLEET_DOCUMENT_ALERTS = gql`
  query FleetDocumentAlerts($withinDays: Int) {
    fleetDocumentAlerts(withinDays: $withinDays) {
      withinDays
      expiredCount
      criticalCount
      soonCount
      alerts {
        driverId
        driverName
        countryIso
        countryName
        docType
        expiresAt
        daysToExpiry
        severity
      }
    }
  }
`;

// ─── Phase 8 — النمو: محاكاة العروض المُسوَّرة جغرافياً ─────────────────────────

export const SIMULATE_OFFER = gql`
  query SimulateOffer($code: String!, $regionId: Int!, $fare: Float!) {
    simulateOffer(code: $code, regionId: $regionId, fare: $fare) {
      code
      valid
      reason
      discount
      finalFare
      currency
      countryIso
      countryName
    }
  }
`;

export const OFFER_REACH = gql`
  query OfferReach($code: String!) {
    offerReach(code: $code) {
      code
      global
      regionCount
      countries
    }
  }
`;

// ─── Phase 9 — مركز SOS العالمي (إثراء بالدولة + رقم الطوارئ السيادي) ──────────

export const GLOBAL_SOS_CENTER = gql`
  query GlobalSosCenter {
    globalSosCenter {
      totalActive
      criticalCount
      byCountry {
        countryIso
        countryName
        flag
        emergencyNumber
        activeCount
      }
      incidents {
        id
        triggeredBy
        triggeredById
        orderId
        status
        priority
        ageMinutes
        hasLiveLocation
        policeNotified
        countryIso
        countryName
        flag
        emergencyNumber
      }
    }
  }
`;
