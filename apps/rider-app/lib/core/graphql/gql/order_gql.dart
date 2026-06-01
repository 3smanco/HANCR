const String createOrderMutation = r'''
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      type
      status
      costBest
      costAfterCoupon
      currency
      distanceBest
      durationBest
      etaPickup
      points { lat lng }
      addresses
      quietRide
      audioOff
      numberMasked
      isBidOrder
      otpCode
      receiverName
      receiverPhone
      riderId
      serviceId
      regionId
      createdOn
    }
  }
''';

const String cancelOrderMutation = r'''
  mutation CancelOrder($orderId: Int!) {
    cancelOrder(orderId: $orderId) {
      id
      status
    }
  }
''';

const String rateDriverMutation = r'''
  mutation RateDriver($input: RateDriverInput!) {
    rateDriver(input: $input) {
      id
      status
    }
  }
''';

const String activeOrderQuery = r'''
  query ActiveOrder {
    activeOrder {
      id
      type
      status
      costBest
      costAfterCoupon
      paidAmount
      tipAmount
      currency
      distanceBest
      durationBest
      etaPickup
      startTimestamp
      finishTimestamp
      driverId
      driverName
      driverPhone
      driverRating
      carBrand
      carModel
      carColor
      plateNumber
      driverAvatarUrl
      points { lat lng }
      addresses
      quietRide
      audioOff
      numberMasked
      isBidOrder
      otpCode
      receiverName
      receiverPhone
      riderId
      serviceId
      regionId
      createdOn
    }
  }
''';

const String orderHistoryQuery = r'''
  query OrderHistory($limit: Int, $offset: Int) {
    orderHistory(limit: $limit, offset: $offset) {
      id
      type
      status
      costBest
      paidAmount
      currency
      distanceBest
      durationBest
      addresses
      driverName
      driverRating
      carBrand
      carModel
      driverAvatarUrl
      createdOn
      finishTimestamp
    }
  }
''';

const String orderUpdatedSubscription = r'''
  subscription OrderUpdated {
    orderUpdated {
      id
      type
      status
      costBest
      costAfterCoupon
      paidAmount
      currency
      distanceBest
      durationBest
      etaPickup
      startTimestamp
      finishTimestamp
      driverId
      driverName
      driverPhone
      driverRating
      carBrand
      carModel
      carColor
      plateNumber
      driverAvatarUrl
      addresses
      otpCode
      receiverName
      receiverPhone
      riderId
    }
  }
''';
