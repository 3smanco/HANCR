const String _flightFields = r'''
  id
  flightNumber flightDate
  pickupAddress pickupLat pickupLng
  scheduledArrival
  serviceId regionId
  pickupTriggered orderId status
  createdAt
''';

final String flightTrackingsQuery = '''
  query FlightTrackings {
    flightTrackings { $_flightFields }
  }
''';

final String trackFlightMutation = '''
  mutation TrackFlight(\$input: FlightTrackingInput!) {
    trackFlight(input: \$input) { $_flightFields }
  }
''';

const String cancelFlightTrackingMutation = r'''
  mutation CancelFlightTracking($id: Int!) {
    cancelFlightTracking(id: $id)
  }
''';
