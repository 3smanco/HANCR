import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import { buildLocalUploadTarget } from "@hancr/uploads";
import {
  GenerateRiderUploadUrlInput,
  RiderUploadUrlType,
} from "./dto/upload-url.type";

/**
 * مولّد رابط رفع صورة الملف الشخصي للراكب — مرآة لـ driver-api UploadUrlService.
 *
 * الإنتاج: يُعيد رابط GCS v4 موقّعاً للرفع المباشر (PUT) من التطبيق إلى الـ bucket
 * (بلا مرور عبر الـ API). يُقرأ مفتاح حساب الخدمة من `GCS_SERVICE_ACCOUNT_JSON`،
 * والـ bucket من `GCS_RIDER_UPLOADS_BUCKET` (وإلا fallback إلى bucket وثائق السائق).
 *
 * التطوير: إن غابت متغيّرات GCS يُعيد رابطاً مؤقّتاً تحت `/uploads/{key}` حتى
 * يبقى تدفّق التطبيق مُختبَراً end-to-end (لا رفع فعلي). تبديل GCS الحقيقي
 * لاحقاً = جسم دالة واحد، شأن ops (إنشاء bucket/IAM/CORS).
 */
@Injectable()
export class UploadUrlService {
  private readonly logger = new Logger(UploadUrlService.name);

  constructor(private readonly cfg: ConfigService) {}

  async generate(
    riderId: number,
    input: GenerateRiderUploadUrlInput,
  ): Promise<RiderUploadUrlType> {
    const bucket =
      this.cfg.get<string>("GCS_RIDER_UPLOADS_BUCKET") ??
      this.cfg.get<string>("GCS_DRIVER_DOCS_BUCKET");
    const saJson = this.cfg.get<string>("GCS_SERVICE_ACCOUNT_JSON");
    const ext = extensionFor(input.contentType);
    const objectKey = `rider-${riderId}/avatar/${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;

    if (bucket && saJson) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Storage } =
          require("@google-cloud/storage") as typeof import("@google-cloud/storage");
        const credentials = JSON.parse(saJson) as Record<string, unknown>;
        const storage = new Storage({ credentials });
        const file = storage.bucket(bucket).file(objectKey);
        const expiresIn = 60 * 10; // 10 دقائق
        const [uploadUrl] = await file.getSignedUrl({
          version: "v4",
          action: "write",
          expires: Date.now() + expiresIn * 1000,
          contentType: input.contentType,
        });
        return {
          uploadUrl,
          publicUrl: `https://storage.googleapis.com/${bucket}/${objectKey}`,
          objectKey,
          expiresIn,
        };
      } catch (err) {
        this.logger.warn(
          `GCS signed-URL generation failed (${(err as Error).message}); falling back to local upload`,
        );
      }
    }

    // fallback تطويري / غير مُهيّأ.
    this.logger.debug(
      `Returning local avatar upload URL for rider #${riderId}`,
    );
    return buildLocalUploadTarget(this.cfg, {
      objectKey,
      contentType: input.contentType,
      apiMount: "rider",
    });
  }
}

function extensionFor(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".jpg";
  }
}
