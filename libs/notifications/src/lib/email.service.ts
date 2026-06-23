import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { maskEmail } from '@hancr/observability';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * EmailService — يرسل رسائل البريد عبر SMTP (nodemailer).
 *
 * طرق التهيئة (env):
 *  - SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASS + EMAIL_FROM → بريد حقيقي
 *  - بدونها → dev mode: يُسجِّل الرسالة في الـ logs فقط (success:false)
 *
 * نمط الصدق (مثل SmsService): success يعكس التسليم الفعلي — لا success:true كاذب.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private fromAddress: string | null = null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const port = parseInt(config.get<string>('SMTP_PORT') ?? '587', 10);
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    const from =
      config.get<string>('EMAIL_FROM') ?? 'HANCR <no-reply@hancr.com>';

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // 465 = TLS مباشر، غيره = STARTTLS
          auth: { user, pass },
        });
        this.fromAddress = from;
        this.logger.log(`SMTP configured — host: ${host}, from: ${from}`);
      } catch (e) {
        this.logger.error(
          `Failed to initialize SMTP: ${(e as Error).message}`,
        );
      }
    } else {
      this.logger.warn(
        'SMTP not configured — emails will be logged only (dev mode)',
      );
    }
  }

  /** True when SMTP is fully configured */
  get enabled(): boolean {
    return this.transporter !== null && this.fromAddress !== null;
  }

  async send(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<EmailResult> {
    const maskedTo = maskEmail(to);

    if (!this.enabled) {
      this.logger.debug(
        `[dev-email] would send subject(${subject.length} chars) to ${maskedTo}`,
      );
      return { success: false, error: 'smtp_disabled' };
    }

    try {
      const info = await this.transporter!.sendMail({
        from: this.fromAddress!,
        to,
        subject,
        html,
        text: text ?? html.replace(/<[^>]+>/g, ''),
      });
      this.logger.log(`Email sent to ${maskedTo} (id: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (e) {
      const err = e as Error;
      this.logger.warn(`Email send failed to ${maskedTo}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send an OTP email with a localized, branded template.
   */
  async sendOtp(
    email: string,
    code: string,
    locale: 'ar' | 'en' = 'ar',
  ): Promise<EmailResult> {
    const isAr = locale === 'ar';
    const subject = isAr ? `رمز الدخول إلى HANCR: ${code}` : `Your HANCR code: ${code}`;
    const dir = isAr ? 'rtl' : 'ltr';
    const title = isAr ? 'رمز التحقق' : 'Verification code';
    const body = isAr
      ? 'استخدم الرمز التالي لإكمال تسجيل الدخول. صالح لمدة 5 دقائق ولا تُشاركه مع أحد.'
      : 'Use the code below to complete your sign-in. Valid for 5 minutes — do not share it.';
    const html = `
      <div dir="${dir}" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0d0d0f;color:#f5f5f7;border-radius:16px">
        <h1 style="color:#ff6a2b;letter-spacing:3px;margin:0 0 8px">HANCR</h1>
        <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>
        <p style="color:#b8b8c0;line-height:1.6;margin:0 0 20px">${body}</p>
        <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#ff6a2b;background:#1a1a1f;border-radius:12px;padding:16px;text-align:center">${code}</div>
      </div>`;
    return this.send(email, subject, html);
  }
}
