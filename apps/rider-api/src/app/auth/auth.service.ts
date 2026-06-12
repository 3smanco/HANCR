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
import { RiderEntity } from '@hancr/database';
import { SmsService } from '@hancr/notifications';
import { captureException } from '@hancr/observability';
import { SendOtpInput } from './dto/send-otp.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { SendOtpResponse } from './dto/send-otp-response.type';
import { AuthPayload } from './dto/auth-payload.type';
import { JwtPayload } from './jwt.strategy';
import { AppConfigReader } from '../app-config/app-config-reader.service';

// N1 — defaults preserved as fallback; live values come from AppConfigReader.
const DEFAULT_OTP_TTL_SECONDS = 300; // 5 دقائق
const DEFAULT_MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
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
    '+966500000001', // Rider demo
    '+966500000002', // Rider demo 2
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
    // أمن: الأرقام التجريبية (OTP ثابت 123456) مُعطّلة كلياً في الإنتاج —
    // كانت باباً خلفياً للدخول كحسابات demo من الويب. تعمل في dev فقط.
    const isTestPhone = isDev && AuthService.TEST_PHONES.has(phone);

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

    // إيجاد أو إنشاء الراكب
    let rider = await this.riderRepo.findOne({ where: { phoneNumber: phone } });
    const isNewUser = !rider;

    if (!rider) {
      // التقاط المُحيل من كود الإحالة (إن وُجد وصالح ولا يحيل نفسه لاحقاً)
      let referredBy: number | undefined;
      if (input.referralCode && input.referralCode.trim()) {
        const referrer = await this.riderRepo.findOne({
          where: { referralCode: input.referralCode.trim().toUpperCase() },
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

    const accessToken = this.signToken(rider);

    return {
      accessToken,
      rider: {
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
      },
      isNewUser,
    };
  }

  // =============================================
  // Helpers
  // =============================================

  private signToken(rider: RiderEntity): string {
    const payload: JwtPayload = {
      sub: rider.id,
      phone: rider.phoneNumber,
      type: 'rider',
    };
    return this.jwtService.sign(payload);
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
