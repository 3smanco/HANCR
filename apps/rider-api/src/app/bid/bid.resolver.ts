import {
  Resolver,
  Mutation,
  Query,
  Args,
  Subscription,
  Int,
} from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { BidService, BID_OFFER_RECEIVED } from './bid.service';
import { BidType } from './dto/bid.type';
import { CreateBidInput } from './dto/create-bid.input';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';

@Resolver(() => BidType)
export class BidResolver {
  constructor(
    private readonly bidService: BidService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  /**
   * فتح مزايدة جديدة — الراكب يحدد السعر المقترح
   * المزايدة مفتوحة لمدة 30 ثانية فقط
   */
  @Mutation(() => BidType, { description: 'فتح مزايدة جديدة (Bid Mode)' })
  @UseGuards(JwtAuthGuard)
  createBid(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CreateBidInput,
  ): Promise<BidType> {
    return this.bidService.createBid(user.riderId, input);
  }

  /**
   * المزايدة النشطة الحالية مع العروض الواردة
   */
  @Query(() => BidType, {
    nullable: true,
    description: 'المزايدة النشطة الحالية',
  })
  @UseGuards(JwtAuthGuard)
  activeBid(@CurrentUser() user: AuthUser): Promise<BidType | null> {
    return this.bidService.getActiveBid(user.riderId);
  }

  /**
   * قبول عرض سائق
   */
  @Mutation(() => BidType, { description: 'قبول عرض سائق في Bid Mode' })
  @UseGuards(JwtAuthGuard)
  acceptBidOffer(
    @CurrentUser() user: AuthUser,
    @Args('offerId', { type: () => Int }) offerId: number,
  ): Promise<BidType> {
    return this.bidService.acceptOffer(user.riderId, offerId);
  }

  /**
   * Subscription — عروض السائقين الواردة خلال فترة المزايدة
   */
  @Subscription(() => BidType, {
    description: 'عروض السائقين الفورية خلال Bid Mode',
    filter(
      payload: { bidOfferReceived: BidType },
      _variables: unknown,
      context: { req: { user: AuthUser } },
    ) {
      // فلترة بحسب الراكب
      return true; // يمكن تفعيل الفلتر بعد ربط riderId بالـ payload
    },
  })
  @UseGuards(JwtAuthGuard)
  bidOfferReceived(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(BID_OFFER_RECEIVED);
  }
}
