import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { maskPhoneNumber } from '@hancr/observability';
import { Twilio } from 'twilio';

export interface SmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * SmsService — يرسل رسائل SMS عبر Twilio.
 *
 * طرق التهيئة:
 *  - مع `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER` → بريد حقيقي
 *  - بدونها → dev mode: يُسجِّل الرسالة في الـ logs فقط
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: Twilio | null = null;
  private fromNumber: string | null = null;

  constructor(private readonly config: ConfigService) {
    const sid = config.get<string>('TWILIO_ACCOUNT_SID');
    const token = config.get<string>('TWILIO_AUTH_TOKEN');
    const from = config.get<string>('TWILIO_FROM_NUMBER');

    if (sid && token && from && sid.startsWith('AC')) {
      try {
        this.client = new Twilio(sid, token);
        this.fromNumber = from;
        this.logger.log(`Twilio configured — sender: ${from}`);
      } catch (e) {
        this.logger.error(
          `Failed to initialize Twilio: ${(e as Error).message}`,
        );
      }
    } else {
      this.logger.warn(
        'Twilio not configured — SMS will be logged only (dev mode)',
      );
    }
  }

  /** True when Twilio is fully configured */
  get enabled(): boolean {
    return this.client !== null && this.fromNumber !== null;
  }

  /**
   * Send a plain-text SMS to a phone number in E.164 format (+966...).
   * Returns `{ success: false }` and logs in dev-mode when Twilio is missing.
   */
  async send(to: string, body: string): Promise<SmsResult> {
    const maskedTo = maskPhoneNumber(to);

    if (!this.enabled) {
      this.logger.debug(
        `[dev-sms] would send ${body.length} chars to ${maskedTo}`,
      );
      return { success: false, error: 'twilio_disabled' };
    }

    try {
      const msg = await this.client!.messages.create({
        from: this.fromNumber!,
        to,
        body,
      });
      this.logger.log(`SMS sent to ${maskedTo} (SID: ${msg.sid})`);
      return { success: true, sid: msg.sid };
    } catch (e) {
      const err = e as Error & { code?: string };
      this.logger.warn(
        `SMS send failed to ${maskedTo}: ${err.code} ${err.message}`,
      );
      return { success: false, error: err.code || err.message };
    }
  }

  /**
   * Send an OTP message with localized template.
   * Locale defaults to Arabic; pass 'en' for English.
   */
  async sendOtp(
    phone: string,
    code: string,
    locale: 'ar' | 'en' = 'ar',
  ): Promise<SmsResult> {
    const body =
      locale === 'ar'
        ? `رمز التحقق الخاص بـ HANCR هو: ${code}\nصالح لمدة 5 دقائق. لا تُشاركه مع أحد.`
        : `Your HANCR verification code is: ${code}\nValid for 5 minutes. Do not share it.`;

    return this.send(phone, body);
  }
}
