import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth-payload.type';
import { DriverType } from '../driver/dto/driver.type';
import { DriverEntity } from '@hancr/database';

@ObjectType()
class SendOtpResponse {
  @Field() success!: boolean;
  @Field() message!: string;
  @Field({ nullable: true }) devOtp?: string;
}

@ObjectType()
class AuthResult {
  @Field() success!: boolean;
  @Field() needsPhone!: boolean;
  @Field({ nullable: true }) pendingToken?: string;
  @Field({ nullable: true }) accessToken?: string;
  @Field(() => DriverType, { nullable: true }) driver?: DriverType;
  @Field({ nullable: true }) isNewDriver?: boolean;
  @Field({ nullable: true }) message?: string;
}

function toDriverType(d: DriverEntity): DriverType {
  return {
    id: d.id,
    phoneNumber: d.phoneNumber,
    countryCode: d.countryCode,
    firstName: d.firstName,
    lastName: d.lastName,
    avatarUrl: d.avatarUrl,
    status: d.status,
    active: d.active,
    banned: d.banned,
    rating: Number(d.rating),
    ratingCount: d.ratingCount,
    carBrand: d.carBrand,
    carModel: d.carModel,
    carColor: d.carColor,
    plateNumber: d.plateNumber,
    carYear: d.carYear,
    carPhotoUrl: d.carPhotoUrl,
    balance: Number(d.balance),
    currency: d.currency,
    fcmToken: d.fcmToken,
    regionId: d.regionId,
    createdAt: d.createdAt,
    gender: d.gender,
    kidsApproved: d.kidsApproved ?? false,
    nightApproved: d.nightApproved ?? false,
    approvalStatus: d.approvalStatus ?? 'pending_docs',
    rejectionReason: d.rejectionReason,
  };
}

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => SendOtpResponse, { description: 'ارسال OTP للسائق' })
  @Throttle({ strict: { limit: 3, ttl: 60000 } })
  async driverSendOtp(
    @Args('phone') phone: string,
  ): Promise<SendOtpResponse> {
    return this.authService.sendOtp(phone);
  }

  @Mutation(() => AuthPayload, { description: 'تحقق من OTP + JWT للسائق' })
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  async driverVerifyOtp(
    @Args('phone') phone: string,
    @Args('code') code: string,
    @Args('pendingToken', { nullable: true }) pendingToken?: string,
  ): Promise<AuthPayload> {
    const result = await this.authService.verifyOtp(phone, code, pendingToken);
    return {
      accessToken: result.accessToken,
      driver: toDriverType(result.driver),
      isNewDriver: result.isNewDriver,
    };
  }

  // ─── الدخول بالإيميل (OTP) ───
  @Mutation(() => SendOtpResponse, { description: 'ارسال OTP لبريد السائق' })
  @Throttle({ strict: { limit: 3, ttl: 60000 } })
  async driverSendEmailOtp(
    @Args('email') email: string,
  ): Promise<SendOtpResponse> {
    return this.authService.sendEmailOtp(email);
  }

  @Mutation(() => AuthResult, {
    description: 'تحقق من OTP البريد — دخول كامل أو ربط هاتف',
  })
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  async driverVerifyEmailOtp(
    @Args('email') email: string,
    @Args('code') code: string,
  ): Promise<AuthResult> {
    const r = await this.authService.verifyEmailOtp(email, code);
    return this.toAuthResult(r);
  }

  // ─── الدخول بحساب Google ───
  @Mutation(() => AuthResult, { description: 'دخول السائق عبر Google ID token' })
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  async driverGoogleAuth(
    @Args('idToken') idToken: string,
  ): Promise<AuthResult> {
    const r = await this.authService.googleAuth(idToken);
    return this.toAuthResult(r);
  }

  private toAuthResult(r: {
    success: boolean;
    needsPhone: boolean;
    pendingToken?: string;
    accessToken?: string;
    driver?: DriverEntity;
    isNewDriver?: boolean;
    message?: string;
  }): AuthResult {
    return {
      success: r.success,
      needsPhone: r.needsPhone,
      pendingToken: r.pendingToken,
      accessToken: r.accessToken,
      driver: r.driver ? toDriverType(r.driver) : undefined,
      isNewDriver: r.isNewDriver,
      message: r.message,
    };
  }
}
