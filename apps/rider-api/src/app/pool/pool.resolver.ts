import { Resolver, Query, Mutation, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PoolType } from './dto/pool.type';
import { PoolService } from './pool.service';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => PoolType)
export class PoolResolver {
  constructor(private readonly poolService: PoolService) {}

  /** المجموعة العائلية/المؤسسية للراكب (مملوكة أو عضوية) */
  @Query(() => PoolType, {
    nullable: true,
    description: 'المجموعة العائلية للراكب',
  })
  @UseGuards(JwtAuthGuard)
  myPool(@CurrentUser() user: AuthUser): Promise<PoolType | null> {
    return this.poolService.getMyPool(user.riderId);
  }

  @Mutation(() => PoolType, { description: 'إنشاء مجموعة عائلية' })
  @UseGuards(JwtAuthGuard)
  createFamily(
    @CurrentUser() user: AuthUser,
    @Args('name') name: string,
  ): Promise<PoolType> {
    return this.poolService.createFamily(user.riderId, name);
  }

  @Mutation(() => PoolType, { description: 'دعوة عضو للعائلة بالهاتف' })
  @UseGuards(JwtAuthGuard)
  inviteFamilyMember(
    @CurrentUser() user: AuthUser,
    @Args('phone') phone: string,
    @Args('monthlySpendLimit', { type: () => Float, nullable: true })
    monthlySpendLimit?: number,
  ): Promise<PoolType> {
    return this.poolService.inviteMember(user.riderId, phone, monthlySpendLimit);
  }

  @Mutation(() => PoolType, { description: 'تعديل حدّ إنفاق عضو' })
  @UseGuards(JwtAuthGuard)
  updateFamilyMemberLimit(
    @CurrentUser() user: AuthUser,
    @Args('memberId', { type: () => Int }) memberId: number,
    @Args('monthlySpendLimit', { type: () => Float, nullable: true })
    monthlySpendLimit?: number,
  ): Promise<PoolType> {
    return this.poolService.updateMemberLimit(
      user.riderId,
      memberId,
      monthlySpendLimit,
    );
  }

  @Mutation(() => PoolType, { description: 'إزالة عضو من العائلة' })
  @UseGuards(JwtAuthGuard)
  removeFamilyMember(
    @CurrentUser() user: AuthUser,
    @Args('memberId', { type: () => Int }) memberId: number,
  ): Promise<PoolType> {
    return this.poolService.removeMember(user.riderId, memberId);
  }

  @Mutation(() => Boolean, { description: 'مغادرة المجموعة العائلية' })
  @UseGuards(JwtAuthGuard)
  leaveFamily(@CurrentUser() user: AuthUser): Promise<boolean> {
    return this.poolService.leaveFamily(user.riderId);
  }

  @Mutation(() => Boolean, { description: 'حذف المجموعة العائلية (المالك)' })
  @UseGuards(JwtAuthGuard)
  deleteFamily(@CurrentUser() user: AuthUser): Promise<boolean> {
    return this.poolService.deleteFamily(user.riderId);
  }
}
