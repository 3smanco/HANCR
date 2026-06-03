import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import {
  OrderEntity,
  OrderStatus,
  OrderType,
  PaymentMode,
  RiderEntity,
  ServiceEntity,
  RequestActivityEntity,
  RequestActivityType,
  DriverEntity,
  WalletOwnerType,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@hancr/database';
import { OrderRedisService } from '@hancr/redis';
import { PushNotificationService } from '@hancr/notifications';
import { WalletService } from '@hancr/wallet';
import { PUB_SUB } from '../pubsub.provider';
import { CreateOrderInput } from './dto/create-order.input';
import { RateDriverInput } from './dto/rate-driver.input';
import { OrderType as OrderGqlType } from './dto/order.type';
import { MatchingService } from './matching.service';
import { DirectionsService } from './directions.service';
import { CouponService } from './coupon.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

// GraphQL Subscription events
export const ORDER_UPDATED = 'ORDER_UPDATED';
export const NEW_ORDER_AVAILABLE = 'NEW_ORDER_AVAILABLE';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,

    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,

    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,

    @InjectRepository(RequestActivityEntity)
    private readonly activityRepo: Repository<RequestActivityEntity>,

    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,

    private readonly orderRedis: OrderRedisService,
    private readonly matchingService: MatchingService,
    private readonly directionsService: DirectionsService,
    private readonly couponService: CouponService,
    private readonly loyaltyService: LoyaltyService,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
    private readonly pushNotifications: PushNotificationService,

    @Inject(PUB_SUB)
    private readonly pubSub: RedisPubSub,
  ) {}

  // =============================================
  // createOrder — إنشاء طلب جديد
  // =============================================
  async createOrder(
    riderId: number,
    input: CreateOrderInput,
  ): Promise<OrderGqlType> {
    // التحقق من الراكب
    const rider = await this.riderRepo.findOne({ where: { id: riderId } });
    if (!rider) throw new NotFoundException('Rider not found');
    if (rider.banned) throw new ForbiddenException('Account is banned');

    // التحقق من عدم وجود طلب نشط
    const activeOrder = await this.orderRepo.findOne({
      where: {
        riderId,
        status: OrderStatus.Requested,
      },
    });
    if (activeOrder) {
      throw new BadRequestException('You already have an active order');
    }

    // جلب الخدمة
    const service = await this.serviceRepo.findOne({
      where: { id: input.serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    // حساب مسافة الطريق الفعلية ومدتها عبر Google Directions (مع احتياط haversine)
    const originPoint = input.points[0];
    const destPoint = input.points[input.points.length - 1];
    const waypoints = input.points.slice(1, -1);
    const route = await this.directionsService.getRoute(
      originPoint,
      destPoint,
      waypoints,
    );
    const distanceMeters = route.distanceMeters;
    const durationSeconds = route.durationSeconds;

    // حساب السعر (baseFare + perHundredMeters→perKm + perMinuteDrive)
    let costBest = this.matchingService.estimateFare(
      distanceMeters,
      durationSeconds,
      Number(service.baseFare),
      Number(service.perHundredMeters) * 10,
      Number(service.perMinuteDrive),
    );

    // السائق بالساعة: السعر = hourlyRate × عدد الساعات
    if (input.bookedHours && service.hourlyRate) {
      costBest = Number(service.hourlyRate) * input.bookedHours;
    }

    // تطبيق كوبون الخصم (إن وُجد) — يرمي خطأً واضحاً عند رفض الكود
    let costAfterCoupon = costBest;
    let appliedCouponId: number | undefined;
    let appliedCouponCode: string | undefined;
    let discountAmount = 0;
    if (input.couponCode && input.couponCode.trim().length > 0) {
      const applied = await this.couponService.validate(
        input.couponCode,
        costBest,
        input.regionId,
        riderId,
      );
      costAfterCoupon = applied.costAfterCoupon;
      discountAmount = applied.discountAmount;
      appliedCouponId = applied.coupon.id;
      appliedCouponCode = applied.coupon.code;
    }

    // استخدام Transaction لضمان الاتساق
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // إنشاء الطلب
      const order = queryRunner.manager.create(OrderEntity, {
        riderId,
        serviceId: input.serviceId,
        regionId: input.regionId,
        type: input.receiverPhone
          ? OrderType.ParcelDelivery
          : input.bookedHours
          ? OrderType.HourlyChauffeur
          : input.scheduledAt
          ? OrderType.ScheduledRide
          : OrderType.Ride,
        status: OrderStatus.Requested,
        points: input.points.map((p) => ({ lat: p.lat, lng: p.lng })),
        addresses: input.addresses,
        distanceBest: distanceMeters,
        durationBest: durationSeconds,
        costBest,
        costAfterCoupon,
        couponId: appliedCouponId,
        couponCode: appliedCouponCode,
        discountAmount,
        currency: rider.currency,
        paymentMode: (input.paymentMode as PaymentMode) ?? PaymentMode.Cash,
        // Ride Moods
        quietRide: input.quietRide ?? false,
        requestedTemperature: input.requestedTemperature,
        audioOff: input.audioOff ?? false,
        numberMasked: input.numberMasked ?? false,
        // OTP — لتوصيل الأمانات: نولّد الكود عند الإنشاء ليعرضه الراكب للمستلم،
        // والسائق يُدخله عند التسليم لإثبات الاستلام (confirmDelivery)
        receiverPhone: input.receiverPhone,
        receiverName: input.receiverName,
        ...(input.receiverPhone
          ? { otpCode: Math.floor(1000 + Math.random() * 9000).toString() }
          : {}),
        // Bid
        isBidOrder: input.isBidOrder ?? false,
        // Chauffeur
        bookedHours: input.bookedHours,
        // Scheduled
        expectedTimestamp: input.scheduledAt,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // تسجيل النشاط
      const activity = queryRunner.manager.create(RequestActivityEntity, {
        orderId: savedOrder.id,
        type: RequestActivityType.RequestedByRider,
      });
      await queryRunner.manager.save(activity);

      await queryRunner.commitTransaction();

      // زيادة عدّاد استخدام الكوبون بعد نجاح الإنشاء
      if (appliedCouponId) {
        await this.couponService.incrementUsage(appliedCouponId);
      }

      // حجز مسبق مستقبلي: لا مطابقة الآن — يُفعَّل لاحقاً عبر الكرون (status=Booked)
      if (
        input.scheduledAt &&
        new Date(input.scheduledAt).getTime() > Date.now() + 60_000
      ) {
        await this.orderRepo.update(savedOrder.id, {
          status: OrderStatus.Booked,
        });
        this.logger.log(
          `Order #${savedOrder.id} scheduled for ${input.scheduledAt} (Booked)`,
        );
        return this.toGqlType({
          ...savedOrder,
          status: OrderStatus.Booked,
        } as OrderEntity);
      }

      // إضافة الطلب إلى Redis للمطابقة الفورية
      await this.orderRedis.addOrder({
        orderId: savedOrder.id,
        riderId,
        serviceId: input.serviceId,
        lat: originPoint.lat,
        lng: originPoint.lng,
      });

      // ============================================================
      // Matching Engine — البحث عن السائقين القريبين
      // ============================================================
      const matches = await this.matchingService.findNearbyDrivers(
        originPoint.lat,
        originPoint.lng,
        input.serviceId,
      );

      let finalOrder: OrderEntity;

      if (matches.length > 0) {
        const nearestEtaMinutes = matches[0].etaMinutes;
        const etaPickup = new Date(
          Date.now() + nearestEtaMinutes * 60 * 1000,
        );

        // تحديث حالة الطلب إلى Found وتعيين وقت الوصول المتوقع
        await this.orderRepo.update(savedOrder.id, {
          status: OrderStatus.Found,
          etaPickup,
        });

        finalOrder = {
          ...savedOrder,
          status: OrderStatus.Found,
          etaPickup,
        } as OrderEntity;

        // إشعار السائقين القريبين بوجود طلب جديد (GraphQL Subscription)
        await this.pubSub.publish(NEW_ORDER_AVAILABLE, {
          newOrderAvailable: {
            id: savedOrder.id,
            type: savedOrder.type,
            status: OrderStatus.Found,
            riderId: savedOrder.riderId,
            riderName: rider.firstName
              ? `${rider.firstName} ${rider.lastName ?? ''}`.trim()
              : undefined,
            riderPhone: savedOrder.numberMasked
              ? undefined
              : rider.phoneNumber,
            riderRating: Number(rider.rating),
            points: savedOrder.points ?? [],
            addresses: savedOrder.addresses,
            distanceBest: savedOrder.distanceBest,
            durationBest: savedOrder.durationBest,
            costBest: Number(savedOrder.costBest),
            costAfterCoupon: Number(savedOrder.costAfterCoupon),
            currency: savedOrder.currency,
            paymentMode: savedOrder.paymentMode ?? PaymentMode.Cash,
            quietRide: savedOrder.quietRide,
            requestedTemperature: savedOrder.requestedTemperature,
            audioOff: savedOrder.audioOff,
            numberMasked: savedOrder.numberMasked,
            otpCode: savedOrder.otpCode,
            receiverName: savedOrder.receiverName,
            isBidOrder: savedOrder.isBidOrder,
            etaPickup,
            createdOn: savedOrder.createdOn,
          },
        });

        this.logger.log(
          `Order #${savedOrder.id} → Found — ${matches.length} drivers nearby, nearest ETA: ${nearestEtaMinutes}min`,
        );

        // ─── Push notification to nearby drivers ──────────────────────
        // إشعار FCM للسائقين بطلب جديد (يدعم background/killed apps)
        const fcmTokens = matches
          .map((m) => m.driver.fcmToken)
          .filter((t): t is string => typeof t === 'string' && t.length > 0);
        if (fcmTokens.length > 0) {
          const firstAddr = savedOrder.addresses?.[0];
          const pickupAddress =
            (typeof firstAddr === 'object' && firstAddr && 'address' in firstAddr
              ? (firstAddr as { address?: string }).address
              : undefined) ?? 'pickup point';
          // fire-and-forget — لا نُعطّل الـ request لو فشل Push
          this.pushNotifications
            .sendToTokens(fcmTokens, {
              type: 'new_order_for_driver',
              estimatedFare: Number(savedOrder.costBest),
              currency: savedOrder.currency,
              pickup: pickupAddress,
            })
            .then((res) => {
              this.logger.log(
                `Push → drivers: ${res.successCount}/${fcmTokens.length} delivered` +
                  (res.invalidTokens.length > 0
                    ? ` (${res.invalidTokens.length} stale tokens)`
                    : ''),
              );
              // Clean stale tokens (fire-and-forget)
              if (res.invalidTokens.length > 0) {
                this.clearStaleFcmTokens(res.invalidTokens).catch((e) =>
                  this.logger.warn(`Failed to clear stale tokens: ${e}`),
                );
              }
            })
            .catch((e) =>
              this.logger.warn(`Push to drivers failed: ${(e as Error).message}`),
            );
        }
      } else {
        // لا يوجد سائقون متاحون في النطاق
        await this.orderRepo.update(savedOrder.id, {
          status: OrderStatus.NotFound,
        });

        finalOrder = {
          ...savedOrder,
          status: OrderStatus.NotFound,
        } as OrderEntity;

        this.logger.warn(
          `Order #${savedOrder.id} → NotFound — no drivers in range`,
        );
      }

      // إشعار الراكب بالحالة المحدَّثة
      await this.pubSub.publish(ORDER_UPDATED, {
        orderUpdated: this.toGqlType(finalOrder),
      });

      this.logger.log(`Order #${savedOrder.id} created for rider #${riderId}`);

      return this.toGqlType(finalOrder);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // =============================================
  // previewRoute — معاينة المسافة والأجرة قبل الطلب (مسافة بالطريق)
  // =============================================
  async previewRoute(
    riderId: number,
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    serviceId: number,
  ): Promise<{
    distanceMeters: number;
    durationSeconds: number;
    estimatedFare: number;
    currency: string;
    polyline?: string;
  }> {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const route = await this.directionsService.getRoute(origin, destination);

    const estimatedFare = this.matchingService.estimateFare(
      route.distanceMeters,
      route.durationSeconds,
      Number(service.baseFare),
      Number(service.perHundredMeters) * 10,
      Number(service.perMinuteDrive),
    );

    const rider = await this.riderRepo.findOne({ where: { id: riderId } });

    return {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      estimatedFare: Math.round(estimatedFare * 100) / 100,
      currency: rider?.currency ?? 'SAR',
      polyline: route.polyline,
    };
  }

  // =============================================
  // cancelOrder — إلغاء الطلب من قِبَل الراكب
  // =============================================
  async cancelOrder(riderId: number, orderId: number): Promise<OrderGqlType> {
    const order = await this.findOrderForRider(riderId, orderId);

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.Requested,
      OrderStatus.NotFound,
      OrderStatus.Found,
      OrderStatus.DriverAccepted,
      OrderStatus.Booked,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.status}`,
      );
    }

    await this.orderRepo.update(orderId, {
      status: OrderStatus.RiderCanceled,
    });

    // إزالة من Redis
    await this.orderRedis.removeOrder(orderId);

    // تسجيل النشاط
    await this.activityRepo.save(
      this.activityRepo.create({
        orderId,
        type: RequestActivityType.CanceledByRider,
      }),
    );

    const updated = { ...order, status: OrderStatus.RiderCanceled };
    await this.pubSub.publish(ORDER_UPDATED, {
      orderUpdated: this.toGqlType(updated as OrderEntity),
    });

    this.logger.log(`Order #${orderId} cancelled by rider #${riderId}`);

    return this.toGqlType(updated as OrderEntity);
  }

  // =============================================
  // verifyOtp — التحقق من OTP التسليم
  // =============================================
  async verifyDeliveryOtp(
    riderId: number,
    orderId: number,
    otpCode: string,
  ): Promise<OrderGqlType> {
    const order = await this.findOrderForRider(riderId, orderId);

    if (order.status !== OrderStatus.WaitingForPostPay) {
      throw new BadRequestException('Order is not in OTP verification state');
    }

    if (!order.otpCode) {
      throw new BadRequestException('OTP was not set for this order');
    }

    if (order.otpExpiresAt && order.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    if (order.otpAttempts >= 5) {
      throw new BadRequestException('Too many failed OTP attempts');
    }

    if (order.otpCode !== otpCode) {
      await this.orderRepo.update(orderId, {
        otpAttempts: (order.otpAttempts ?? 0) + 1,
      });

      await this.activityRepo.save(
        this.activityRepo.create({
          orderId,
          type: RequestActivityType.OtpFailed,
        }),
      );

      throw new BadRequestException(
        `Invalid OTP. ${5 - (order.otpAttempts + 1)} attempts remaining.`,
      );
    }

    // OTP صحيح — إنهاء الطلب
    await this.orderRepo.update(orderId, {
      status: OrderStatus.Finished,
      finishTimestamp: new Date(),
    });

    await this.activityRepo.save(
      this.activityRepo.create({
        orderId,
        type: RequestActivityType.OtpVerified,
      }),
    );

    const updated = {
      ...order,
      status: OrderStatus.Finished,
      finishTimestamp: new Date(),
    };

    await this.pubSub.publish(ORDER_UPDATED, {
      orderUpdated: this.toGqlType(updated as OrderEntity),
    });

    return this.toGqlType(updated as OrderEntity);
  }

  // =============================================
  // rateDriver — تقييم السائق بعد الرحلة
  // =============================================
  async rateDriver(
    riderId: number,
    input: RateDriverInput,
  ): Promise<OrderGqlType> {
    const order = await this.findOrderForRider(riderId, input.orderId);

    if (order.status !== OrderStatus.WaitingForReview) {
      throw new BadRequestException('Order is not awaiting review');
    }

    if (!order.driverId) {
      throw new BadRequestException('No driver assigned to this order');
    }

    const driver = await this.driverRepo.findOne({
      where: { id: order.driverId },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    // حساب التقييم الجديد (weighted average)
    const newRatingCount = driver.ratingCount + 1;
    const newRating =
      (Number(driver.rating) * driver.ratingCount + input.rating) /
      newRatingCount;

    await this.driverRepo.update(driver.id, {
      rating: Math.round(newRating * 100) / 100,
      ratingCount: newRatingCount,
    });

    // تحديث حالة الطلب
    const tipAmount = (input.tip && input.tip > 0) ? input.tip : undefined;
    const paidAmount = tipAmount
      ? Number(order.paidAmount) + tipAmount
      : undefined;

    await this.orderRepo.update(order.id, {
      status: OrderStatus.Finished,
      ...(tipAmount !== undefined && { tipAmount }),
      ...(paidAmount !== undefined && { paidAmount }),
    });

    // تحديث إجمالي رحلات الراكب
    await this.riderRepo.update(riderId, {
      totalRides: () => 'total_rides + 1',
    });

    // منح نقاط الولاء (Hancr Miles) بناءً على المبلغ المدفوع
    try {
      await this.loyaltyService.addMiles(
        riderId,
        Number(order.costAfterCoupon),
      );
    } catch (e) {
      this.logger.error(
        `Failed to add loyalty miles for rider #${riderId}: ${(e as Error).message}`,
      );
    }

    // مكافأة الإحالة عند أول رحلة مكتملة للمُحال (يُكافأ الطرفان مرة واحدة)
    try {
      await this.grantReferralRewardIfEligible(riderId);
    } catch (e) {
      this.logger.error(
        `Referral reward failed for rider #${riderId}: ${(e as Error).message}`,
      );
    }

    const updated = {
      ...order,
      status: OrderStatus.Finished,
      ...(tipAmount !== undefined && { tipAmount }),
      ...(paidAmount !== undefined && { paidAmount }),
    };

    await this.pubSub.publish(ORDER_UPDATED, {
      orderUpdated: this.toGqlType(updated as OrderEntity),
    });

    this.logger.log(
      `Driver #${order.driverId} rated ${input.rating}★ by rider #${riderId}`,
    );

    return this.toGqlType(updated as OrderEntity);
  }

  // =============================================
  // getActiveOrder — الطلب النشط الحالي
  // =============================================
  async getActiveOrder(riderId: number): Promise<OrderGqlType | null> {
    const activeStatuses: OrderStatus[] = [
      OrderStatus.Requested,
      OrderStatus.NotFound,
      OrderStatus.Found,
      OrderStatus.DriverAccepted,
      OrderStatus.WaitingForPrePay,
      OrderStatus.Arrived,
      OrderStatus.Started,
      OrderStatus.WaitingForPostPay,
      OrderStatus.WaitingForReview,
    ];

    for (const status of activeStatuses) {
      const order = await this.orderRepo.findOne({
        where: { riderId, status },
        relations: ['driver'],
      });
      if (order) return this.toGqlType(order);
    }

    return null;
  }

  // =============================================
  // getOrderHistory — سجل الرحلات
  // =============================================
  async getOrderHistory(
    riderId: number,
    limit = 20,
    offset = 0,
  ): Promise<OrderGqlType[]> {
    const orders = await this.orderRepo.find({
      where: [
        { riderId, status: OrderStatus.Finished },
        { riderId, status: OrderStatus.RiderCanceled },
        { riderId, status: OrderStatus.DriverCanceled },
        { riderId, status: OrderStatus.Booked },
      ],
      order: { createdOn: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['driver'],
    });

    return orders.map((o) => this.toGqlType(o));
  }

  // =============================================
  // Helpers
  // =============================================

  private async findOrderForRider(
    riderId: number,
    orderId: number,
  ): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['driver'],
    });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    if (order.riderId !== riderId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  private estimateDistance(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
  ): number {
    // Haversine formula
    const R = 6371000; // متر
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const ha =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(ha), Math.sqrt(1 - ha)));
  }

  /**
   * يمنح مكافأة الإحالة للطرفين عند أول رحلة مكتملة للراكب المُحال.
   * يُنفَّذ مرة واحدة فقط (referralRewarded).
   */
  private async grantReferralRewardIfEligible(riderId: number): Promise<void> {
    const REFERRAL_BONUS = 15; // مكافأة لكل طرف بعملته
    const rider = await this.riderRepo.findOne({
      where: { id: riderId },
      select: ['id', 'referredBy', 'referralRewarded', 'currency'],
    });
    if (!rider || !rider.referredBy || rider.referralRewarded) return;

    // علّم المكافأة كممنوحة أولاً لمنع التكرار حتى لو تكرّر النداء
    const upd = await this.riderRepo.update(
      { id: riderId, referralRewarded: false },
      { referralRewarded: true },
    );
    if (!upd.affected) return; // مُنحت بالفعل بنداء متزامن

    // مكافأة المُحال (الراكب الجديد)
    await this.walletService.credit({
      ownerType: WalletOwnerType.Rider,
      ownerId: riderId,
      type: WalletTransactionType.PromoBonus,
      amount: REFERRAL_BONUS,
      currency: rider.currency,
      status: WalletTransactionStatus.Completed,
      description: 'مكافأة إحالة — أول رحلة',
    });

    // مكافأة المُحيل (صاحب الكود) بعملته
    const referrer = await this.riderRepo.findOne({
      where: { id: rider.referredBy },
      select: ['id', 'currency'],
    });
    if (referrer) {
      await this.walletService.credit({
        ownerType: WalletOwnerType.Rider,
        ownerId: referrer.id,
        type: WalletTransactionType.PromoBonus,
        amount: REFERRAL_BONUS,
        currency: referrer.currency,
        status: WalletTransactionStatus.Completed,
        description: 'مكافأة دعوة صديق',
      });
    }
    this.logger.log(
      `Referral reward granted: rider #${riderId} + referrer #${rider.referredBy}`,
    );
  }

  toGqlType(order: OrderEntity): OrderGqlType {
    const driver = (order as OrderEntity & { driver?: DriverEntity }).driver;
    return {
      id: order.id,
      type: order.type,
      status: order.status,
      costBest: Number(order.costBest),
      costAfterCoupon: Number(order.costAfterCoupon),
      discountAmount: Number(order.discountAmount ?? 0),
      couponCode: order.couponCode,
      paidAmount: Number(order.paidAmount),
      tipAmount: Number(order.tipAmount),
      currency: order.currency,
      distanceBest: order.distanceBest,
      durationBest: order.durationBest,
      points: order.points ?? [],
      addresses: order.addresses,
      quietRide: order.quietRide,
      requestedTemperature: order.requestedTemperature,
      audioOff: order.audioOff,
      numberMasked: order.numberMasked,
      otpCode: order.otpCode,
      receiverPhone: order.receiverPhone,
      receiverName: order.receiverName,
      isBidOrder: order.isBidOrder,
      bidId: order.bidId,
      riderId: order.riderId,
      driverId: order.driverId,
      driverName: driver
        ? `${driver.firstName} ${driver.lastName}`
        : undefined,
      driverPhone: driver?.phoneNumber,
      carBrand: driver?.carBrand,
      carModel: driver?.carModel,
      carColor: driver?.carColor,
      plateNumber: driver?.plateNumber,
      driverAvatarUrl: driver?.avatarUrl,
      driverRating: driver ? Number(driver.rating) : undefined,
      serviceId: order.serviceId,
      regionId: order.regionId,
      etaPickup: order.etaPickup,
      startTimestamp: order.startTimestamp,
      finishTimestamp: order.finishTimestamp,
      expectedTimestamp: order.expectedTimestamp,
      createdOn: order.createdOn,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Clear stale FCM tokens from drivers that returned 'token-not-registered'.
   * Called fire-and-forget after multicast push to keep the DB clean.
   */
  private async clearStaleFcmTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.driverRepo
      .createQueryBuilder()
      .update(DriverEntity)
      .set({ fcmToken: undefined })
      .where('fcm_token IN (:...tokens)', { tokens })
      .execute();
  }

  // =============================================
  // كرون: تفعيل الحجوزات المسبقة عند اقتراب موعدها
  // =============================================
  @Cron('30 * * * * *') // كل دقيقة (الثانية 30)
  async activateDueScheduledOrders(): Promise<void> {
    // فعّل الطلبات المحجوزة التي حان موعدها (خلال دقيقتين)
    const due = await this.orderRepo.find({
      where: {
        status: OrderStatus.Booked,
        expectedTimestamp: LessThanOrEqual(new Date(Date.now() + 2 * 60_000)),
      },
      take: 20,
    });
    for (const order of due) {
      try {
        await this.activateScheduledOrder(order);
      } catch (e) {
        this.logger.warn(
          `Failed to activate scheduled order #${order.id}: ${(e as Error).message}`,
        );
      }
    }
  }

  /** يفعّل طلباً محجوزاً: مطابقة السائقين + نشر الإشعارات. */
  private async activateScheduledOrder(order: OrderEntity): Promise<void> {
    const rider = await this.riderRepo.findOne({ where: { id: order.riderId } });
    if (!rider) return;
    const origin = order.points?.[0];
    if (!origin) return;

    await this.orderRedis.addOrder({
      orderId: order.id,
      riderId: order.riderId,
      serviceId: order.serviceId,
      lat: origin.lat,
      lng: origin.lng,
    });

    const matches = await this.matchingService.findNearbyDrivers(
      origin.lat,
      origin.lng,
      order.serviceId,
    );

    if (matches.length > 0) {
      const etaPickup = new Date(Date.now() + matches[0].etaMinutes * 60_000);
      await this.orderRepo.update(order.id, {
        status: OrderStatus.Found,
        etaPickup,
      });
      await this.pubSub.publish(NEW_ORDER_AVAILABLE, {
        newOrderAvailable: {
          id: order.id,
          type: order.type,
          status: OrderStatus.Found,
          riderId: order.riderId,
          riderName: rider.firstName
            ? `${rider.firstName} ${rider.lastName ?? ''}`.trim()
            : undefined,
          riderPhone: order.numberMasked ? undefined : rider.phoneNumber,
          riderRating: Number(rider.rating),
          points: order.points ?? [],
          addresses: order.addresses,
          distanceBest: order.distanceBest,
          durationBest: order.durationBest,
          costBest: Number(order.costBest),
          costAfterCoupon: Number(order.costAfterCoupon),
          currency: order.currency,
          paymentMode: order.paymentMode ?? PaymentMode.Cash,
          quietRide: order.quietRide,
          requestedTemperature: order.requestedTemperature,
          audioOff: order.audioOff,
          numberMasked: order.numberMasked,
          otpCode: order.otpCode,
          receiverName: order.receiverName,
          isBidOrder: order.isBidOrder,
          etaPickup,
          createdOn: order.createdOn,
        },
      });
      await this.pubSub.publish(ORDER_UPDATED, {
        orderUpdated: this.toGqlType({
          ...order,
          status: OrderStatus.Found,
          etaPickup,
        } as OrderEntity),
      });
      this.logger.log(`Scheduled order #${order.id} activated → Found`);
    } else {
      await this.orderRepo.update(order.id, { status: OrderStatus.NotFound });
      await this.pubSub.publish(ORDER_UPDATED, {
        orderUpdated: this.toGqlType({
          ...order,
          status: OrderStatus.NotFound,
        } as OrderEntity),
      });
      this.logger.warn(`Scheduled order #${order.id} activated → NotFound`);
    }
  }
}
