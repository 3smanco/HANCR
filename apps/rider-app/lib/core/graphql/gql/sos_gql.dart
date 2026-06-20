// GraphQL operations لنظام الطوارئ (SOS).

const String myEmergencyContactsQuery = r'''
  query MyEmergencyContacts {
    myEmergencyContacts {
      id
      name
      phoneNumber
      relation
      autoShareTrips
      priority
      createdAt
    }
  }
''';

const String myActiveSosQuery = r'''
  query MyActiveSos {
    myActiveSos {
      id
      triggeredBy
      triggeredById
      orderId
      latitude
      longitude
      lastLatitude
      lastLongitude
      status
      contactsNotified
      policeNotified
      createdAt
      resolvedAt
    }
  }
''';

const String addEmergencyContactMutation = r'''
  mutation AddEmergencyContact($input: AddEmergencyContactInput!) {
    addEmergencyContact(input: $input) {
      id
      name
      phoneNumber
      relation
      autoShareTrips
      priority
      createdAt
    }
  }
''';

const String removeEmergencyContactMutation = r'''
  mutation RemoveEmergencyContact($contactId: Int!) {
    removeEmergencyContact(contactId: $contactId)
  }
''';

const String triggerSosMutation = r'''
  mutation TriggerSos($input: TriggerSosInput!) {
    triggerSos(input: $input) {
      id
      latitude
      longitude
      status
      contactsNotified
      createdAt
    }
  }
''';

const String updateSosLocationMutation = r'''
  mutation UpdateSosLocation($latitude: Float!, $longitude: Float!) {
    updateSosLocation(latitude: $latitude, longitude: $longitude)
  }
''';

const String cancelSosMutation = r'''
  mutation CancelSos($incidentId: Int!) {
    cancelSos(incidentId: $incidentId) {
      id
      status
      resolvedAt
    }
  }
''';
