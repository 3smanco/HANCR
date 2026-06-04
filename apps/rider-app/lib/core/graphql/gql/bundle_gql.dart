const String _bundleFields = r'''
  id name ridesCount price currency validityDays maxDistanceKm regionId active
''';

const String _entitlementFields = r'''
  id bundleId bundleName ridesTotal ridesRemaining maxDistanceKm
  expiresAt amountPaid currency status createdAt
''';

final String availableBundlesQuery = '''
  query AvailableBundles(\$regionId: Int!) {
    availableBundles(regionId: \$regionId) { $_bundleFields }
  }
''';

final String myEntitlementsQuery = '''
  query MyEntitlements {
    myEntitlements { $_entitlementFields }
  }
''';

final String purchaseBundleMutation = '''
  mutation PurchaseBundle(\$bundleId: Int!) {
    purchaseBundle(bundleId: \$bundleId) {
      success
      newWalletBalance
      entitlement { $_entitlementFields }
    }
  }
''';
