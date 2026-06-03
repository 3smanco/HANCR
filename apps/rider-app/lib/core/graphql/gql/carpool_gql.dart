const String _carpoolFields = r'''
  id
  originAddress originLat originLng
  destinationAddress destinationLat destinationLng
  scheduledAt maxRiders trustMode status
  discountPercent matchId orderId
  serviceId regionId createdAt
''';

final String carpoolRequestsQuery = '''
  query CarpoolRequests {
    carpoolRequests { $_carpoolFields }
  }
''';

final String requestCarpoolMutation = '''
  mutation RequestCarpool(\$input: CarpoolRequestInput!) {
    requestCarpool(input: \$input) { $_carpoolFields }
  }
''';

const String cancelCarpoolRequestMutation = r'''
  mutation CancelCarpoolRequest($id: Int!) {
    cancelCarpoolRequest(id: $id)
  }
''';
