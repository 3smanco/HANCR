import 'dart:io';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../graphql/graphql_client.dart';
import '../graphql/gql/rider_gql.dart';

/// RiderUploadService — التقاط صورة الملف الشخصي ورفعها مباشرةً (presigned PUT).
///
/// التدفّق: التقط (كاميرا/معرض) → اطلب رابط رفع موقّع → PUT المباشر للتخزين →
/// أعِد الرابط العام (يُحفظ عبر updateProfile(avatarUrl)). مبسّط عن نظير السائق:
/// لا خطوة "register" — حقل avatarUrl يُحفظ مباشرةً في الملف الشخصي.
class RiderUploadService {
  static final ImagePicker _picker = ImagePicker();

  /// يلتقط صورة من المصدر المحدّد ويُعيد الملف، أو null عند الإلغاء.
  static Future<XFile?> capture({
    required ImageSource source,
    bool frontCamera = true,
  }) {
    return _picker.pickImage(
      source: source,
      maxWidth: 1200,
      imageQuality: 85,
      preferredCameraDevice:
          frontCamera ? CameraDevice.front : CameraDevice.rear,
    );
  }

  /// يرفع الصورة الملتقطة ويُعيد الرابط العام عند النجاح.
  static Future<String> upload(XFile file) async {
    final client = await GraphQLClientManager.get();
    final contentType = _guessContentType(file.path);

    // 1) رابط PUT موقّع.
    final urlRes = await client.mutate(MutationOptions(
      document: gql(generateRiderUploadUrlMutation),
      variables: {
        'input': {'contentType': contentType},
      },
    ));
    if (urlRes.hasException) throw urlRes.exception!;
    final urlData =
        urlRes.data?['generateRiderUploadUrl'] as Map<String, dynamic>?;
    if (urlData == null) throw Exception('No upload URL returned');
    final uploadUrl = urlData['uploadUrl'] as String;
    final publicUrl = urlData['publicUrl'] as String;

    // 2) رفع البايتات للتخزين.
    final uploadUri = Uri.parse(uploadUrl);
    if (!uploadUri.hasScheme) {
      throw Exception('Invalid upload URL');
    }
    final bytes = await File(file.path).readAsBytes();
    final put = await http.put(
      uploadUri,
      headers: {'Content-Type': contentType},
      body: bytes,
    );
    if (put.statusCode < 200 || put.statusCode >= 300) {
      throw Exception('Upload failed (${put.statusCode})');
    }

    return publicUrl;
  }

  static String _guessContentType(String path) {
    final p = path.toLowerCase();
    if (p.endsWith('.png')) return 'image/png';
    if (p.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }
}
