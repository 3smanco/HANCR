const String _docFields = r'''
  id type url expiresAt status rejectedReason
  uploadedAt reviewedAt
''';

final String myDocumentsQuery = '''
  query MyDocuments {
    myDocuments { $_docFields }
  }
''';

final String uploadDocumentMutation = '''
  mutation UploadDriverDocument(\$input: UploadDocumentInput!) {
    uploadDriverDocument(input: \$input) { $_docFields }
  }
''';
