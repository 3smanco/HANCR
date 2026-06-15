import 'dart:io';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../graphql/graphql_client.dart';
import '../graphql/gql/documents_gql.dart';

/// نتيجة رفع وثيقة: رابط عام + حالة.
class DocUploadResult {
  const DocUploadResult({required this.publicUrl});
  final String publicUrl;
}

/// DocumentUploadService — التقاط صورة (كاميرا/معرض) ورفعها كوثيقة سائق.
///
/// التدفّق (Uber-like): التقط → اطلب رابط رفع موقّع → PUT المباشر للتخزين →
/// سجّل الوثيقة في الخادم. يُعاد استخدامه في التسجيل وشاشة الوثائق.
class DocumentUploadService {
  static final ImagePicker _picker = ImagePicker();

  /// يلتقط صورة من المصدر المحدّد (كاميرا أمامية للسيلفي) ويُعيد المسار، أو null.
  static Future<XFile?> capture({
    required ImageSource source,
    bool frontCamera = false,
  }) {
    return _picker.pickImage(
      source: source,
      maxWidth: 2000,
      imageQuality: 85,
      preferredCameraDevice:
          frontCamera ? CameraDevice.front : CameraDevice.rear,
    );
  }

  /// يرفع ملفاً مُلتقَطاً مسبقاً لنوع وثيقة معيّن. يُعيد الرابط العام عند النجاح.
  static Future<DocUploadResult> upload({
    required String type,
    required XFile file,
  }) async {
    final client = await GraphQLClientManager.get();
    final contentType = _guessContentType(file.path);

    // 1) رابط PUT موقّع.
    final urlRes = await client.mutate(MutationOptions(
      document: gql(generateUploadUrlMutation),
      variables: {
        'input': {'type': type, 'contentType': contentType},
      },
    ));
    if (urlRes.hasException) throw urlRes.exception!;
    final urlData = urlRes.data?['generateDriverDocumentUploadUrl']
        as Map<String, dynamic>?;
    if (urlData == null) throw Exception('No upload URL returned');
    final uploadUrl = urlData['uploadUrl'] as String;
    final publicUrl = urlData['publicUrl'] as String;

    // 2) رفع البايتات للتخزين (يُتخطّى احتياط dev غير http).
    if (uploadUrl.startsWith('http')) {
      final bytes = await File(file.path).readAsBytes();
      final put = await http.put(
        Uri.parse(uploadUrl),
        headers: {'Content-Type': contentType},
        body: bytes,
      );
      if (put.statusCode < 200 || put.statusCode >= 300) {
        throw Exception('Upload failed (${put.statusCode})');
      }
    }

    // 3) تسجيل الوثيقة (تعود حالتها pending للمراجعة).
    final res = await client.mutate(MutationOptions(
      document: gql(uploadDocumentMutation),
      variables: {
        'input': {'type': type, 'url': publicUrl},
      },
    ));
    if (res.hasException) throw res.exception!;

    return DocUploadResult(publicUrl: publicUrl);
  }

  static String _guessContentType(String path) {
    final p = path.toLowerCase();
    if (p.endsWith('.png')) return 'image/png';
    if (p.endsWith('.webp')) return 'image/webp';
    if (p.endsWith('.heic')) return 'image/heic';
    return 'image/jpeg';
  }
}
