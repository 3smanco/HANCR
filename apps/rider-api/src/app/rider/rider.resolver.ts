import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RiderService } from './rider.service';
import { RiderType } from './dto/rider.type';
import { UpdateRiderInput } from './dto/update-rider.input';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => RiderType)
export class RiderResolver {
  constructor(private readonly riderService: RiderService) {}

  /**
   * جلب بيانات الراكب الحالي
   * query { me { id phoneNumber firstName balance } }
   */
  @Query(() => RiderType, { description: 'بيانات الراكب المسجّل' })
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): Promise<RiderType> {
    return this.riderService.getMe(user.riderId);
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
}
