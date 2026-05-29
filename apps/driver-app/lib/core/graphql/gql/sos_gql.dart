// GraphQL operations لنظام الطوارئ — السائق.

const String myDriverEmergencyContactsQuery = r'''
  query MyDriverEmergencyContacts {
    myDriverEmergencyContacts {
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

const String myActiveDriverSosQuery = r'''
  query MyActiveDriverSos {
    myActiveDriverSos {
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

const String addDriverEmergencyContactMutation = r'''
  mutation AddDriverEmergencyContact($input: AddEmergencyContactInput!) {
    addDriverEmergencyContact(input: $input) {
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

const String removeDriverEmergencyContactMutation = r'''
  mutation RemoveDriverEmergencyContact($contactId: Int!) {
    removeDriverEmergencyContact(contactId: $contactId)
  }
''';

const String triggerDriverSosMutation = r'''
  mutation TriggerDriverSos($input: TriggerSosInput!) {
    triggerDriverSos(input: $input) {
      id
      latitude
      longitude
      status
      contactsNotified
      createdAt
    }
  }
''';

const String cancelDriverSosMutation = r'''
  mutation CancelDriverSos($incidentId: Int!) {
    cancelDriverSos(incidentId: $incidentId) {
      id
      status
      resolvedAt
    }
  }
''';
