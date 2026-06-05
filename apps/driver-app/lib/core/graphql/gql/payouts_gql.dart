const String _payoutMethodFields = r'''
  id type accountName iban bankName phoneNumber isDefault createdAt
''';

final String myPayoutMethodsQuery = '''
  query MyPayoutMethods {
    myPayoutMethods { $_payoutMethodFields }
  }
''';

final String myEarningsSummaryQuery = r'''
  query MyEarningsSummary {
    myEarningsSummary {
      currency availableBalance pendingPayoutAmount totalEarnedAllTime
    }
  }
''';

final String addPayoutMethodMutation = '''
  mutation AddPayoutMethod(\$input: AddPayoutMethodInput!) {
    addPayoutMethod(input: \$input) { $_payoutMethodFields }
  }
''';

final String setDefaultPayoutMethodMutation = '''
  mutation SetDefaultPayoutMethod(\$id: Int!) {
    setDefaultPayoutMethod(id: \$id) { $_payoutMethodFields }
  }
''';

const String removePayoutMethodMutation = r'''
  mutation RemovePayoutMethod($id: Int!) {
    removePayoutMethod(id: $id)
  }
''';
