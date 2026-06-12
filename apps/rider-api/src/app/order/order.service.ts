import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, LessThan, Not, IsNull } from 'typeorm';
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
  DriverStatus,
  WalletOwnerType,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@hancr/database';
import { OrderRedisService, CronLockService } from '@hancr/redis';
import { PushNotificationService } from '@hancr/notifications';
import { WalletService } from '@hancr/wallet';
import { SosService } from '@hancr/sos';
import { PUB_SUB } from '../pubsub.provider';
import { CreateOrderInput } from './dto/create-order.input';
import { RateDriverInput } from './dto/rate-driver.input';
import { OrderType as OrderGqlType } from './dto/order.type';
import { MatchingService } from './matching.service';
import { DirectionsService } from './directions.service';
import { CouponService } from './coupon.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { BundleService } from '../bundle/bundle.service';
import { CompanyService } from '../company/company.service';
import { AppConfigReader } from '../app-config/app-config-reader.service';

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
    private readonly cronLock: CronLockService,
    private readonly matchingService: MatchingService,
    private readonly directionsService: DirectionsService,
    private readonly couponService: CouponService,
    private readonly loyaltyService: LoyaltyService,
    private readonly bundleService: BundleService,
    private readonly companyService: CompanyService,
    private readonly walletService: WalletService,
    private readonly sosService: SosService,
    private readonly dataSource: DataSource,
    private readonly pushNotifications: PushNotificationService,
    private readonly appConfig: AppConfigReader,

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

    // جلب الخدمة — أمن: تُقيَّد بالمنطقة المطلوبة وبكونها مُفعَّلة.
    // (كان يُجلب بالـ id فقط → يمكن تمرير خدمة منطقة أخرى/معطّلة فيُسعَّر بسعرها،
    // وregionId وهمي يتجاوز تسعير المناطق. ربط الخدمة بالمنطقة يسدّ الثغرتين.)
    const service = await this.serviceRepo.findOne({
      where: { id: input.serviceId, regionId: input.regionId, enabled: true },
    });
    if (!service) {
      throw new NotFoundException('الخدمة غير متاحة في هذه المنطقة');
    }

    const originPoint = input.points[0];
    const destPoint = input.points[input.points.length - 1];
    const waypoints = input.points.slice(1, -1);

    // أمن (تحصين أعمق): اشتق المنطقة من نقطة الالتقاط ورفض إن خالفت المطلوبة —
    // يمنع المطالبة بمنطقة أرخص بينما الالتقاط فعلياً في منطقة أخرى. حدّ مؤقّت
    // بـ bounding box (الدول الثلاث متباعدة)؛ يُستبدل بـ PostGIS ST_Contains
    // متى مُلئت حدود المناطق (hancr_region.boundary حالياً NULL).
    const derivedRegionId = this.resolveRegionIdFromPoint(
      originPoint.lat,
      originPoint.lng,
    );
    if (derivedRegionId !== null && derivedRegionId !== input.regionId) {
      throw new BadRequestException('نقطة الالتقاط خارج المنطقة المحددة');
    }

    // حساب مسافة الطريق الفعلية ومدتها عبر Google Directions (مع احتياط haversine)
    const route = await this.directionsService.getRoute(
      originPoint,
      destPoint,
      waypoints,
    );
    const distanceMeters = route.distanceMeters;
    const durationSeconds = route.durationSeconds;

    // I11/L3 — Zone pricing overrides defaults. Priority:
    //   1. PostGIS polygon containing the pickup, fleet-specific.
    //   2. PostGIS polygon containing the pickup, general.
    //   3. Region-based zone, fleet-specific.
    //   4. Region-based zone, general.
    // ST_Within on geography is meters-accurate; GiST index keeps it fast.
    const zoneRow = await this.dataSource.query<
      Array<{
        base_fare: string;
        per_km: string;
        per_minute: string;
        multiplier: string;
      }>
    >(
      `SELECT base_fare, per_km, per_minute, multiplier
       FROM hancr_pricing_zone
       WHERE service_id = $1 AND active = true
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at   IS NULL OR ends_at   >= NOW())
         AND (
           (polygon IS NOT NULL AND
            ST_Within(
              ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
              polygon
            ))
           OR (polygon IS NULL AND region_id = $4)
         )
       ORDER BY (polygon IS NOT NULL) DESC,
                (fleet_id IS NOT NULL) DESC,
                id DESC
       LIMIT 1`,
      [input.serviceId, originPoint.lng, originPoint.lat, input.regionId],
    );

    const zone = zoneRow[0];
    const baseFare = zone ? Number(zone.base_fare) : Number(service.baseFare);
    const perKm = zone
      ? Number(zone.per_km)
      : Number(service.perHundredMeters) * 10;
    const perMin = zone
      ? Number(zone.per_minute)
      : Number(service.perMinuteDrive);
    const multiplier = zone ? Number(zone.multiplier) : 1;

    // حساب السعر (baseFare + perKm + perMinute) × multiplier
    let costBest = this.matchingService.estimateFare(
      distanceMeters,
      durationSeconds,
      baseFare,
      perKm,
      perMin,
    );
    if (multiplier !== 1) costBest = Math.round(costBest * multiplier * 100) / 100;

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

    // F1 — Ride Bundles: محاولة استخدام حزمة رحلات مدفوعة مسبقاً
    //
    // الشروط: رحلة عادية فقط (لا Bid / لا HourlyChauffeur / لا ParcelDelivery)،
    // ولديه entitlement فعّال يغطّي المسافة. عند التطبيق:
    //   - cost = 0
    //   - paymentMode = Entitlement
    //   - entitlementId يُحفظ على الطلب
    let usedEntitlementId: number | undefined;
    const isRegularRide =
      !input.isBidOrder &&
      !input.bookedHours &&
      !input.receiverPhone &&
      !input.scheduledAt;
    if (isRegularRide) {
      const ent = await this.bundleService.findUsableEntitlement(
        riderId,
        distanceMeters,
      );
      if (ent) {
        usedEntitlementId = ent.id;
        costAfterCoupon = 0;
        // نُلغي أي كوبون لو طُبّق — الحزمة أقوى
        appliedCouponId = undefined;
        appliedCouponCode = undefined;
        discountAmount = 0;
        input.paymentMode = PaymentMode.Entitlement;
      }
    }

    // F2 — Corporate Accounts: لو الراكب اختار "حساب الشركة"
    //   نتحقّق أنه موظف نشط في شركة فعالة، ونحفظ companyId على الطلب.
    //   الخصم الفعلي يقع بعد commit (chargeForOrder).
    let companyId: number | undefined;
    if (
      input.paymentMode === PaymentMode.Company &&
      !usedEntitlementId &&
      costAfterCoupon > 0
    ) {
      const link = await this.companyService.findActiveLink(riderId);
      if (!link) {
        throw new BadRequestException(
          'You are not linked to an active company account',
        );
      }
      companyId = link.company.id;
    }

    // عمولة المنصة: تُحسَب وتُحفظ على الطلب وقت الإنشاء (كانت دائماً 0 — تسريب إيراد).
    // تُحسب على السعر النهائي بعد الكوبون؛ رحلات الحزمة (cost=0) عمولتها 0.
    const providerSharePercent = Number(service.providerSharePercent ?? 20);
    const providerShare =
      Math.round(costAfterCoupon * (providerSharePercent / 100) * 100) / 100;

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
        providerShare,
        currency: rider.currency,
        paymentMode: (input.paymentMode as PaymentMode) ?? PaymentMode.Cash,
        // Ride Moods
        quietRide: input.quietRide ?? false,
        requestedTemperature: input.requestedTemperature,
        audioOff: input.audioOff ?? false,
        numberMasked: input.numberMasked ?? false,
        familyMode: input.familyMode ?? false,
        preferFemaleDriver:
          (input.preferFemaleDriver ?? false) || (input.familyMode ?? false),
        preferredDriverId: input.preferredDriverId,
        // Grocery Run
        shoppingList: input.shoppingList,
        budget: input.budget,
        // F1 Ride Bundles
        entitlementId: usedEntitlementId,
        // F2 Corporate
        companyId,
        // G1 Night Shift
        nightShift: input.nightShift ?? false,
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

      // F1 — خصم رحلة من الحزمة بعد نجاح الإنشاء
      if (usedEntitlementId) {
        try {
          await this.bundleService.decrementUsage(usedEntitlementId);
        } catch (e) {
          this.logger.warn(
            `Failed to decrement entitlement #${usedEntitlementId}: ${
              (e as Error).message
            }`,
          );
        }
      }

      // F2 — خصم الأجرة من رصيد الشركة بعد نجاح الإنشاء.
      // ملاحظة: لو فشل (cap/balance) نُلغي الطلب الذي أُنشئ للتو حفاظاً على
      // الاتساق — لأن العميل لا يجب أن يحصل على رحلة لم تُدفع.
      if (companyId && costAfterCoupon > 0) {
        try {
          await this.companyService.chargeForOrder(
            riderId,
            costAfterCoupon,
            rider.currency,
            savedOrder.id,
          );
        } catch (e) {
          await this.orderRepo.update(
            { id: savedOrder.id },
            { status: OrderStatus.RiderCanceled },
          );
          throw e;
        }
      }

      // G1 — وضع الليل: مشاركة موقع تلقائية مع جهات الطوارئ
      // (نطلق وراء fire-and-forget — لا تُعطّل إنشاء الطلب لو فشل SMS)
      if (input.nightShift && destPoint) {
        this.sosService
          .shareTripWithContacts({
            ownerType: 'Rider',
            ownerId: riderId,
            orderId: savedOrder.id,
            destinationLat: destPoint.lat,
            destinationLng: destPoint.lng,
          })
          .catch((e) =>
            this.logger.warn(
              `Night-shift trip share failed for order #${savedOrder.id}: ${
                (e as Error).message
              }`,
            ),
          );
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
      // Phase H — فلترة حسب خصائص الطلب:
      //   - nightShift → سائق night_approved
      //   - familyMode/preferFemale → سائقة (gender='F')
      //   - preferredDriverId (VIP) → استهداف ناعم: 60s حصرياً للسائق المفضّل
      const filters: import('./matching.service').MatchingFilters = {
        requireFemale:
          (input.familyMode ?? false) || (input.preferFemaleDriver ?? false),
        requireNightApproved: input.nightShift ?? false,
      };
      if (input.preferredDriverId) {
        filters.onlyDriverId = input.preferredDriverId;
      }
      // I10 — استبعاد غير المنتمين للأساطيل النشطة الحصرية في هذه المنطقة
      const exclusiveFleets = await this.dataSource.query<
        Array<{ id: number }>
      >(
        `SELECT id FROM hancr_fleet WHERE active = true AND $1 = ANY(exclusivity_region_ids)`,
        [input.regionId],
      );
      if (exclusiveFleets.length > 0) {
        filters.exclusiveFleetIds = exclusiveFleets.map((r) => r.id);
      }
      const matches = await this.matchingService.findNearbyDrivers(
        originPoint.lat,
        originPoint.lng,
        input.serviceId,
        5,
        filters,
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
      where: { id: serviceId, enabled: true },
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

    // N1 — الحالات القابلة للإلغاء من لوحة التحكم (pricingRulesConfig)
    const rules = await this.appConfig.getPricingRules();
    const cancellableStatuses: string[] = rules.cancellableStatuses ?? [
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

    // تحرير السائق المُسنَد (كان يبقى Busy للأبد بعد الإلغاء) — يعيده للتوفّر.
    // ملاحظة: حالة Redis الفورية يملكها driver-api ويعيد ضبطها عند استقبال ORDER_UPDATED.
    if (order.driverId) {
      await this.driverRepo.update(
        { id: order.driverId, status: DriverStatus.Busy },
        { status: DriverStatus.Online },
      );
    }

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

  /**
   * يشتق معرّف المنطقة من إحداثيات الالتقاط.
   * bounding boxes مرتّبة (الجيوب الصغيرة أولاً لحلّ التداخل مع السعودية).
   * IDs: 1=قطر · 2=الإمارات · 3=السعودية (تطابق hancr_region).
   * يعيد null إن كانت النقطة خارج كل المناطق المعروفة (لا نكسر التدفّق).
   * ملاحظة: حلّ مؤقّت — يُستبدَل بـ PostGIS ST_Contains عند ملء حدود المناطق.
   */
  private resolveRegionIdFromPoint(lat: number, lng: number): number | null {
    const inBox = (
      la0: number,
      la1: number,
      ln0: number,
      ln1: number,
    ): boolean => lat >= la0 && lat <= la1 && lng >= ln0 && lng <= ln1;
    if (inBox(24.4, 26.2, 50.7, 51.7)) return 1; // قطر
    if (inBox(22.5, 26.2, 51.5, 56.5)) return 2; // الإمارات
    if (inBox(16.0, 32.2, 34.4, 55.7)) return 3; // السعودية
    return null;
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
    // N1 — مكافأة الإحالة من لوحة التحكم (loyaltyConfig.referralBonus)
    const loyaltyCfg = await this.appConfig.getLoyalty();
    const REFERRAL_BONUS = loyaltyCfg.referralBonus ?? 15; // لكل طرف بعملته
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
      shoppingList: order.shoppingList,
      budget: order.budget != null ? Number(order.budget) : undefined,
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
    // قفل موزّع: instance واحد فقط ينفّذ (يمنع مطابقة نفس الطلب مراراً مع pm2).
    if (!(await this.cronLock.acquire('order:activate-scheduled', 50))) return;
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
      5,
      {
        requireFemale:
          (order.familyMode ?? false) || (order.preferFemaleDriver ?? false),
        requireNightApproved: order.nightShift ?? false,
        onlyDriverId: order.preferredDriverId,
      },
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

  // =============================================
  // H4 — كرون VIP: توسيع طلبات VIP غير المقبولة بعد 60 ثانية
  // =============================================
  /**
   * VIP soft-target — لو السائق المفضّل لم يقبل خلال 60 ثانية،
   * نُعيد المطابقة بدون فلتر onlyDriverId (لجميع السائقين القريبين).
   * يعمل كل دقيقة (الثانية 45 لتجنّب التصادم مع كرون الحجوزات).
   */
  @Cron('45 * * * * *')
  async expandUnacceptedVipOrders(): Promise<void> {
    if (!(await this.cronLock.acquire('order:expand-vip', 50))) return;
    const cutoff = new Date(Date.now() - 60_000);
    const candidates = await this.orderRepo.find({
      where: {
        status: OrderStatus.Found,
        preferredDriverId: Not(IsNull()),
        createdOn: LessThan(cutoff),
      },
      take: 10,
    });
    for (const order of candidates) {
      try {
        const origin = order.points?.[0];
        if (!origin) continue;
        // إعادة المطابقة بدون onlyDriverId (نُلغي قيد VIP)
        const matches = await this.matchingService.findNearbyDrivers(
          origin.lat,
          origin.lng,
          order.serviceId,
          5,
          {
            requireFemale:
              (order.familyMode ?? false) ||
              (order.preferFemaleDriver ?? false),
            requireNightApproved: order.nightShift ?? false,
            // ملاحظة: لا نُمرّر onlyDriverId — هذا هو التوسيع
          },
        );
        if (matches.length === 0) continue;
        // إعادة بثّ subscription للسائقين الجدد
        await this.pubSub.publish(NEW_ORDER_AVAILABLE, {
          newOrderAvailable: this.toGqlType(order),
        });
        // نُعلِّم الطلب كي لا يُعاد توسيعه (نمسح preferredDriverId)
        await this.orderRepo.update(order.id, { preferredDriverId: undefined });
        this.logger.log(
          `VIP order #${order.id} expanded to ${matches.length} drivers after 60s timeout`,
        );
      } catch (e) {
        this.logger.warn(
          `Failed to expand VIP order #${order.id}: ${(e as Error).message}`,
        );
      }
    }
  }
}
