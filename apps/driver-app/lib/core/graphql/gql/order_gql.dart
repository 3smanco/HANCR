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
    receiverPhone
    isBidOrder
    etaPickup
    startTimestamp
    finishTimestamp
    createdOn
    familyMode
    preferFemaleDriver
    preferredDriverId
    entitlementId
    companyId
    bookedHours
    nightShift
    shoppingList { name qty note }
    budget
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

const String completedOrdersQuery = '''
  $_orderFragment
  query CompletedOrders(\$limit: Int, \$offset: Int) {
    completedOrders(limit: \$limit, offset: \$offset) {
      ...OrderFields
    }
  }
''';

const String rateRiderMutation = r'''
  mutation RateRider($orderId: Int!, $stars: Int!) {
    rateRider(orderId: $orderId, stars: $stars) { id }
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

// ─── Chat (driver ↔ rider) ───
const String orderMessagesQuery = r'''
  query OrderMessages($orderId: Int!) {
    orderMessages(orderId: $orderId) {
      id orderId message imageUrl senderType senderId isRead sentAt
    }
  }
''';

const String sendOrderMessageMutation = r'''
  mutation SendOrderMessage($orderId: Int!, $message: String!, $imageUrl: String) {
    sendOrderMessage(orderId: $orderId, message: $message, imageUrl: $imageUrl) {
      id orderId message imageUrl senderType senderId isRead sentAt
    }
  }
''';

const String orderMessageAddedSubscription = r'''
  subscription OrderMessageAdded($orderId: Int!) {
    orderMessageAdded(orderId: $orderId) {
      id orderId message imageUrl senderType senderId isRead sentAt
    }
  }
''';

const String setOrderTypingMutation = r'''
  mutation SetOrderTyping($orderId: Int!) {
    setOrderTyping(orderId: $orderId)
  }
''';

const String markOrderMessagesReadMutation = r'''
  mutation MarkOrderMessagesRead($orderId: Int!) {
    markOrderMessagesRead(orderId: $orderId)
  }
''';

const String orderTypingSubscription = r'''
  subscription OrderTyping($orderId: Int!) {
    orderTyping(orderId: $orderId) { orderId actorType }
  }
''';

const String orderMessagesReadSubscription = r'''
  subscription OrderMessagesRead($orderId: Int!) {
    orderMessagesRead(orderId: $orderId) { orderId actorType }
  }
''';

const String confirmDeliveryMutation = '''
  $_orderFragment
  mutation ConfirmDelivery(\$orderId: Int!, \$otp: String!) {
    confirmDelivery(orderId: \$orderId, otp: \$otp) {
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

// ─── Bid Mode (المزايدة) ───
const String availableBidsQuery = r'''
  query AvailableBids {
    availableBids {
      id riderProposedPrice currency
      originAddress destinationAddress
      estimatedDistance serviceId regionId expiresAt alreadyOffered
    }
  }
''';

const String submitBidOfferMutation = r'''
  mutation SubmitBidOffer($bidId: Int!, $offeredPrice: Float!) {
    submitBidOffer(bidId: $bidId, offeredPrice: $offeredPrice) {
      success offerId offeredPrice message
    }
  }
''';
