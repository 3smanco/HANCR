import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CarpoolService } from './carpool.service';
import { CarpoolRequestInput, CarpoolRequestType } from './dto/carpool.types';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => CarpoolRequestType)
export class CarpoolResolver {
  constructor(private readonly service: CarpoolService) {}

  @Query(() => [CarpoolRequestType], { description: 'طلبات Carpool للراكب' })
  @UseGuards(JwtAuthGuard)
  carpoolRequests(
    @CurrentUser() user: AuthUser,
  ): Promise<CarpoolRequestType[]> {
    return this.service.list(user.riderId);
  }

  @Mutation(() => CarpoolRequestType, { description: 'طلب Carpool جديد' })
  @UseGuards(JwtAuthGuard)
  requestCarpool(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CarpoolRequestInput,
  ): Promise<CarpoolRequestType> {
    return this.service.request(user.riderId, input);
  }

  @Mutation(() => Boolean, { description: 'إلغاء طلب Carpool' })
  @UseGuards(JwtAuthGuard)
  cancelCarpoolRequest(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.cancel(user.riderId, id);
  }
}
