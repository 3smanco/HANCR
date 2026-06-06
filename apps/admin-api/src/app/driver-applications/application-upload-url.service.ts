import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  ApplicationDocUploadUrlType,
  GenerateApplicationDocUploadUrlInput,
} from './dto/driver-application.types';

/**
 * M2 — Signed upload URLs for the public driver-application funnel.
 *
 * Same shape as the K4 driver-app uploader, but no auth (the marketing
 * page calls this before any driver record exists). The objectKey is
 * scoped under `applications/{random}` and the resulting publicUrl is
 * the value passed back via `submitDriverApplication`.
 *
 * Production path: GCS v4 signed PUT URL when GCS_DRIVER_DOCS_BUCKET +
 * GCS_SERVICE_ACCOUNT_JSON are set.
 * Dev fallback: `/uploads/applications/...` placeholder so the wizard
 * still works without GCS creds.
 */
@Injectable()
export class ApplicationUploadUrlService {
  private readonly logger = new Logger(ApplicationUploadUrlService.name);

  constructor(private readonly cfg: ConfigService) {}

  async generate(
    input: GenerateApplicationDocUploadUrlInput,
  ): Promise<ApplicationDocUploadUrlType> {
    const bucket = this.cfg.get<string>('GCS_DRIVER_DOCS_BUCKET');
    const saJson = this.cfg.get<string>('GCS_SERVICE_ACCOUNT_JSON');
    const ext = extensionFor(input.contentType);
    const objectKey = `applications/${Date.now()}-${randomBytes(8).toString('hex')}/${input.type}${ext}`;

    if (bucket && saJson) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Storage } = require('@google-cloud/storage') as typeof import('@google-cloud/storage');
        const credentials = JSON.parse(saJson) as Record<string, unknown>;
        const storage = new Storage({ credentials });
        const file = storage.bucket(bucket).file(objectKey);
        const expiresIn = 60 * 10;
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
          `GCS signed-URL generation failed (${(err as Error).message}); falling back to placeholder`,
        );
      }
    }

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
    case 'image/png': return '.png';
    case 'image/webp': return '.webp';
    case 'application/pdf': return '.pdf';
    default: return '.jpg';
  }
}
