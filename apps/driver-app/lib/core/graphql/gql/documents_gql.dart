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

/// K4/L1 — Get a presigned upload URL before PUT-ing the file.
final String generateUploadUrlMutation = '''
  mutation GenerateDriverDocumentUploadUrl(\$input: GenerateUploadUrlInput!) {
    generateDriverDocumentUploadUrl(input: \$input) {
      uploadUrl
      publicUrl
      objectKey
      expiresIn
    }
  }
''';
