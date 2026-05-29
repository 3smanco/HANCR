const String _orderFragment = r'''
  fragment OrderFields on DriverOrderType {
    id
    type
    status
    riderId
    riderName
    riderPhone
    riderRating
    points { lat lng }
    addresses
    distanceBest
    durationBest
    costBest
    costAfterCoupon
    currency
    paymentMode
    quietRide
    requestedTemperature
    audioOff
    numberMasked
    otpCode
    receiverName
    isBidOrder
    etaPickup
    startTimestamp
    finishTimestamp
    createdOn
  }
''';

const String driverActiveOrderQuery = '''
  $_orderFragment
  query DriverActiveOrder {
    driverActiveOrder {
      ...OrderFields
    }
  }
''';

const String acceptOrderMutation = '''
  $_orderFragment
  mutation AcceptOrder(\$orderId: Int!) {
    acceptOrder(orderId: \$orderId) {
      ...OrderFields
    }
  }
''';

const String arrivedAtPickupMutation = '''
  $_orderFragment
  mutation ArrivedAtPickup(\$orderId: Int!) {
    arrivedAtPickup(orderId: \$orderId) {
      ...OrderFields
    }
  }
''';

const String startRideMutation = '''
  $_orderFragment
  mutation StartRide(\$orderId: Int!) {
    startRide(orderId: \$orderId) {
      ...OrderFields
    }
  }
''';

const String finishRideMutation = '''
  $_orderFragment
  mutation FinishRide(\$orderId: Int!) {
    finishRide(orderId: \$orderId) {
      ...OrderFields
    }
  }
''';

const String driverCancelOrderMutation = '''
  $_orderFragment
  mutation DriverCancelOrder(\$orderId: Int!) {
    driverCancelOrder(orderId: \$orderId) {
      ...OrderFields
    }
  }
''';

const String newOrderAvailableSubscription = '''
  $_orderFragment
  subscription NewOrderAvailable {
    newOrderAvailable {
      ...OrderFields
    }
  }
''';

const String driverOrderUpdatedSubscription = '''
  $_orderFragment
  subscription DriverOrderUpdated {
    driverOrderUpdated {
      ...OrderFields
    }
  }
''';
