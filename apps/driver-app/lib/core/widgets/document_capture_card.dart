import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../i18n/app_localization.dart';
import '../motion/motion.dart';
import '../services/document_upload_service.dart';
import 'aurora/aurora.dart';

/// DocumentCaptureCard — بطاقة التقاط ورفع وثيقة (Uber-like).
/// تعرض: العنوان + الأيقونة + حالة (التقط/جارٍ الرفع/تمّ) + معاينة صغيرة.
/// عند نجاح الرفع تستدعي [onUploaded] بالرابط العام.
class DocumentCaptureCard extends StatefulWidget {
  const DocumentCaptureCard({
    super.key,
    required this.type,
    required this.title,
    required this.icon,
    required this.onUploaded,
    this.selfie = false,
    this.hint,
  });

  final String type; // national_id / license / vehicle_registration / selfie …
  final String title;
  final IconData icon;
  final ValueChanged<String> onUploaded;
  final bool selfie; // كاميرا أمامية + شكل دائري
  final String? hint;

  @override
  State<DocumentCaptureCard> createState() => _DocumentCaptureCardState();
}

class _DocumentCaptureCardState extends State<DocumentCaptureCard> {
  XFile? _file;
  bool _uploading = false;
  bool _done = false;
  String? _error;

  Future<void> _pick(ImageSource source) async {
    try {
      final file = await DocumentUploadService.capture(
        source: source,
        frontCamera: widget.selfie,
      );
      if (file == null) return;
      setState(() {
        _file = file;
        _uploading = true;
        _error = null;
        _done = false;
      });
      Haptics.selection();
      final res =
          await DocumentUploadService.upload(type: widget.type, file: file);
      if (!mounted) return;
      setState(() {
        _uploading = false;
        _done = true;
      });
      Haptics.success();
      widget.onUploaded(res.publicUrl);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _uploading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
      Haptics.error();
    }
  }

  void _sheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AuroraColors.coal,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AuroraRadius.xl)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: AuroraSpacing.md),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AuroraColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AuroraSpacing.lg),
            _sheetItem(Icons.camera_alt, tr('takePhoto'), () {
              Navigator.pop(ctx);
              _pick(ImageSource.camera);
            }),
            if (!widget.selfie)
              _sheetItem(Icons.photo_library, tr('fromGallery'), () {
                Navigator.pop(ctx);
                _pick(ImageSource.gallery);
              }),
            const SizedBox(height: AuroraSpacing.md),
          ],
        ),
      ),
    );
  }

  Widget _sheetItem(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AuroraColors.ember),
      title: Text(label, style: AuroraText.bodyLarge),
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final radius = widget.selfie ? AuroraRadius.pill : AuroraRadius.lg;
    final borderColor = _done
        ? AuroraColors.success
        : _error != null
            ? AuroraColors.danger
            : AuroraColors.border;

    return GestureDetector(
      onTap: _uploading ? null : _sheet,
      child: AnimatedContainer(
        duration: Motion.fast,
        padding: const EdgeInsets.all(AuroraSpacing.md),
        decoration: BoxDecoration(
          color: AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.lg),
          border: Border.all(color: borderColor, width: _done ? 1.5 : 1),
        ),
        child: Row(
          children: [
            // معاينة / أيقونة
            ClipRRect(
              borderRadius: BorderRadius.circular(radius),
              child: Container(
                width: widget.selfie ? 64 : 72,
                height: widget.selfie ? 64 : 56,
                color: AuroraColors.coal,
                child: _file != null
                    ? Image.file(File(_file!.path), fit: BoxFit.cover)
                    : Icon(widget.icon,
                        color: AuroraColors.textHint, size: 28),
              ),
            ),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.title, style: AuroraText.titleSmall),
                  const SizedBox(height: 2),
                  Text(
                    _uploading
                        ? tr('uploading')
                        : _done
                            ? tr('uploaded')
                            : _error ?? (widget.hint ?? tr('tapToCapture')),
                    style: AuroraText.caption.copyWith(
                      color: _done
                          ? AuroraColors.success
                          : _error != null
                              ? AuroraColors.danger
                              : AuroraColors.textHint,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: AuroraSpacing.sm),
            // حالة
            if (_uploading)
              SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: AuroraColors.ember),
              )
            else if (_done)
              Icon(Icons.check_circle, color: AuroraColors.success, size: 24)
            else
              Icon(widget.selfie ? Icons.camera_front : Icons.add_a_photo,
                  color: AuroraColors.ember, size: 22),
          ],
        ),
      ),
    );
  }
}
