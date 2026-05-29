import { Resolver, Mutation, Args, Float, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BidOfferEntity, BidEntity, BidStatus } from '@hancr/database';
import { BidRedisService } from '@hancr/redis';
import { ObjectType, Field } from '@nestjs/graphql';
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';
import { Logger, BadRequestException, NotFoundException } from '@nestjs/common';

@ObjectType()
class BidOfferResult {
  @Field() success!: boolean;
  @Field(() => Int) offerId!: number;
  @Field(() => Float) offeredPrice!: number;
  @Field() message!: string;
}

@Resolver()
export class BidResolver {
  private readonly logger = new Logger(BidResolver.name);

  constructor(
    @InjectRepository(BidOfferEntity)
    private readonly offerRepo: Repository<BidOfferEntity>,

    @InjectRepository(BidEntity)
    private readonly bidRepo: Repository<BidEntity>,

    private readonly bidRedis: BidRedisService,
  ) {}

  /**
   * السائق يقدّم عرضاً على مزايدة
   * يمكنه قبول سعر الراكب أو تقديم سعر مختلف
   *
   * mutation {
   *   submitBidOffer(bidId: 1, offeredPrice: 15.5) {
   *     success offerId offeredPrice message
   *   }
   * }
   */
  @Mutation(() => BidOfferResult, { description: 'تقديم عرض سعر في Bid Mode' })
  @UseGuards(JwtAuthGuard)
  async submitBidOffer(
    @CurrentDriver() driver: AuthDriver,
    @Args('bidId', { type: () => Int }) bidId: number,
    @Args('offeredPrice', { type: () => Float }) offeredPrice: number,
  ): Promise<BidOfferResult> {
    // التحقق من وجود المزايدة وأنها لا تزال مفتوحة
    const bid = await this.bidRepo.findOne({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.status !== BidStatus.Open) {
      throw new BadRequestException('Bid is no longer open');
    }
    if (bid.expiresAt < new Date()) {
      throw new BadRequestException('Bid has expired');
    }

    // التحقق من عدم تقديم عرض سابق
    const existing = await this.offerRepo.findOne({
      where: { bidId, driverId: driver.driverId },
    });
    if (existing) {
      throw new BadRequestException('You already submitted an offer for this bid');
    }

    // إنشاء العرض
    const offer = await this.offerRepo.save(
      this.offerRepo.create({
        bidId,
        driverId: driver.driverId,
        offeredPrice,
        accepted: false,
      }),
    );

    this.logger.log(
      `Driver #${driver.driverId} offered ${offeredPrice} on bid #${bidId}`,
    );

    return {
      success: true,
      offerId: offer.id,
      offeredPrice,
      message: `Your offer of ${offeredPrice} has been submitted`,
    };
  }
}
