import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard, CurrentUser } from './jwt-auth.guard';
import { AuthUser } from './jwt.strategy';
import { SendOtpInput } from './dto/send-otp.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { SendOtpResponse } from './dto/send-otp-response.type';
import { AuthPayload } from './dto/auth-payload.type';
import { AuthResult } from './dto/auth-result.type';
import { SendEmailOtpInput } from './dto/send-email-otp.input';
import { VerifyEmailOtpInput } from './dto/verify-email-otp.input';
import { GoogleAuthInput } from './dto/google-auth.input';
import { DeviceType } from './dto/device.type';
import {
  TwoFactorSetupType,
  TwoFactorRecoveryType,
} from './dto/two-factor.type';

/**
 * Rate limits منفصلة:
 *  - sendOtp:   3/60s  → يمنع spam الرسائل (كل SMS يكلِّف)
 *  - verifyOtp: 10/60s → يمنع brute-force على الكود (4-6 خانات)
 */
@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * الخطوة 1: طلب رمز OTP
   *
   * mutation {
   *   sendOtp(input: { phone: "+97412345678" }) {
   *     success
   *     message
   *     devOtp   # في التطوير فقط
   *   }
   * }
   */
  @Mutation(() => SendOtpResponse, {
    description: 'ارسال رمز OTP لرقم الهاتف للتحقق',
  })
  @Throttle({ strict: { limit: 3, ttl: 60000 } })
  sendOtp(@Args('input') input: SendOtpInput): Promise<SendOtpResponse> {
    return this.authService.sendOtp(input);
  }

  /**
   * الخطوة 2: التحقق من OTP والحصول على JWT
   *
   * mutation {
   *   verifyOtp(input: { phone: "+97412345678", code: "1234" }) {
   *     accessToken
   *     isNewUser
   *     rider { id phoneNumber firstName }
   *   }
   * }
   */
  @Mutation(() => AuthPayload, {
    description: 'التحقق من OTP واستلام Access Token',
  })
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  verifyOtp(@Args('input') input: VerifyOtpInput): Promise<AuthPayload> {
    return this.authService.verifyOtp(input);
  }

  // ─── الدخول بالإيميل (OTP) ───
  @Mutation(() => SendOtpResponse, {
    description: 'إرسال رمز OTP إلى البريد الإلكتروني',
  })
  @Throttle({ strict: { limit: 3, ttl: 60000 } })
  sendEmailOtp(
    @Args('input') input: SendEmailOtpInput,
  ): Promise<SendOtpResponse> {
    return this.authService.sendEmailOtp(input);
  }

  @Mutation(() => AuthResult, {
    description:
      'التحقق من OTP البريد — دخول كامل أو رمز ربط هاتف (needsPhone)',
  })
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  verifyEmailOtp(
    @Args('input') input: VerifyEmailOtpInput,
  ): Promise<AuthResult> {
    return this.authService.verifyEmailOtp(input);
  }

  // ─── الدخول بحساب Google ───
  @Mutation(() => AuthResult, {
    description:
      'الدخول عبر Google ID token — دخول كامل أو رمز ربط هاتف (needsPhone)',
  })
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  googleAuth(@Args('input') input: GoogleAuthInput): Promise<AuthResult> {
    return this.authService.googleAuth(input);
  }

  // ─── تسجيل الخروج — يُبطل كل التوكنات الحالية (إبطال جلسة الويب) ───
  @Mutation(() => Boolean, {
    description: 'إبطال جلسة الراكب (كل التوكنات الصادرة حتى الآن)',
  })
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: AuthUser): Promise<boolean> {
    return this.authService.logout(user.riderId);
  }

  // ═══════════════════════════════════════════════
  // التحقق بخطوتين (2FA / TOTP)
  // ═══════════════════════════════════════════════
  @Mutation(() => AuthPayload, {
    description: 'إكمال الدخول بعد التحقق بخطوتين (TOTP أو كود استرداد)',
  })
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  verifyTwoFactor(
    @Args('pendingToken') pendingToken: string,
    @Args('code') code: string,
    @Args('deviceName', { nullable: true }) deviceName?: string,
    @Args('platform', { nullable: true }) platform?: string,
  ): Promise<AuthPayload> {
    return this.authService.verifyTwoFactor(pendingToken, code, {
      deviceName,
      platform,
    });
  }

  @Mutation(() => TwoFactorSetupType, {
    description: 'بدء إعداد 2FA — يعيد السرّ وotpauth URI',
  })
  @UseGuards(JwtAuthGuard)
  startTwoFactorSetup(
    @CurrentUser() user: AuthUser,
  ): Promise<TwoFactorSetupType> {
    return this.authService.startTwoFactorSetup(user.riderId);
  }

  @Mutation(() => TwoFactorRecoveryType, {
    description: 'تفعيل 2FA بالتحقق من رمز — يعيد أكواد الاسترداد مرّة واحدة',
  })
  @UseGuards(JwtAuthGuard)
  async enableTwoFactor(
    @CurrentUser() user: AuthUser,
    @Args('code') code: string,
  ): Promise<TwoFactorRecoveryType> {
    const recoveryCodes = await this.authService.enableTwoFactor(
      user.riderId,
      code,
    );
    return { recoveryCodes };
  }

  @Mutation(() => Boolean, { description: 'تعطيل 2FA بالتحقق من رمز' })
  @UseGuards(JwtAuthGuard)
  disableTwoFactor(
    @CurrentUser() user: AuthUser,
    @Args('code') code: string,
  ): Promise<boolean> {
    return this.authService.disableTwoFactor(user.riderId, code);
  }

  // ═══════════════════════════════════════════════
  // الأجهزة / الجلسات
  // ═══════════════════════════════════════════════
  @Query(() => [DeviceType], { description: 'أجهزة الراكب النشطة' })
  @UseGuards(JwtAuthGuard)
  myDevices(@CurrentUser() user: AuthUser): Promise<DeviceType[]> {
    return this.authService.listDevices(user.riderId, user.jti);
  }

  @Mutation(() => Boolean, { description: 'إبطال جهاز/جلسة بعينها' })
  @UseGuards(JwtAuthGuard)
  revokeDevice(
    @CurrentUser() user: AuthUser,
    @Args('deviceId', { type: () => Int }) deviceId: number,
  ): Promise<boolean> {
    return this.authService.revokeDevice(user.riderId, deviceId);
  }
}
