import { Resolver, Mutation, Query, Args, Float, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
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

@ObjectType()
class AvailableBidType {
  @Field(() => Int) id!: number;
  @Field(() => Float) riderProposedPrice!: number;
  @Field() currency!: string;
  @Field({ nullable: true }) originAddress?: string;
  @Field({ nullable: true }) destinationAddress?: string;
  @Field(() => Int) estimatedDistance!: number;
  @Field(() => Int) serviceId!: number;
  @Field(() => Int) regionId!: number;
  @Field() expiresAt!: Date;
  @Field() alreadyOffered!: boolean;
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
   * المزايدات المفتوحة المتاحة للسائق (للعرض عليها)
   */
  @Query(() => [AvailableBidType], { description: 'المزايدات المفتوحة المتاحة' })
  @UseGuards(JwtAuthGuard)
  async availableBids(
    @CurrentDriver() driver: AuthDriver,
  ): Promise<AvailableBidType[]> {
    const bids = await this.bidRepo.find({
      where: { status: BidStatus.Open, expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    if (bids.length === 0) return [];

    // عروض السائق السابقة لتمييز المزايدات التي عرض عليها
    const myOffers = await this.offerRepo.find({
      where: { driverId: driver.driverId },
    });
    const offeredBidIds = new Set(myOffers.map((o) => o.bidId));

    return bids.map((b) => ({
      id: b.id,
      riderProposedPrice: Number(b.riderProposedPrice),
      currency: b.currency,
      originAddress: b.addresses?.[0],
      destinationAddress: b.addresses?.[b.addresses.length - 1],
      estimatedDistance: b.estimatedDistance,
      serviceId: b.serviceId,
      regionId: b.regionId,
      expiresAt: b.expiresAt,
      alreadyOffered: offeredBidIds.has(b.id),
    }));
  }

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

    // حدود سعر العرض — يُقصّ ضمن نطاق معقول حول سعر الراكب المقترح.
    // كان السعر موثوقاً بلا حدّ (سائق يعرض 9999 يصبح الأجرة الملزمة).
    // النِّسَب قابلة للتعديل حسب سياسة العمل.
    const BID_MIN_FACTOR = 0.5; // لا يقل عن 50% من سعر الراكب
    const BID_MAX_FACTOR = 3.0; // لا يزيد عن 300% من سعر الراكب
    const proposed = Number(bid.riderProposedPrice);
    if (!Number.isFinite(offeredPrice) || offeredPrice <= 0) {
      throw new BadRequestException('سعر العرض غير صالح');
    }
    if (proposed > 0) {
      const floor = Math.max(1, Math.round(proposed * BID_MIN_FACTOR * 100) / 100);
      const cap = Math.round(proposed * BID_MAX_FACTOR * 100) / 100;
      if (offeredPrice < floor || offeredPrice > cap) {
        throw new BadRequestException(
          `سعر العرض يجب أن يكون بين ${floor} و ${cap}`,
        );
      }
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
