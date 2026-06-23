import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { OAuth2Client } from 'google-auth-library';
import { DriverEntity } from '@hancr/database';
import { SmsService, EmailService } from '@hancr/notifications';
import {
  captureException,
  maskEmail,
  maskPhoneNumber,
} from '@hancr/observability';
import { JwtPayload } from './jwt.strategy';

const OTP_TTL_SECONDS = 300;
const MAX_OTP_ATTEMPTS = 5;

/** هوية مُتحقَّق منها (Google/إيميل) بانتظار ربط هاتف */
interface PendingIdentity {
  email?: string;
  googleId?: string;
  name?: string;
  referralCode?: string;
}

/** نتيجة وسيطة للدخول الاجتماعي — يحوّلها الـ resolver لـ AuthResult */
export interface SocialAuthResult {
  success: boolean;
  needsPhone: boolean;
  pendingToken?: string;
  accessToken?: string;
  driver?: DriverEntity;
  isNewDriver?: boolean;
  message?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client | null = null;

  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // إيميلات تجريبية بـ OTP ثابت 123456
  private static readonly TEST_EMAILS = new Set<string>([
    'driver-demo@hancr.com',
  ]);

  private allowTestIdentities(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'development') return true;
    if (nodeEnv === 'production') return false;
    return (
      this.configService.get<string>('ALLOW_TEST_PHONES', 'false') === 'true'
    );
  }

  // أرقام تجريبية بـ OTP ثابت = 123456 (6 خانات)
  private static readonly TEST_DRIVER_PHONES = new Set<string>([
    '+97433000010', // Driver demo (Qatar)
    '+97433000011', // Driver demo 2 (Qatar)
    '+966500000010', // Driver demo (KSA) — legacy
    '+966500000011', // Driver demo 2 (KSA) — legacy
  ]);

  async sendOtp(
    phone: string,
  ): Promise<{ success: boolean; message: string; devOtp?: string }> {
    const maskedPhone = maskPhoneNumber(phone);
    const key = `hancr:otp:driver:${phone}`;
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';
    // أمن: حدّ لكل رقم (3/60ث) — يمنع قصف SMS لرقم واحد عبر IPs متعدّدة.
    const rlKey = `hancr:otp:rl:driver:${phone}`;
    const sent = await this.redis.incr(rlKey);
    if (sent === 1) await this.redis.expire(rlKey, 60);
    if (sent > 3) {
      throw new UnauthorizedException('محاولات كثيرة. انتظر دقيقة.');
    }
    // الأرقام التجريبية — مُتحكَّم بها عبر ALLOW_TEST_PHONES (مُفعَّلة للاختبار
    // حتى يعمل Twilio؛ اضبطها false عند الإطلاق الحقيقي).
    const allowTestPhones = this.allowTestIdentities();
    const isTestPhone =
      allowTestPhones && AuthService.TEST_DRIVER_PHONES.has(phone);
    const code = isTestPhone
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString();

    await this.redis.setex(
      key,
      OTP_TTL_SECONDS,
      JSON.stringify({ code, attempts: 0 }),
    );
    // أمن: لا نُسجّل قيمة OTP أبداً. في dev تُعاد عبر devOtp عند السماح بذلك.
    if (isDev) {
      this.logger.debug(`[dev] Driver OTP issued for ${maskedPhone}`);
    } else {
      this.logger.log(`Driver OTP issued for ${maskedPhone}`);
    }

    const sms = await this.smsService.sendOtp(phone, code, 'ar');
    // أمن: لا نكشف الكود إلا في dev أو لرقم تجريبي ثابت. فشل Twilio لا يكشفه.
    const exposeDevOtp = isDev || isTestPhone;
    const deliverable = sms.success || exposeDevOtp;

    if (!deliverable && this.smsService.enabled) {
      this.logger.error(
        `Driver OTP SMS delivery failed for ${maskedPhone}: ${sms.error}`,
      );
      captureException(
        new Error(`Driver OTP SMS delivery failed: ${sms.error}`),
        { phone: maskedPhone, gateway: 'twilio' },
      );
    }

    let message: string;
    if (sms.success) {
      message = `OTP sent to ${phone}`;
    } else if (exposeDevOtp) {
      message = 'OTP (dev) — returned in response';
    } else {
      message = 'تعذّر إرسال رمز التحقق حالياً. حاول لاحقاً.';
    }

    return {
      success: deliverable,
      message,
      devOtp: exposeDevOtp ? code : undefined,
    };
  }

  async verifyOtp(
    phone: string,
    code: string,
    pendingToken?: string,
  ): Promise<{
    accessToken: string;
    driver: DriverEntity;
    isNewDriver: boolean;
  }> {
    const key = `hancr:otp:driver:${phone}`;
    const raw = await this.redis.get(key);

    if (!raw) throw new UnauthorizedException('OTP expired or not found');
    const stored = JSON.parse(raw) as { code: string; attempts: number };

    if (stored.attempts >= MAX_OTP_ATTEMPTS) {
      await this.redis.del(key);
      throw new UnauthorizedException('Too many failed attempts');
    }

    if (stored.code !== code) {
      stored.attempts += 1;
      await this.redis.setex(key, OTP_TTL_SECONDS, JSON.stringify(stored));
      throw new UnauthorizedException(
        `Invalid OTP. ${MAX_OTP_ATTEMPTS - stored.attempts} remaining.`,
      );
    }

    await this.redis.del(key);

    const countryCode = this.extractCountryCode(phone);

    let driver = await this.driverRepo.findOne({
      where: { phoneNumber: phone },
    });
    const isNewDriver = !driver;

    if (!driver) {
      driver = this.driverRepo.create({
        phoneNumber: phone,
        countryCode,
        firstName: 'Driver',
        lastName: '',
        active: false, // يحتاج موافقة Admin
        banned: false,
        balance: 0,
        currency: this.getDefaultCurrency(countryCode),
        rating: 5.0,
        ratingCount: 0,
        serviceIds: [],
      });
      driver = await this.driverRepo.save(driver);
      this.logger.log(
        `New driver registered: ${maskPhoneNumber(phone)} (ID: ${driver.id})`,
      );
    }

    // ربط هوية Google/الإيميل بحساب الهاتف (إن مُرِّر رمز ربط صالح)
    if (pendingToken) {
      const pending = this.verifyPendingToken(pendingToken);
      if (pending) await this.applyPendingIdentity(driver, pending);
    }

    const payload: JwtPayload = { sub: driver.id, phone, type: 'driver' };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, driver, isNewDriver };
  }

  // =============================================
  // الدخول بالإيميل (OTP) + Google
  // =============================================
  async sendEmailOtp(
    rawEmail: string,
  ): Promise<{ success: boolean; message: string; devOtp?: string }> {
    const email = rawEmail.trim().toLowerCase();
    const maskedEmail = maskEmail(email);
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    const rlKey = `hancr:otp:rl:driver-email:${email}`;
    const sent = await this.redis.incr(rlKey);
    if (sent === 1) await this.redis.expire(rlKey, 60);
    if (sent > 3) throw new UnauthorizedException('محاولات كثيرة. انتظر دقيقة.');

    const isTest =
      this.allowTestIdentities() && AuthService.TEST_EMAILS.has(email);
    const code = isTest
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString();

    await this.redis.setex(
      `hancr:otp:driver-email:${email}`,
      OTP_TTL_SECONDS,
      JSON.stringify({ code, attempts: 0 }),
    );
    if (isDev) {
      this.logger.debug(`[dev] Driver email OTP issued for ${maskedEmail}`);
    }

    const res = await this.emailService.sendOtp(email, code, 'ar');
    const expose = isDev || isTest;
    const deliverable = res.success || expose;
    if (!deliverable && this.emailService.enabled) {
      captureException(new Error(`Driver email OTP failed: ${res.error}`), {
        email: maskedEmail,
        gateway: 'smtp',
      });
    }
    const message = res.success
      ? `تم إرسال الرمز إلى ${email}`
      : expose
        ? 'OTP (dev) — returned in response'
        : 'تعذّر إرسال الرمز للبريد حالياً.';
    return { success: deliverable, message, devOtp: expose ? code : undefined };
  }

  async verifyEmailOtp(
    rawEmail: string,
    code: string,
  ): Promise<SocialAuthResult> {
    const email = rawEmail.trim().toLowerCase();
    const key = `hancr:otp:driver-email:${email}`;
    const raw = await this.redis.get(key);
    if (!raw) throw new UnauthorizedException('انتهت صلاحية الرمز.');
    const stored = JSON.parse(raw) as { code: string; attempts: number };
    if (stored.attempts >= MAX_OTP_ATTEMPTS) {
      await this.redis.del(key);
      throw new UnauthorizedException('محاولات كثيرة.');
    }
    if (stored.code !== code) {
      stored.attempts += 1;
      await this.redis.setex(key, OTP_TTL_SECONDS, JSON.stringify(stored));
      throw new UnauthorizedException(
        `رمز خاطئ. تبقّى ${MAX_OTP_ATTEMPTS - stored.attempts} محاولات.`,
      );
    }
    await this.redis.del(key);
    return this.resolveIdentity({ email });
  }

  async googleAuth(idToken: string): Promise<SocialAuthResult> {
    const identity = await this.verifyGoogleIdToken(idToken);
    if (!identity) {
      return {
        success: false,
        needsPhone: false,
        message: 'تعذّر التحقق من حساب Google.',
      };
    }
    return this.resolveIdentity(identity);
  }

  private async resolveIdentity(p: PendingIdentity): Promise<SocialAuthResult> {
    let driver: DriverEntity | null = null;
    if (p.googleId) {
      driver = await this.driverRepo.findOne({
        where: { googleId: p.googleId },
      });
    }
    if (!driver && p.email) {
      driver = await this.driverRepo.findOne({ where: { email: p.email } });
    }

    if (driver) {
      if (driver.banned) throw new UnauthorizedException('هذا الحساب محظور.');
      const patch: { googleId?: string; email?: string } = {};
      if (p.googleId && !driver.googleId) patch.googleId = p.googleId;
      if (p.email && !driver.email) patch.email = p.email;
      if (Object.keys(patch).length) {
        await this.driverRepo.update(driver.id, patch);
        Object.assign(driver, patch);
      }
      const accessToken = this.jwtService.sign({
        sub: driver.id,
        phone: driver.phoneNumber,
        type: 'driver',
      } as JwtPayload);
      return {
        success: true,
        needsPhone: false,
        accessToken,
        driver,
        isNewDriver: false,
      };
    }

    return {
      success: true,
      needsPhone: true,
      isNewDriver: true,
      pendingToken: this.signPendingToken(p),
      message: 'أضف رقم هاتفك لإكمال إنشاء الحساب.',
    };
  }

  private async applyPendingIdentity(
    driver: DriverEntity,
    p: PendingIdentity,
  ): Promise<void> {
    const patch: { email?: string; googleId?: string } = {};
    if (p.email && !driver.email) patch.email = p.email;
    if (p.googleId && !driver.googleId) patch.googleId = p.googleId;
    if (Object.keys(patch).length === 0) return;
    try {
      await this.driverRepo.update(driver.id, patch);
      Object.assign(driver, patch);
    } catch (e) {
      this.logger.warn(
        `Could not link identity to driver #${driver.id}: ${(e as Error).message}`,
      );
    }
  }

  private signPendingToken(p: PendingIdentity): string {
    return this.jwtService.sign(
      { scope: 'link-phone', ...p },
      { expiresIn: '15m' },
    );
  }

  private verifyPendingToken(token: string): PendingIdentity | null {
    try {
      const payload = this.jwtService.verify<
        PendingIdentity & { scope?: string }
      >(token);
      if (payload.scope !== 'link-phone') return null;
      return {
        email: payload.email,
        googleId: payload.googleId,
        name: payload.name,
      };
    } catch {
      return null;
    }
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<{ email: string; googleId: string; name?: string } | null> {
    const clientIds = (
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID') ?? ''
    )
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (clientIds.length === 0) {
      this.logger.warn('GOOGLE_OAUTH_CLIENT_ID غير مُهيّأ — دخول Google معطّل.');
      return null;
    }
    if (!this.googleClient) this.googleClient = new OAuth2Client();
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientIds,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || !payload.email_verified) {
        return null;
      }
      return {
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        name: payload.name,
      };
    } catch (e) {
      this.logger.warn(`Google token verify failed: ${(e as Error).message}`);
      return null;
    }
  }

  private extractCountryCode(phone: string): string {
    if (phone.startsWith('+974')) return '+974';
    if (phone.startsWith('+971')) return '+971';
    if (phone.startsWith('+966')) return '+966';
    if (phone.startsWith('+965')) return '+965';
    if (phone.startsWith('+973')) return '+973';
    if (phone.startsWith('+968')) return '+968';
    return phone.substring(0, 4);
  }

  private getDefaultCurrency(cc: string): string {
    const map: Record<string, string> = {
      '+974': 'QAR',
      '+971': 'AED',
      '+966': 'SAR',
      '+965': 'KWD',
      '+973': 'BHD',
      '+968': 'OMR',
    };
    return map[cc] ?? 'QAR';
  }
}
