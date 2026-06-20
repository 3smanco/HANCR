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

// ─── Chat (rider ↔ driver) ───
const String orderMessagesQuery = r'''
  query OrderMessages($orderId: Int!) {
    orderMessages(orderId: $orderId) {
      id orderId message senderType senderId isRead sentAt
    }
  }
''';

const String sendOrderMessageMutation = r'''
  mutation SendOrderMessage($orderId: Int!, $message: String!) {
    sendOrderMessage(orderId: $orderId, message: $message) {
      id orderId message senderType senderId isRead sentAt
    }
  }
''';

const String orderMessageAddedSubscription = r'''
  subscription OrderMessageAdded($orderId: Int!) {
    orderMessageAdded(orderId: $orderId) {
      id orderId message senderType senderId isRead sentAt
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
      costAfterCoupon
      paidAmount
      currency
      distanceBest
      durationBest
      addresses
      points { lat lng }
      driverName
      driverRating
      carBrand
      carModel
      carColor
      plateNumber
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
