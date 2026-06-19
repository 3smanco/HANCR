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
import { createHash, randomUUID } from 'crypto';
import { RiderEntity, RiderDeviceEntity } from '@hancr/database';
import { SmsService, EmailService } from '@hancr/notifications';
import { captureException } from '@hancr/observability';
import {
  generateTotpSecret,
  buildOtpAuthUri,
  verifyTotp,
} from './totp.util';
import { SendOtpInput } from './dto/send-otp.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { SendOtpResponse } from './dto/send-otp-response.type';
import { AuthPayload } from './dto/auth-payload.type';
import { AuthResult } from './dto/auth-result.type';
import { SendEmailOtpInput } from './dto/send-email-otp.input';
import { VerifyEmailOtpInput } from './dto/verify-email-otp.input';
import { GoogleAuthInput } from './dto/google-auth.input';
import { RiderType } from '../rider/dto/rider.type';
import { JwtPayload, revokedKey, revokedJtiKey } from './jwt.strategy';
import { AppConfigReader } from '../app-config/app-config-reader.service';

// N1 — defaults preserved as fallback; live values come from AppConfigReader.
const DEFAULT_OTP_TTL_SECONDS = 300; // 5 دقائق
const DEFAULT_MAX_OTP_ATTEMPTS = 5;

/** هوية مُتحقَّق منها (Google/إيميل) بانتظار ربط هاتف */
interface PendingIdentity {
  email?: string;
  googleId?: string;
  name?: string;
  referralCode?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client | null = null;

  constructor(
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,

    @InjectRepository(RiderDeviceEntity)
    private readonly deviceRepo: Repository<RiderDeviceEntity>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly appConfig: AppConfigReader,

    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  // =============================================
  // sendOtp — إرسال رمز OTP للتحقق من الهاتف
  // =============================================
  // أرقام تجريبية بـ OTP ثابت — للـ demo + Play Store reviewers
  // OTP الثابت: 123456 (6 خانات)
  private static readonly TEST_PHONES = new Set<string>([
    '+97433000001', // Rider demo (Qatar)
    '+97433000002', // Rider demo 2 (Qatar)
    '+966500000001', // Rider demo (KSA) — legacy
    '+966500000002', // Rider demo 2 (KSA) — legacy
  ]);

  async sendOtp(input: SendOtpInput): Promise<SendOtpResponse> {
    const { phone } = input;
    const key = `hancr:otp:login:${phone}`;
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    // أمن: حدّ لكل رقم (يمنع قصف SMS لرقم واحد عبر IPs متعدّدة — تحديد المعدّل
    // لكل IP وحده لا يكفي). 3 رسائل/60ث لكل رقم.
    const rlKey = `hancr:otp:rl:${phone}`;
    const sent = await this.redis.incr(rlKey);
    if (sent === 1) await this.redis.expire(rlKey, 60);
    if (sent > 3) {
      throw new UnauthorizedException(
        'محاولات كثيرة. انتظر دقيقة قبل طلب رمز جديد.',
      );
    }
    // الأرقام التجريبية (OTP ثابت 123456) — مُتحكَّم بها عبر ALLOW_TEST_PHONES.
    // تبقى مُفعَّلة أثناء التطوير/الاختبار (حتى يعمل Twilio الفعلي)؛
    // اضبط ALLOW_TEST_PHONES=false عند الإطلاق الحقيقي لإغلاق هذا الباب.
    const allowTestPhones =
      isDev ||
      this.configService.get<string>('ALLOW_TEST_PHONES', 'true') !== 'false';
    const isTestPhone = allowTestPhones && AuthService.TEST_PHONES.has(phone);

    const code = isTestPhone
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString();

    // N1 — TTL يأتي من لوحة التحكم (operationsConfig.otpTtlSeconds)
    const ops = await this.appConfig.getOperations();
    const otpTtl = ops.otpTtlSeconds ?? DEFAULT_OTP_TTL_SECONDS;

    // تخزين OTP في Redis مع TTL القابل للتحكم من اللوحة
    await this.redis.setex(
      key,
      otpTtl,
      JSON.stringify({ code, attempts: 0 }),
    );
    // أمن: لا نُسجّل قيمة OTP أبداً. في dev فقط نُظهر الكود للتشخيص.
    if (isDev) {
      this.logger.debug(`[dev] OTP for ${phone}: ${code}`);
    } else {
      this.logger.log(`OTP issued for ${phone}`);
    }

    // إرسال SMS عبر Twilio لو مُكوَّن
    const sms = await this.smsService.sendOtp(phone, code, 'ar');

    // أمن: لا نُعيد الكود في الاستجابة إلا في dev أو لرقم تجريبي ثابت (123456 معروف).
    // فشل Twilio في الإنتاج لا يكشف الكود إطلاقاً (سابقاً كان ثغرة استيلاء على الحساب).
    const exposeDevOtp = isDev || isTestPhone;

    // قابل للتسليم لو نجح SMS أو كنّا في dev/رقم تجريبي (الكود يُعاد في الاستجابة).
    const deliverable = sms.success || exposeDevOtp;

    // مراقبة: فشل تسليم OTP في الإنتاج (Twilio مُفعَّل لكنه فشل) يُرسَل لـ Sentry —
    // كان يُبتلَع كـ success:true فلا يُنبّه أحداً (مثال: حساب Twilio تجريبي/خطأ 21608).
    if (!deliverable && this.smsService.enabled) {
      this.logger.error(`OTP SMS delivery failed for ${phone}: ${sms.error}`);
      captureException(
        new Error(`OTP SMS delivery failed: ${sms.error}`),
        { phone, gateway: 'twilio' },
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
      // أمن/صدق: success يعكس قابلية التسليم فعلاً (لا success:true كاذب).
      success: deliverable,
      message,
      devOtp: exposeDevOtp ? code : undefined,
    };
  }

  // =============================================
  // verifyOtp — التحقق من OTP وإنشاء/إيجاد الراكب
  // =============================================
  async verifyOtp(input: VerifyOtpInput): Promise<AuthPayload> {
    const { phone, code } = input;
    const key = `hancr:otp:login:${phone}`;

    // استرداد OTP من Redis
    const raw = await this.redis.get(key);
    if (!raw) {
      throw new UnauthorizedException(
        'OTP expired or not found. Request a new one.',
      );
    }

    const stored = JSON.parse(raw) as { code: string; attempts: number };

    // N1 — الحدود تأتي من لوحة التحكم (operationsConfig)
    const ops = await this.appConfig.getOperations();
    const maxAttempts = ops.maxOtpAttempts ?? DEFAULT_MAX_OTP_ATTEMPTS;
    const otpTtl = ops.otpTtlSeconds ?? DEFAULT_OTP_TTL_SECONDS;

    // تحقق من عدد المحاولات
    if (stored.attempts >= maxAttempts) {
      await this.redis.del(key);
      throw new UnauthorizedException(
        'Too many failed attempts. Request a new OTP.',
      );
    }

    // مقارنة الرمز
    if (stored.code !== code) {
      stored.attempts += 1;
      await this.redis.setex(
        key,
        otpTtl,
        JSON.stringify(stored),
      );
      throw new UnauthorizedException(
        `Invalid OTP. ${maxAttempts - stored.attempts} attempts remaining.`,
      );
    }

    // حذف OTP بعد نجاح التحقق
    await this.redis.del(key);

    // استخراج رمز الدولة من الرقم
    const countryCode = this.extractCountryCode(phone);

    // فكّ رمز الربط (Google/إيميل) إن وُجد — يوفّر هوية مُتحقَّقة + كود إحالة
    const pending = input.pendingToken
      ? this.verifyPendingToken(input.pendingToken)
      : null;
    const referralInput = input.referralCode?.trim() || pending?.referralCode;

    // إيجاد أو إنشاء الراكب
    let rider = await this.riderRepo.findOne({ where: { phoneNumber: phone } });
    const isNewUser = !rider;

    if (!rider) {
      // التقاط المُحيل من كود الإحالة (إن وُجد وصالح ولا يحيل نفسه لاحقاً)
      let referredBy: number | undefined;
      if (referralInput && referralInput.trim()) {
        const referrer = await this.riderRepo.findOne({
          where: { referralCode: referralInput.trim().toUpperCase() },
          select: ['id'],
        });
        if (referrer) referredBy = referrer.id;
      }

      rider = this.riderRepo.create({
        phoneNumber: phone,
        countryCode,
        active: true,
        banned: false,
        balance: 0,
        currency: this.getDefaultCurrency(countryCode),
        rating: 5.0,
        totalRides: 0,
        referralCode: await this.generateReferralCode(),
        referredBy,
        referralRewarded: false,
      });
      rider = await this.riderRepo.save(rider);
      this.logger.log(
        `New rider registered: ${phone} (ID: ${rider.id})` +
          (referredBy ? ` referred by #${referredBy}` : ''),
      );
    } else {
      // تحديث آخر دخول
      await this.riderRepo.update(rider.id, { lastLoginAt: new Date() });
      rider.lastLoginAt = new Date();
    }

    // ربط هوية Google/الإيميل بحساب الهاتف (إنشاءً أو دمجاً)
    if (pending) {
      await this.applyPendingIdentity(rider, pending);
    }

    // تحقّق بخطوتين: إن كان مفعّلاً لا نُصدر جلسة بعد — نعيد رمزاً مؤقّتاً.
    if (rider.twoFactorEnabled) {
      return {
        accessToken: '',
        rider: this.toRiderType(rider),
        isNewUser,
        twoFactorRequired: true,
        pendingToken: this.signTwoFactorPending(rider.id),
      };
    }

    const accessToken = await this.issueSession(rider, {
      deviceName: input.deviceName,
      platform: input.platform,
    });

    return {
      accessToken,
      rider: this.toRiderType(rider),
      isNewUser,
      twoFactorRequired: false,
    };
  }

  // =============================================
  // مُحوِّل موحّد: RiderEntity → RiderType
  // =============================================
  private toRiderType(rider: RiderEntity): RiderType {
    return {
      id: rider.id,
      phoneNumber: rider.phoneNumber,
      countryCode: rider.countryCode,
      firstName: rider.firstName,
      lastName: rider.lastName,
      avatarUrl: rider.avatarUrl,
      email: rider.email,
      banned: rider.banned,
      active: rider.active,
      balance: Number(rider.balance),
      currency: rider.currency,
      rating: Number(rider.rating),
      totalRides: rider.totalRides,
      lastLoginAt: rider.lastLoginAt,
      createdAt: rider.createdAt,
      teamCode: rider.teamCode,
      twoFactorEnabled: rider.twoFactorEnabled,
    };
  }

  // =============================================
  // الدخول بالإيميل (OTP) + Google
  // =============================================
  // إيميلات تجريبية بـ OTP ثابت 123456 — للـ demo + المراجعين.
  private static readonly TEST_EMAILS = new Set<string>([
    'rider-demo@hancr.com',
  ]);

  /** هل نسمح بالهويات التجريبية (نفس علم الأرقام التجريبية) */
  private allowTestIdentities(): boolean {
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';
    return (
      isDev ||
      this.configService.get<string>('ALLOW_TEST_PHONES', 'true') !== 'false'
    );
  }

  /** يُرسل رمز OTP إلى البريد (تخزين Redis مع TTL من اللوحة) */
  async sendEmailOtp(input: SendEmailOtpInput): Promise<SendOtpResponse> {
    const email = input.email.trim().toLowerCase();
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    // حدّ لكل بريد: 3/60ث (يمنع قصف البريد)
    const rlKey = `hancr:otp:rl:email:${email}`;
    const sent = await this.redis.incr(rlKey);
    if (sent === 1) await this.redis.expire(rlKey, 60);
    if (sent > 3) {
      throw new UnauthorizedException('محاولات كثيرة. انتظر دقيقة.');
    }

    const isTest =
      this.allowTestIdentities() && AuthService.TEST_EMAILS.has(email);
    const code = isTest
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString();

    const ops = await this.appConfig.getOperations();
    const otpTtl = ops.otpTtlSeconds ?? DEFAULT_OTP_TTL_SECONDS;
    await this.redis.setex(
      `hancr:otp:email:${email}`,
      otpTtl,
      JSON.stringify({ code, attempts: 0 }),
    );
    if (isDev) this.logger.debug(`[dev] Email OTP for ${email}: ${code}`);

    const res = await this.emailService.sendOtp(email, code, 'ar');
    const expose = isDev || isTest;
    const deliverable = res.success || expose;

    if (!deliverable && this.emailService.enabled) {
      this.logger.error(`Email OTP delivery failed for ${email}: ${res.error}`);
      captureException(new Error(`Email OTP delivery failed: ${res.error}`), {
        email,
        gateway: 'smtp',
      });
    }

    let message: string;
    if (res.success) message = `تم إرسال الرمز إلى ${email}`;
    else if (expose) message = 'OTP (dev) — returned in response';
    else message = 'تعذّر إرسال رمز التحقق للبريد حالياً. حاول لاحقاً.';

    return { success: deliverable, message, devOtp: expose ? code : undefined };
  }

  /** يتحقق من OTP البريد — دخول كامل إن وُجد حساب، وإلا رمز ربط هاتف */
  async verifyEmailOtp(input: VerifyEmailOtpInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const key = `hancr:otp:email:${email}`;
    const raw = await this.redis.get(key);
    if (!raw) {
      throw new UnauthorizedException('انتهت صلاحية الرمز. اطلب رمزاً جديداً.');
    }
    const stored = JSON.parse(raw) as { code: string; attempts: number };

    const ops = await this.appConfig.getOperations();
    const maxAttempts = ops.maxOtpAttempts ?? DEFAULT_MAX_OTP_ATTEMPTS;
    const otpTtl = ops.otpTtlSeconds ?? DEFAULT_OTP_TTL_SECONDS;

    if (stored.attempts >= maxAttempts) {
      await this.redis.del(key);
      throw new UnauthorizedException('محاولات كثيرة. اطلب رمزاً جديداً.');
    }
    if (stored.code !== input.code) {
      stored.attempts += 1;
      await this.redis.setex(key, otpTtl, JSON.stringify(stored));
      throw new UnauthorizedException(
        `رمز خاطئ. تبقّى ${maxAttempts - stored.attempts} محاولات.`,
      );
    }
    await this.redis.del(key);

    return this.resolveIdentity({ email, referralCode: input.referralCode });
  }

  /** يتحقق من Google ID token — دخول كامل إن وُجد حساب، وإلا رمز ربط هاتف */
  async googleAuth(input: GoogleAuthInput): Promise<AuthResult> {
    const identity = await this.verifyGoogleIdToken(input.idToken);
    if (!identity) {
      return {
        success: false,
        needsPhone: false,
        message:
          'تعذّر التحقق من حساب Google. (قد لا يكون الدخول بـ Google مُهيّأً بعد.)',
      };
    }
    return this.resolveIdentity({
      email: identity.email,
      googleId: identity.googleId,
      name: identity.name,
      referralCode: input.referralCode,
    });
  }

  /**
   * منطق موحّد: من هوية مُتحقَّقة (إيميل/Google) →
   *  - إن وُجد راكب مطابق (googleId أو email): دخول كامل (نربط googleId إن نقص).
   *  - وإلا: رمز ربط مؤقّت (المستخدم يُكمل بربط هاتف عبر verifyOtp).
   */
  private async resolveIdentity(p: PendingIdentity): Promise<AuthResult> {
    let rider: RiderEntity | null = null;
    if (p.googleId) {
      rider = await this.riderRepo.findOne({ where: { googleId: p.googleId } });
    }
    if (!rider && p.email) {
      rider = await this.riderRepo.findOne({ where: { email: p.email } });
    }

    if (rider) {
      if (rider.banned) {
        throw new UnauthorizedException('هذا الحساب محظور.');
      }
      // اربط googleId/الإيميل إن كانا ناقصين على الحساب
      const patch: {
        lastLoginAt: Date;
        googleId?: string;
        email?: string;
      } = { lastLoginAt: new Date() };
      if (p.googleId && !rider.googleId) patch.googleId = p.googleId;
      if (p.email && !rider.email) patch.email = p.email;
      await this.riderRepo.update(rider.id, patch);
      Object.assign(rider, patch);

      return {
        success: true,
        needsPhone: false,
        accessToken: await this.issueSession(rider, { platform: 'web' }),
        rider: this.toRiderType(rider),
        isNewUser: false,
      };
    }

    // لا حساب بعد — يحتاج ربط هاتف
    return {
      success: true,
      needsPhone: true,
      isNewUser: true,
      pendingToken: this.signPendingToken(p),
      message: 'أضف رقم هاتفك لإكمال إنشاء الحساب.',
    };
  }

  /** يربط هوية مُتحقَّقة بحساب هاتف موجود/جديد (يحترم القيود الفريدة) */
  private async applyPendingIdentity(
    rider: RiderEntity,
    p: PendingIdentity,
  ): Promise<void> {
    const patch: { email?: string; googleId?: string; firstName?: string } = {};
    if (p.email && !rider.email) patch.email = p.email;
    if (p.googleId && !rider.googleId) patch.googleId = p.googleId;
    if (p.name && !rider.firstName) patch.firstName = p.name.split(' ')[0];
    if (Object.keys(patch).length === 0) return;
    try {
      await this.riderRepo.update(rider.id, patch);
      Object.assign(rider, patch);
    } catch (e) {
      // قيد فريد (الإيميل/googleId مرتبط بحساب آخر) — لا نكسر الدخول بالهاتف
      this.logger.warn(
        `Could not link identity to rider #${rider.id}: ${(e as Error).message}`,
      );
    }
  }

  /** يوقّع رمز ربط قصير الأجل (15 دقيقة) يحمل الهوية المُتحقَّقة */
  private signPendingToken(p: PendingIdentity): string {
    return this.jwtService.sign(
      { scope: 'link-phone', ...p },
      { expiresIn: '15m' },
    );
  }

  /** يتحقق من رمز الربط ويعيد الهوية (أو null إن لم يكن صالحاً) */
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
        referralCode: payload.referralCode,
      };
    } catch {
      return null;
    }
  }

  /** يتحقق من Google ID token محلياً (التوقيع + الجمهور). null إن لم يُهيّأ/فشل */
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

  // =============================================
  // logout — إبطال كل توكنات الراكب الصادرة حتى الآن
  // =============================================
  async logout(riderId: number): Promise<boolean> {
    // طابع زمني (ms): JwtStrategy يرفض أي توكن iat أقدم منه.
    // TTL = أقصى عمر توكن (7 أيام) — بعدها التوكنات منتهية أصلاً.
    await this.redis.setex(revokedKey(riderId), 7 * 24 * 3600, Date.now().toString());
    return true;
  }

  // =============================================
  // Helpers
  // =============================================

  private signToken(rider: RiderEntity, jti?: string): string {
    const payload: JwtPayload = {
      sub: rider.id,
      phone: rider.phoneNumber,
      type: 'rider',
      jti,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * يُصدر جلسة جديدة: يولّد jti، يسجّل الجهاز، ويعيد توكناً يحمل الـjti.
   * يُستخدم في كل مسارات الدخول (هاتف/إيميل/Google) لتتبّع الأجهزة.
   */
  private async issueSession(
    rider: RiderEntity,
    meta?: { deviceName?: string; platform?: string },
  ): Promise<string> {
    const jti = randomUUID();
    try {
      await this.deviceRepo.save(
        this.deviceRepo.create({
          jti,
          riderId: rider.id,
          deviceName: meta?.deviceName?.slice(0, 120),
          platform: meta?.platform?.slice(0, 16),
          revoked: false,
          lastActiveAt: new Date(),
        }),
      );
    } catch (e) {
      // تسجيل الجهاز ليس حاجباً للدخول — سجّل وتابع.
      this.logger.warn(`device record failed for rider ${rider.id}: ${e}`);
    }
    return this.signToken(rider, jti);
  }

  // =============================================
  // التحقق بخطوتين (TOTP) — رمز مؤقّت بين الخطوتين
  // =============================================
  /** يوقّع رمزاً مؤقّتاً (5 دقائق) يثبت اجتياز عامل الهاتف، بانتظار TOTP */
  private signTwoFactorPending(riderId: number): string {
    return this.jwtService.sign(
      { sub: riderId, type: 'rider', twofa: true } as Record<string, unknown>,
      { expiresIn: '5m' },
    );
  }

  private verifyTwoFactorPending(token: string): number {
    try {
      const p = this.jwtService.verify<{ sub: number; twofa?: boolean }>(token);
      if (!p?.twofa || !p.sub) throw new Error('not a 2fa token');
      return p.sub;
    } catch {
      throw new UnauthorizedException('انتهت صلاحية جلسة التحقق. أعد الدخول.');
    }
  }

  private hashRecovery(code: string): string {
    return createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
  }

  /** يبدأ إعداد 2FA: يولّد سرّاً (غير مفعّل بعد) ويعيد otpauth URI لعرض QR */
  async startTwoFactorSetup(
    riderId: number,
  ): Promise<{ secret: string; otpauthUri: string }> {
    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    if (!rider) throw new UnauthorizedException('Account not found');
    const secret = generateTotpSecret();
    await this.riderRepo.update(riderId, { twoFactorSecret: secret });
    const account = rider.email || rider.phoneNumber;
    return { secret, otpauthUri: buildOtpAuthUri(secret, account) };
  }

  /** يفعّل 2FA بعد التحقق من رمز من المُصادِق، ويعيد أكواد استرداد لمرّة واحدة */
  async enableTwoFactor(riderId: number, code: string): Promise<string[]> {
    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    if (!rider?.twoFactorSecret) {
      throw new UnauthorizedException('ابدأ الإعداد أولاً.');
    }
    if (!verifyTotp(rider.twoFactorSecret, code)) {
      throw new UnauthorizedException('رمز غير صحيح.');
    }
    // أكواد استرداد (10) — تُعرض مرّة واحدة وتُخزَّن مُجزّأة
    const plain = Array.from({ length: 10 }, () =>
      randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase(),
    );
    await this.riderRepo.update(riderId, {
      twoFactorEnabled: true,
      twoFactorRecovery: plain.map((c) => this.hashRecovery(c)),
    });
    return plain;
  }

  /** يعطّل 2FA بعد التحقق من رمز حالي */
  async disableTwoFactor(riderId: number, code: string): Promise<boolean> {
    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    if (!rider?.twoFactorEnabled || !rider.twoFactorSecret) return true;
    if (!verifyTotp(rider.twoFactorSecret, code)) {
      throw new UnauthorizedException('رمز غير صحيح.');
    }
    await this.riderRepo.update(riderId, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorRecovery: undefined,
    });
    return true;
  }

  /** يُكمل الدخول بعد التحقق بخطوتين (TOTP أو كود استرداد) */
  async verifyTwoFactor(
    pendingToken: string,
    code: string,
    meta?: { deviceName?: string; platform?: string },
  ): Promise<AuthPayload> {
    const riderId = this.verifyTwoFactorPending(pendingToken);
    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    if (!rider?.twoFactorEnabled || !rider.twoFactorSecret) {
      throw new UnauthorizedException('التحقق بخطوتين غير مفعّل.');
    }
    let ok = verifyTotp(rider.twoFactorSecret, code);
    if (!ok && rider.twoFactorRecovery?.length) {
      // محاولة ككود استرداد (يُستهلك عند النجاح)
      const h = this.hashRecovery(code);
      if (rider.twoFactorRecovery.includes(h)) {
        ok = true;
        await this.riderRepo.update(riderId, {
          twoFactorRecovery: rider.twoFactorRecovery.filter((x) => x !== h),
        });
      }
    }
    if (!ok) throw new UnauthorizedException('رمز غير صحيح.');
    const accessToken = await this.issueSession(rider, meta);
    return {
      accessToken,
      rider: this.toRiderType(rider),
      isNewUser: false,
      twoFactorRequired: false,
    };
  }

  // =============================================
  // الأجهزة/الجلسات
  // =============================================
  async listDevices(riderId: number, currentJti?: string) {
    const rows = await this.deviceRepo.find({
      where: { riderId, revoked: false },
      order: { lastActiveAt: 'DESC', createdAt: 'DESC' },
      take: 50,
    });
    return rows.map((d) => ({
      id: d.id,
      deviceName: d.deviceName ?? undefined,
      platform: d.platform ?? undefined,
      lastActiveAt: d.lastActiveAt ?? d.createdAt,
      current: !!currentJti && d.jti === currentJti,
      createdAt: d.createdAt,
    }));
  }

  /** يُبطل جهازاً بعينه (يضيف jti لقائمة الإبطال في Redis) */
  async revokeDevice(riderId: number, deviceId: number): Promise<boolean> {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId, riderId },
    });
    if (!device) return false;
    await this.redis.setex(revokedJtiKey(device.jti), 7 * 24 * 3600, '1');
    await this.deviceRepo.update(device.id, { revoked: true });
    return true;
  }

  /** يولّد كود إحالة فريداً من 6 محارف (أحرف كبيرة + أرقام) */
  private async generateReferralCode(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بلا أحرف ملتبسة
    for (let attempt = 0; attempt < 8; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      const exists = await this.riderRepo.findOne({
        where: { referralCode: code },
        select: ['id'],
      });
      if (!exists) return code;
    }
    // احتياط: استخدم الطابع الزمني لضمان التفرّد
    return `R${Date.now().toString(36).toUpperCase().slice(-7)}`;
  }

  private extractCountryCode(phone: string): string {
    if (phone.startsWith('+974')) return '+974'; // Qatar
    if (phone.startsWith('+971')) return '+971'; // UAE
    if (phone.startsWith('+966')) return '+966'; // Saudi Arabia
    if (phone.startsWith('+965')) return '+965'; // Kuwait
    if (phone.startsWith('+973')) return '+973'; // Bahrain
    if (phone.startsWith('+968')) return '+968'; // Oman
    return phone.substring(0, 4);
  }

  private getDefaultCurrency(countryCode: string): string {
    const map: Record<string, string> = {
      '+974': 'QAR',
      '+971': 'AED',
      '+966': 'SAR',
      '+965': 'KWD',
      '+973': 'BHD',
      '+968': 'OMR',
    };
    return map[countryCode] ?? 'QAR';
  }
}
