import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import {
  BidEntity,
  BidOfferEntity,
  BidStatus,
  DriverEntity,
  OrderEntity,
  OrderStatus,
  OrderType,
  PaymentMode,
  RiderEntity,
} from '@hancr/database';
import { BidRedisService } from '@hancr/redis';
import { PUB_SUB } from '../pubsub.provider';
import { CreateBidInput } from './dto/create-bid.input';
import { BidType, BidOfferType } from './dto/bid.type';

export const BID_OFFER_RECEIVED = 'BID_OFFER_RECEIVED';
export const BID_EXPIRED = 'BID_EXPIRED';

@Injectable()
export class BidService {
  private readonly logger = new Logger(BidService.name);

  constructor(
    @InjectRepository(BidEntity)
    private readonly bidRepo: Repository<BidEntity>,

    @InjectRepository(BidOfferEntity)
    private readonly offerRepo: Repository<BidOfferEntity>,

    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,

    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,

    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,

    private readonly bidRedis: BidRedisService,

    @Inject(PUB_SUB)
    private readonly pubSub: RedisPubSub,
  ) {}

  // =============================================
  // createBid — فتح مزايدة جديدة
  // =============================================
  async createBid(riderId: number, input: CreateBidInput): Promise<BidType> {
    const origin = input.points[0];
    const expiresAt = new Date(Date.now() + 90_000); // 90 ثانية

    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    const currency = rider?.currency ?? 'SAR';

    const bid = this.bidRepo.create({
      riderId,
      serviceId: input.serviceId,
      regionId: input.regionId,
      status: BidStatus.Open,
      riderProposedPrice: input.proposedPrice,
      currency,
      expiresAt,
      points: input.points.map((p) => ({ lat: p.lat, lng: p.lng })),
      addresses: input.addresses,
    });

    const savedBid = await this.bidRepo.save(bid);

    // إضافة المزايدة إلى Redis (TTL 30 ثانية)
    await this.bidRedis.createBid({
      bidId: savedBid.id,
      riderId,
      serviceId: input.serviceId,
      regionId: input.regionId,
      lat: origin.lat,
      lng: origin.lng,
      proposedPrice: input.proposedPrice,
      currency,
    });

    this.logger.log(
      `Bid #${savedBid.id} created for rider #${riderId} at price ${input.proposedPrice}`,
    );

    return this.toType(savedBid, []);
  }

  // =============================================
  // getActiveBid — المزايدة النشطة مع العروض
  // =============================================
  async getActiveBid(riderId: number): Promise<BidType | null> {
    const bid = await this.bidRepo.findOne({
      where: { riderId, status: BidStatus.Open },
      relations: ['offers'],
    });

    if (!bid) return null;

    const offers = await this.loadOffersWithDrivers(bid.offers ?? []);
    return this.toType(bid, offers);
  }

  // =============================================
  // acceptOffer — الراكب يقبل عرض سائق
  // =============================================
  async acceptOffer(riderId: number, offerId: number): Promise<BidType> {
    const offer = await this.offerRepo.findOne({
      where: { id: offerId },
      relations: ['bid'],
    });

    if (!offer) throw new NotFoundException('Offer not found');
    if (!offer.bid) throw new NotFoundException('Bid not found');
    if (offer.bid.riderId !== riderId) {
      throw new ForbiddenException('Access denied');
    }
    if (offer.bid.status !== BidStatus.Open) {
      throw new BadRequestException('Bid is no longer open');
    }
    if (offer.bid.expiresAt < new Date()) {
      throw new BadRequestException('Bid has expired');
    }

    // قبول العرض
    await this.offerRepo.update(offerId, { accepted: true });
    await this.bidRepo.update(offer.bid.id, {
      status: BidStatus.Accepted,
      acceptedOfferId: offer.id,
    });

    // إزالة المزايدة من Redis
    await this.bidRedis.removeBid(offer.bid.id);

    // إنشاء طلب رحلة فعلي بالسعر المتّفق عليه — مُسنَد للسائق مباشرةً
    const bid = offer.bid;
    const price = Number(offer.offeredPrice);
    const order = this.orderRepo.create({
      riderId,
      driverId: offer.driverId,
      serviceId: bid.serviceId,
      regionId: bid.regionId,
      type: OrderType.Ride,
      status: OrderStatus.DriverAccepted,
      points: bid.points ?? [],
      addresses: bid.addresses ?? [],
      distanceBest: bid.estimatedDistance,
      durationBest: bid.estimatedDuration,
      costBest: price,
      costAfterCoupon: price,
      currency: bid.currency,
      paymentMode: PaymentMode.Cash,
      isBidOrder: true,
    });
    await this.orderRepo.save(order);

    this.logger.log(
      `Bid #${offer.bid.id} accepted — driver #${offer.driverId}, price ${offer.offeredPrice} → order #${order.id}`,
    );

    const updatedBid = await this.bidRepo.findOne({
      where: { id: offer.bid.id },
      relations: ['offers'],
    });

    if (!updatedBid) throw new NotFoundException('Bid not found after update');

    const offers = await this.loadOffersWithDrivers(updatedBid.offers ?? []);
    return this.toType(updatedBid, offers);
  }

  // =============================================
  // Cron: تنظيف المزايدات المنتهية كل 30 ثانية
  // =============================================
  @Cron('*/30 * * * * *')
  async cleanupExpiredBids(): Promise<void> {
    const expired = await this.bidRepo.find({
      where: { status: BidStatus.Open },
    });

    const now = new Date();
    const expiredIds = expired
      .filter((b) => b.expiresAt < now)
      .map((b) => b.id);

    if (expiredIds.length === 0) return;

    await this.bidRepo.update(expiredIds, { status: BidStatus.Expired });
    await this.bidRedis.cleanupExpiredBids();

    this.logger.log(`Cleaned up ${expiredIds.length} expired bids`);

    // إشعار الراكبين بانتهاء مزايداتهم
    for (const id of expiredIds) {
      await this.pubSub.publish(BID_EXPIRED, { bidExpired: { id } });
    }
  }

  // =============================================
  // Helpers
  // =============================================

  private async loadOffersWithDrivers(
    offers: BidOfferEntity[],
  ): Promise<BidOfferType[]> {
    const result: BidOfferType[] = [];
    for (const offer of offers) {
      const driver = await this.driverRepo.findOne({
        where: { id: offer.driverId },
      });
      result.push({
        id: offer.id,
        driverId: offer.driverId,
        driverName: driver
          ? `${driver.firstName} ${driver.lastName}`
          : undefined,
        driverAvatarUrl: driver?.avatarUrl,
        driverRating: driver ? Number(driver.rating) : 0,
        carBrand: driver?.carBrand,
        carModel: driver?.carModel,
        carColor: driver?.carColor,
        plateNumber: driver?.plateNumber,
        offeredPrice: Number(offer.offeredPrice),
        currency: 'QAR',
        status: offer.accepted ? BidStatus.Accepted : 'Pending',
        createdAt: offer.createdAt,
      });
    }
    return result;
  }

  private toType(bid: BidEntity, offers: BidOfferType[]): BidType {
    return {
      id: bid.id,
      status: bid.status,
      riderProposedPrice: Number(bid.riderProposedPrice),
      currency: 'QAR',
      expiresAt: bid.expiresAt,
      offers,
      createdAt: bid.createdAt,
    };
  }
}
