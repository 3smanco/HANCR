import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommuterService } from './commuter.service';
import {
  CommuterSubscriptionInput,
  CommuterSubscriptionType,
  CommuterUpdateInput,
} from './dto/commuter.types';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => CommuterSubscriptionType)
export class CommuterResolver {
  constructor(private readonly service: CommuterService) {}

  @Query(() => [CommuterSubscriptionType], {
    description: 'اشتراكات التنقّل (Commuter) للراكب',
  })
  @UseGuards(JwtAuthGuard)
  commuterSubscriptions(
    @CurrentUser() user: AuthUser,
  ): Promise<CommuterSubscriptionType[]> {
    return this.service.list(user.riderId);
  }

  @Mutation(() => CommuterSubscriptionType, {
    description: 'إنشاء اشتراك Commuter',
  })
  @UseGuards(JwtAuthGuard)
  createCommuterSubscription(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CommuterSubscriptionInput,
  ): Promise<CommuterSubscriptionType> {
    return this.service.create(user.riderId, input);
  }

  @Mutation(() => CommuterSubscriptionType, {
    description: 'تعديل اشتراك (إيقاف/تفعيل، أيام، أوقات)',
  })
  @UseGuards(JwtAuthGuard)
  updateCommuterSubscription(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: CommuterUpdateInput,
  ): Promise<CommuterSubscriptionType> {
    return this.service.update(user.riderId, id, input);
  }

  @Mutation(() => Boolean, { description: 'حذف اشتراك Commuter' })
  @UseGuards(JwtAuthGuard)
  deleteCommuterSubscription(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.remove(user.riderId, id);
  }
}
