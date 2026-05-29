// GraphQL operations لمحفظة السائق.

const String myDriverWalletQuery = r'''
  query MyDriverWallet {
    myDriverWallet {
      balance
      currency
    }
  }
''';

const String myDriverWalletTransactionsQuery = r'''
  query MyDriverWalletTransactions($limit: Int = 50, $offset: Int = 0) {
    myDriverWalletTransactions(limit: $limit, offset: $offset) {
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

const String requestWithdrawalMutation = r'''
  mutation RequestWithdrawal($amount: Float!) {
    requestWithdrawal(amount: $amount) {
      transactionId
      amount
      currency
      status
      balanceAfter
    }
  }
''';
