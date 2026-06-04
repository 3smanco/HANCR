/**
 * GraphQL operations for HANCR admin-api (port 3002)
 *
 * IMPORTANT: All field names match the actual admin-api schema as introspected
 * on 2026-05-28. Do not rename without verifying via `__type` introspection.
 */
import { gql } from '@apollo/client';

// ─── AUTH ──────────────────────────────────────────────────────────────────

export const ADMIN_LOGIN = gql`
  mutation AdminLogin($email: String!, $password: String!) {
    adminLogin(email: $email, password: $password) {
      accessToken
      email
      role
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
      }
      total
      page
      limit
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
