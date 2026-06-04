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
  ): Promise<AuthPayload> {
    const result = await this.authService.verifyOtp(phone, code);
    return {
      accessToken: result.accessToken,
      driver: toDriverType(result.driver),
      isNewDriver: result.isNewDriver,
    };
  }
}
