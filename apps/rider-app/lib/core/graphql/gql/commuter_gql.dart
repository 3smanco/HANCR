const String _commuterFields = r'''
  id
  homeAddress homeLat homeLng
  workAddress workLat workLng
  outboundTime returnTime
  daysOfWeek planType active
  serviceId regionId leadMinutes
  createdAt
''';

final String commuterSubscriptionsQuery = '''
  query CommuterSubscriptions {
    commuterSubscriptions { $_commuterFields }
  }
''';

final String createCommuterSubscriptionMutation = '''
  mutation CreateCommuterSubscription(\$input: CommuterSubscriptionInput!) {
    createCommuterSubscription(input: \$input) { $_commuterFields }
  }
''';

final String updateCommuterSubscriptionMutation = '''
  mutation UpdateCommuterSubscription(\$id: Int!, \$input: CommuterUpdateInput!) {
    updateCommuterSubscription(id: \$id, input: \$input) { $_commuterFields }
  }
''';

const String deleteCommuterSubscriptionMutation = r'''
  mutation DeleteCommuterSubscription($id: Int!) {
    deleteCommuterSubscription(id: $id)
  }
''';
