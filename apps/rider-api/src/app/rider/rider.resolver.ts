import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RiderService } from './rider.service';
import { RiderType } from './dto/rider.type';
import { ReferralType } from './dto/referral.type';
import { UpdateRiderInput } from './dto/update-rider.input';
import { UploadUrlService } from './upload-url.service';
import {
  GenerateRiderUploadUrlInput,
  RiderUploadUrlType,
} from './dto/upload-url.type';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => RiderType)
export class RiderResolver {
  constructor(
    private readonly riderService: RiderService,
    private readonly uploadUrlService: UploadUrlService,
  ) {}

  /**
   * جلب بيانات الراكب الحالي
   * query { me { id phoneNumber firstName balance } }
   */
  @Query(() => RiderType, { description: 'بيانات الراكب المسجّل' })
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): Promise<RiderType> {
    return this.riderService.getMe(user.riderId);
  }

  /** بيانات الإحالة (الكود + عدد المُحالين) */
  @Query(() => ReferralType, { description: 'بيانات إحالة الراكب' })
  @UseGuards(JwtAuthGuard)
  myReferral(@CurrentUser() user: AuthUser): Promise<ReferralType> {
    return this.riderService.getReferral(user.riderId);
  }

  /**
   * تحديث بيانات الملف الشخصي
   */
  @Mutation(() => RiderType, { description: 'تحديث بيانات الراكب' })
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Args('input') input: UpdateRiderInput,
  ): Promise<RiderType> {
    return this.riderService.update(user.riderId, input);
  }

  /**
   * تحديث FCM token (يُستدعى من mobile app عند تسجيل الدخول أو تجديد الـ token)
   * mutation { updateFcmToken(token: "...") }
   */
  @Mutation(() => Boolean, { description: 'تحديث FCM token للإشعارات' })
  @UseGuards(JwtAuthGuard)
  updateFcmToken(
    @CurrentUser() user: AuthUser,
    @Args('token') token: string,
  ): Promise<boolean> {
    return this.riderService.updateFcmToken(user.riderId, token);
  }

  /** حذف FCM token (يُستدعى عند تسجيل الخروج) */
  @Mutation(() => Boolean, { description: 'حذف FCM token عند تسجيل الخروج' })
  @UseGuards(JwtAuthGuard)
  clearFcmToken(@CurrentUser() user: AuthUser): Promise<boolean> {
    return this.riderService.clearFcmToken(user.riderId);
  }

  /**
   * رابط رفع موقّع لصورة الملف الشخصي. بعد الرفع المباشر (PUT) يستدعي العميل
   * updateProfile(avatarUrl: publicUrl) لحفظ الرابط.
   */
  @Mutation(() => RiderUploadUrlType, {
    description: 'رابط رفع موقّع لصورة الملف الشخصي',
  })
  @UseGuards(JwtAuthGuard)
  generateRiderUploadUrl(
    @CurrentUser() user: AuthUser,
    @Args('input') input: GenerateRiderUploadUrlInput,
  ): Promise<RiderUploadUrlType> {
    return this.uploadUrlService.generate(user.riderId, input);
  }
}
