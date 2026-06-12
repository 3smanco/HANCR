import { Resolver, Mutation, Args } from '@nestjs/graphql';
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
}
