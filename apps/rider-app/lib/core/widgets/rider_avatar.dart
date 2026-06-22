import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_event.dart';
import '../i18n/app_localization.dart';
import '../services/rider_upload_service.dart';
import 'aurora/aurora.dart';

/// RiderAvatar — صورة الملف الشخصي للراكب.
///
/// تعرض `Image.network(avatarUrl)` مع **fallback للحرف الأول** عند غياب الرابط
/// أو فشل التحميل. عند `editable` تُظهر شارة كاميرا وتتيح التقاط/رفع صورة جديدة
/// مباشرةً (presigned PUT) ثم حفظها عبر `RiderUpdateRequested(avatarUrl)`.
class RiderAvatar extends StatefulWidget {
  const RiderAvatar({
    super.key,
    required this.avatarUrl,
    required this.initial,
    this.size = 64,
    this.editable = true,
  });

  final String? avatarUrl;
  final String initial;
  final double size;
  final bool editable;

  @override
  State<RiderAvatar> createState() => _RiderAvatarState();
}

class _RiderAvatarState extends State<RiderAvatar> {
  bool _busy = false;

  Future<void> _change() async {
    final source = await showModalBottomSheet<ImageSource>(
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
            ListTile(
              leading: Icon(Icons.camera_alt, color: AuroraColors.ember),
              title: Text(tr('takePhoto'), style: AuroraText.bodyLarge),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: Icon(Icons.photo_library, color: AuroraColors.ember),
              title: Text(tr('fromGallery'), style: AuroraText.bodyLarge),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            const SizedBox(height: AuroraSpacing.sm),
          ],
        ),
      ),
    );
    if (source == null) return;
    final file = await RiderUploadService.capture(
        source: source, frontCamera: source == ImageSource.camera);
    if (file == null) return;
    setState(() => _busy = true);
    try {
      final publicUrl = await RiderUploadService.upload(file);
      if (!mounted) return;
      context.read<RiderBloc>().add(RiderUpdateRequested(avatarUrl: publicUrl));
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(tr('photoUpdated')),
        backgroundColor: AuroraColors.success,
      ));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AuroraColors.danger,
        ));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final url = widget.avatarUrl;
    final hasImage = url != null && url.isNotEmpty;
    final avatar = Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        gradient: hasImage ? null : AuroraColors.emberGradient,
        color: hasImage ? AuroraColors.ash : null,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        boxShadow: AuroraShadows.iconGlow,
        image: hasImage
            ? DecorationImage(image: NetworkImage(url), fit: BoxFit.cover)
            : null,
      ),
      child: hasImage
          ? null
          : Center(
              child: Text(
                widget.initial,
                style: AuroraText.displayMedium.copyWith(
                  color: AuroraColors.pearl,
                  fontSize: widget.size * 0.44,
                ),
              ),
            ),
    );

    if (!widget.editable) return avatar;

    return GestureDetector(
      onTap: _busy ? null : _change,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          if (_busy)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  color: AuroraColors.obsidian.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                ),
                child: Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AuroraColors.ember),
                  ),
                ),
              ),
            ),
          Positioned(
            right: -4,
            bottom: -4,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AuroraColors.ember,
                shape: BoxShape.circle,
                border: Border.all(color: AuroraColors.coal, width: 2),
              ),
              child: const Icon(Icons.camera_alt,
                  color: Color(0xFFFFF5EE), size: 12),
            ),
          ),
        ],
      ),
    );
  }
}
