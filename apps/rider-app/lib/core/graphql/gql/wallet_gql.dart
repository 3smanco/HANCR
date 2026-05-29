// GraphQL operations لمحفظة الراكب.

const String myWalletQuery = r'''
  query MyWallet {
    myWallet {
      balance
      currency
    }
  }
''';

const String myWalletTransactionsQuery = r'''
  query MyWalletTransactions($limit: Int = 50, $offset: Int = 0) {
    myWalletTransactions(limit: $limit, offset: $offset) {
      id
      type
      direction
      amount
      balanceAfter
      currency
      status
      gateway
      gatewayRef
      orderId
      description
      createdAt
      completedAt
    }
  }
''';

const String startWalletRechargeMutation = r'''
  mutation StartWalletRecharge($amount: Float!, $gateway: PaymentGateway = HyperPay) {
    startWalletRecharge(amount: $amount, gateway: $gateway) {
      transactionId
      gatewayRef
      redirectUrl
      clientSecret
      gateway
      amount
      currency
    }
  }
''';

const String confirmWalletRechargeMutation = r'''
  mutation ConfirmWalletRecharge($transactionId: Int!) {
    confirmWalletRecharge(transactionId: $transactionId)
  }
''';
