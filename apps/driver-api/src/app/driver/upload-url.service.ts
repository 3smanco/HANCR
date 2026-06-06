import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  DocumentUploadUrlType,
  GenerateUploadUrlInput,
} from './dto/upload-url.type';

/**
 * K4 — Driver document upload URL generator.
 *
 * Production path: returns a Google Cloud Storage v4-signed PUT URL so the
 * driver app uploads the file directly to the bucket (no relay through our
 * API, no double-bandwidth cost). The service account key is loaded from
 * `GCS_SERVICE_ACCOUNT_JSON` and the bucket from `GCS_DRIVER_DOCS_BUCKET`.
 *
 * Local-development fallback: if GCS env vars are missing, returns a
 * placeholder URL pointing at `/uploads/{key}` so the driver app's flow
 * is still exercised end-to-end (no real upload happens; the eventual
 * uploadDriverDocument mutation stores the placeholder URL).
 *
 * Why a stub is OK here: GCS credentials are an ops concern (bucket
 * creation, IAM, CORS, lifecycle policies). The shape of the contract
 * — generateUrl → PUT → uploadDriverDocument — is what unblocks the
 * driver-app screen. Swapping in real GCS later is one method body.
 */
@Injectable()
export class UploadUrlService {
  private readonly logger = new Logger(UploadUrlService.name);

  constructor(private readonly cfg: ConfigService) {}

  async generate(
    driverId: number,
    input: GenerateUploadUrlInput,
  ): Promise<DocumentUploadUrlType> {
    const bucket = this.cfg.get<string>('GCS_DRIVER_DOCS_BUCKET');
    const saJson = this.cfg.get<string>('GCS_SERVICE_ACCOUNT_JSON');
    const ext = extensionFor(input.contentType);
    const objectKey = `driver-${driverId}/${input.type}/${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;

    if (bucket && saJson) {
      // Production: real GCS v4 signed URL.
      // Lazy-require so projects without the dependency installed still build.
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Storage } = require('@google-cloud/storage') as typeof import('@google-cloud/storage');
        const credentials = JSON.parse(saJson) as Record<string, unknown>;
        const storage = new Storage({ credentials });
        const file = storage.bucket(bucket).file(objectKey);
        const expiresIn = 60 * 10; // 10 minutes
        const [uploadUrl] = await file.getSignedUrl({
          version: 'v4',
          action: 'write',
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
          `GCS signed-URL generation failed (${(err as Error).message}); falling back to placeholder URL`,
        );
      }
    }

    // Development / unconfigured fallback.
    this.logger.debug(
      `Returning placeholder upload URL for driver #${driverId} type=${input.type}`,
    );
    const base = this.cfg.get<string>('PUBLIC_UPLOADS_BASE') ?? '/uploads';
    return {
      uploadUrl: `${base}/${objectKey}`,
      publicUrl: `${base}/${objectKey}`,
      objectKey,
      expiresIn: 600,
    };
  }
}

function extensionFor(contentType: string): string {
  switch (contentType) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    default:
      return '.jpg';
  }
}
