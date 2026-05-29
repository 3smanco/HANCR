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
import { DriverEntity } from '@hancr/database';
import { SmsService } from '@hancr/notifications';
import { JwtPayload } from './jwt.strategy';

const OTP_TTL_SECONDS = 300;
const MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // أرقام تجريبية بـ OTP ثابت = 1234 (للـ demo + Play reviewers)
  private static readonly TEST_DRIVER_PHONES = new Set<string>([
    '+966500000010', // Driver demo
    '+966500000011', // Driver demo 2
  ]);

  async sendOtp(
    phone: string,
  ): Promise<{ success: boolean; message: string; devOtp?: string }> {
    const key = `hancr:otp:driver:${phone}`;
    const isTestPhone = AuthService.TEST_DRIVER_PHONES.has(phone);
    const code = isTestPhone
      ? '1234'
      : Math.floor(1000 + Math.random() * 9000).toString();
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    await this.redis.setex(
      key,
      OTP_TTL_SECONDS,
      JSON.stringify({ code, attempts: 0 }),
    );
    this.logger.log(`Driver OTP for ${phone}: ${code}`);

    const sms = await this.smsService.sendOtp(phone, code, 'ar');
    const exposeDevOtp = isDev || !sms.success || isTestPhone;

    let message: string;
    if (sms.success) {
      message = `OTP sent to ${phone}`;
    } else if (!this.smsService.enabled) {
      message = 'OTP sent (dev mode — Twilio not configured)';
    } else {
      message = `SMS failed (${sms.error}) — using dev OTP`;
    }

    return {
      success: true,
      message,
      devOtp: exposeDevOtp ? code : undefined,
    };
  }

  async verifyOtp(
    phone: string,
    code: string,
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
      this.logger.log(`New driver registered: ${phone} (ID: ${driver.id})`);
    }

    const payload: JwtPayload = { sub: driver.id, phone, type: 'driver' };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, driver, isNewDriver };
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
