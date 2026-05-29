import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FirebaseAdminService — يهيِّئ Firebase Admin SDK مرة واحدة على مستوى التطبيق.
 *
 * مصادر الـ credentials (بالترتيب):
 *  1. ملف JSON عبر `FIREBASE_PRIVATE_KEY_PATH` (مفضَّل للـ dev)
 *  2. متغيرات منفصلة `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`
 *  3. لو لم يوجد — يعمل بدون Firebase ويُسجِّل warning (TWILIO dev mode)
 */
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private _app: admin.app.App | null = null;
  private _enabled = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.initialize();
  }

  /** Lazily initialize Firebase Admin once per process. */
  private initialize(): void {
    if (admin.apps.length > 0) {
      this._app = admin.app();
      this._enabled = true;
      return;
    }

    const credentials = this.loadCredentials();
    if (!credentials) {
      this.logger.warn(
        'Firebase credentials not found — push notifications disabled (dev mode)',
      );
      return;
    }

    try {
      this._app = admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: credentials.projectId,
      });
      this._enabled = true;
      this.logger.log(
        `Firebase Admin initialized — project: ${credentials.projectId}`,
      );
    } catch (e) {
      this.logger.error(
        `Failed to initialize Firebase Admin: ${(e as Error).message}`,
      );
    }
  }

  /** Load credentials from file or env. Returns null if not configured. */
  private loadCredentials(): admin.ServiceAccount | null {
    // Priority 1: JSON file
    const filePath = this.config.get<string>('FIREBASE_PRIVATE_KEY_PATH');
    if (filePath) {
      const resolved = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      if (fs.existsSync(resolved)) {
        try {
          const raw = fs.readFileSync(resolved, 'utf-8');
          const json = JSON.parse(raw) as {
            project_id: string;
            client_email: string;
            private_key: string;
          };
          return {
            projectId: json.project_id,
            clientEmail: json.client_email,
            privateKey: json.private_key,
          };
        } catch (e) {
          this.logger.error(
            `Invalid Firebase JSON at ${resolved}: ${(e as Error).message}`,
          );
        }
      } else {
        this.logger.warn(`Firebase JSON not found at ${resolved}`);
      }
    }

    // Priority 2: separate env vars
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');
    if (projectId && clientEmail && privateKey) {
      return {
        projectId,
        clientEmail,
        // Handle escaped newlines that often appear in env files
        privateKey: privateKey.replace(/\\n/g, '\n'),
      };
    }

    return null;
  }

  /** True when SDK is initialized and ready to send. */
  get enabled(): boolean {
    return this._enabled;
  }

  /** The raw messaging instance. Throws if Firebase is not initialized. */
  messaging(): admin.messaging.Messaging {
    if (!this._app) {
      throw new Error(
        'Firebase Admin not initialized — set FIREBASE_PRIVATE_KEY_PATH or FIREBASE_* env vars',
      );
    }
    return this._app.messaging();
  }

  /** Raw app handle for advanced use cases (auth, firestore...). */
  app(): admin.app.App | null {
    return this._app;
  }
}
