import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigEntity } from '@hancr/database';

const CACHE_TTL_MS = 60_000;
const MAIN_KEY = 'main';

/**
 * GatewayCredentials — مصدر مفاتيح بوابات الدفع.
 *
 * يقرأ من `gateway_config` (jsonb في hancr_app_config، يُدار من لوحة التحكم)
 * أولاً، ثم يسقط على متغيرات البيئة (.env) كـ fallback. مُخزَّن مؤقتاً (60s)
 * ليُقرأ بشكل متزامن داخل تحقّق الـ webhook (الذي لا يقبل async).
 *
 * صيغة gateway_config:
 * {
 *   stripe:   { secretKey, webhookSecret },
 *   hyperpay: { accessToken, entityId, baseUrl, webhookSecret },
 *   moyasar:  { apiKey, webhookSecret }
 * }
 */
@Injectable()
export class GatewayCredentials implements OnModuleInit {
  private readonly logger = new Logger(GatewayCredentials.name);
  private cache: Record<string, Record<string, unknown>> = {};
  private cachedAt = 0;
  private inflight: Promise<void> | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AppConfigEntity)
    private readonly repo: Repository<AppConfigEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    // تحميل أولي حتى يتوفّر الكاش لتحقّق الـ webhook المتزامن.
    await this.ensureLoaded().catch(() => undefined);
  }

  /** يضمن تحميل gateway_config (يُستدعى قبل createCheckout). */
  async ensureLoaded(): Promise<void> {
    const now = Date.now();
    if (this.cachedAt && now - this.cachedAt < CACHE_TTL_MS) return;
    if (this.inflight) return this.inflight;
    this.inflight = this.repo
      .findOne({ where: { configKey: MAIN_KEY } })
      .then((row) => {
        this.cache =
          (row?.gatewayConfig as Record<string, Record<string, unknown>>) ?? {};
        this.cachedAt = Date.now();
      })
      .catch((e) => {
        this.logger.warn(
          `gateway_config load failed: ${(e as Error).message}`,
        );
      })
      .finally(() => {
        this.inflight = null;
      });
    return this.inflight;
  }

  /** يُبطل الكاش (بعد حفظ الأدمن لو في نفس العملية). */
  invalidate(): void {
    this.cachedAt = 0;
  }

  /** يقرأ مفتاحاً لبوابة: DB أولاً ثم البيئة. متزامن (من الكاش). */
  get(gateway: string, field: string, envKey: string): string | undefined {
    const fromDb = this.cache?.[gateway]?.[field];
    if (typeof fromDb === 'string' && fromDb.trim()) return fromDb.trim();
    const fromEnv = this.config.get<string>(envKey);
    return fromEnv && fromEnv.trim() ? fromEnv.trim() : undefined;
  }

  /** هل توجد أي بوابة مُهيَّأة (DB أو env)؟ يحدّد stub mode. */
  hasAny(): boolean {
    const dbHas = Object.values(this.cache ?? {}).some(
      (g) =>
        g &&
        Object.values(g).some(
          (v) => typeof v === 'string' && (v as string).trim().length > 0,
        ),
    );
    if (dbHas) return true;
    return (
      !!this.config.get<string>('STRIPE_SECRET_KEY') ||
      !!this.config.get<string>('HYPERPAY_ACCESS_TOKEN') ||
      !!this.config.get<string>('MOYASAR_API_KEY')
    );
  }
}
