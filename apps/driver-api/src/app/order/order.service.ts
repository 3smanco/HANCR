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
import { RedisPubSub } from 'graphql-redis-subscriptions';
import {
  OrderEntity,
  OrderStatus,
  OrderType,
  DriverEntity,
  DriverStatus,
  RiderEntity,
  RequestActivityEntity,
  RequestActivityType,
  PaymentMode,
} from '@hancr/database';
import { DriverRedisService, OrderRedisService } from '@hancr/redis';
import { PushNotificationService } from '@hancr/notifications';
import {
  WalletService,
  InsufficientBalanceError,
  PaymentGatewayService,
} from '@hancr/wallet';
import { PaymentGateway, WalletTransactionStatus } from '@hancr/database';
import { SosService } from '@hancr/sos';
import {
  WalletOwnerType,
  WalletTransactionType,
} from '@hancr/database';
import { PUB_SUB } from '../pubsub.provider';
import { DriverOrderType } from './dto/driver-order.type';

export const NEW_ORDER_AVAILABLE = 'NEW_ORDER_AVAILABLE';
export const DRIVER_ORDER_UPDATED = 'DRIVER_ORDER_UPDATED';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,

    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,

    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,

    @InjectRepository(RequestActivityEntity)
    private readonly activityRepo: Repository<RequestActivityEntity>,

    private readonly driverRedis: DriverRedisService,
    private readonly orderRedis: OrderRedisService,
    private readonly pushNotifications: PushNotificationService,
    private readonly walletService: WalletService,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly sosService: SosService,

    @Inject(PUB_SUB)
    private readonly pubSub: RedisPubSub,
  ) {}

  /**
   * Fire-and-forget push notification to a rider.
   * Looks up FCM token from RiderEntity (if linked) and clears stale token on failure.
   */
  private pushToRider(
    riderId: number,
    template: import('@hancr/notifications').NotificationTemplate,
  ): void {
    this.riderRepo
      .findOne({ where: { id: riderId }, select: ['id', 'fcmToken'] })
      .then(async (rider) => {
        if (!rider?.fcmToken) return;
        const res = await this.pushNotifications.sendToToken(
          rider.fcmToken,
          template,
        );
        if (res.shouldClearToken) {
          await this.riderRepo.update(riderId, { fcmToken: undefined });
        }
      })
      .catch((e) =>
        this.logger.warn(`Push to rider #${riderId} failed: ${(e as Error).message}`),
      );
  }

  // =============================================
  // acceptOrder — السائق يقبل الطلب
  // =============================================
  async acceptOrder(driverId: number, orderId: number): Promise<DriverOrderType> {
    const order = await this.getOrderOrThrow(orderId);

    if (order.status !== OrderStatus.Found) {
      throw new BadRequestException(
        `Order status is ${order.status}, expected Found`,
      );
    }

    // التحقق من أن السائق متاح
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (!driver.active) throw new ForbiddenException('Account not active');
    if (driver.banned) throw new ForbiddenException('Account is banned');

    // تحديث الطلب — ذرّي ومشروط: ينجح فقط إن كان الطلب ما زال Found.
    // يمنع سباق القبول المزدوج (سائقان يقبلان نفس الرحلة).
    const eta = new Date(Date.now() + 5 * 60 * 1000); // ETA 5 دقائق افتراضياً
    const claim = await this.orderRepo.update(
      { id: orderId, status: OrderStatus.Found },
      {
        status: OrderStatus.DriverAccepted,
        driverId,
        etaPickup: eta,
      },
    );
    if (!claim.affected) {
      throw new BadRequestException('تم قبول هذا الطلب من سائق آخر بالفعل');
    }

    // تحديث حالة السائق إلى Busy
    await this.driverRepo.update(driverId, { status: DriverStatus.Busy });
    await this.driverRedis.setStatus(driverId, 'Busy');

    // إزالة الطلب من Redis (لن يُعرَض على سائقين آخرين)
    await this.orderRedis.removeOrder(orderId);

    // تسجيل النشاط
    await this.activityRepo.save(
      this.activityRepo.create({
        orderId,
        type: RequestActivityType.DriverAccepted,
      }),
    );

    const updated = await this.getOrderWithRider(orderId);

    await this.pubSub.publish(DRIVER_ORDER_UPDATED, {
      driverOrderUpdated: updated,
    });

    // Push to rider: driver assigned
    const driverName =
      [driver.firstName, driver.lastName].filter(Boolean).join(' ') ||
      'Your driver';
    this.pushToRider(updated.riderId, {
      type: 'order_assigned',
      driverName,
      carPlate: driver.plateNumber ?? '—',
      etaMinutes: 5,
    });

    this.logger.log(`Order #${orderId} accepted by driver #${driverId}`);
    return updated;
  }

  // =============================================
  // arrivedAtPickup — السائق وصل لنقطة الانطلاق
  // =============================================
  async arrivedAtPickup(driverId: number, orderId: number): Promise<DriverOrderType> {
    const order = await this.getAssignedOrder(driverId, orderId);

    if (order.status !== OrderStatus.DriverAccepted) {
      throw new BadRequestException(`Expected DriverAccepted status`);
    }

    await this.orderRepo.update(orderId, { status: OrderStatus.Arrived });

    await this.activityRepo.save(
      this.activityRepo.create({
        orderId,
        type: RequestActivityType.ArrivedToPickupPoint,
      }),
    );

    const updated = await this.getOrderWithRider(orderId);
    await this.pubSub.publish(DRIVER_ORDER_UPDATED, { driverOrderUpdated: updated });

    // Push to rider: driver arrived
    const driver = await this.driverRepo.findOne({
      where: { id: driverId },
      select: ['firstName', 'lastName'],
    });
    const driverName =
      [driver?.firstName, driver?.lastName].filter(Boolean).join(' ') ||
      'Your driver';
    this.pushToRider(updated.riderId, {
      type: 'order_arrived',
      driverName,
    });

    this.logger.log(`Driver #${driverId} arrived at pickup for order #${orderId}`);
    return updated;
  }

  // =============================================
  // startRide — بدء الرحلة
  // =============================================
  async startRide(driverId: number, orderId: number): Promise<DriverOrderType> {
    const order = await this.getAssignedOrder(driverId, orderId);

    if (order.status !== OrderStatus.Arrived) {
      throw new BadRequestException('Must arrive at pickup first');
    }

    await this.orderRepo.update(orderId, {
      status: OrderStatus.Started,
      startTimestamp: new Date(),
    });

    await this.activityRepo.save(
      this.activityRepo.create({
        orderId,
        type: RequestActivityType.Started,
      }),
    );

    const updated = await this.getOrderWithRider(orderId);
    await this.pubSub.publish(DRIVER_ORDER_UPDATED, { driverOrderUpdated: updated });

    // Push to rider: trip started
    const lastAddr = updated.addresses?.[updated.addresses.length - 1];
    const destAddr =
      (typeof lastAddr === 'object' && lastAddr && 'address' in lastAddr
        ? (lastAddr as { address?: string }).address
        : undefined) ?? 'destination';
    this.pushToRider(updated.riderId, {
      type: 'order_started',
      destinationAddress: destAddr,
    });

    // ─── Trip Sharing التلقائي ───────────────────────────────────────────
    // أرسل SMS لجهات الطوارئ التي وضعها الراكب بـ autoShareTrips=true.
    // غير متزامن — لا نُؤخِّر استجابة API.
    this._shareTripAsync(updated).catch((e) => {
      this.logger.error(`Trip sharing failed for order #${orderId}: ${e}`);
    });

    this.logger.log(`Ride started for order #${orderId}`);
    return updated;
  }

  /**
   * شارك تفاصيل الرحلة مع جهات الطوارئ المُفعَّلة للراكب.
   * يُستدعى بشكل غير متزامن من startRide.
   */
  private async _shareTripAsync(order: DriverOrderType): Promise<void> {
    if (!order.points || order.points.length === 0) return;
    const dest = order.points[order.points.length - 1];

    // جلب بيانات السائق (الاسم + لوحة السيارة) لإدراجها في رسالة الـ SMS.
    const orderRow = await this.orderRepo.findOne({
      where: { id: order.id },
      select: ['driverId'],
    });
    let driverName: string | undefined;
    let plateNumber: string | undefined;
    if (orderRow?.driverId) {
      const driver = await this.driverRepo.findOne({
        where: { id: orderRow.driverId },
        select: ['firstName', 'lastName', 'plateNumber'],
      });
      if (driver) {
        driverName = [driver.firstName, driver.lastName]
          .filter(Boolean)
          .join(' ') || undefined;
        plateNumber = driver.plateNumber;
      }
    }

    await this.sosService.shareTripWithContacts({
      ownerType: 'Rider',
      ownerId: order.riderId,
      orderId: order.id,
      driverName,
      plateNumber,
      destinationLat: dest.lat,
      destinationLng: dest.lng,
    });
  }

  // =============================================
  // finishRide — انتهاء الرحلة
  // =============================================
  async finishRide(driverId: number, orderId: number): Promise<DriverOrderType> {
    const order = await this.getAssignedOrder(driverId, orderId);

    if (order.status !== OrderStatus.Started) {
      throw new BadRequestException('Ride has not started yet');
    }

    // إذا كان OTP مطلوباً (تسليم بضاعة) → انتقل إلى WaitingForPostPay
    // إذا كان دفع نقدي عادي → WaitingForReview
    const hasOtp = !!order.receiverPhone;
    const isCash = order.paymentMode === PaymentMode.Cash;

    const nextStatus = hasOtp
      ? OrderStatus.WaitingForPostPay
      : isCash
      ? OrderStatus.WaitingForReview
      : OrderStatus.WaitingForPostPay;

    // توليد OTP إذا كان مطلوباً
    const otpCode = hasOtp
      ? Math.floor(1000 + Math.random() * 9000).toString()
      : undefined;
    const otpExpiresAt = hasOtp
      ? new Date(Date.now() + 10 * 60 * 1000)
      : undefined;

    await this.orderRepo.update(orderId, {
      status: nextStatus,
      finishTimestamp: new Date(),
      ...(otpCode && { otpCode, otpExpiresAt, otpAttempts: 0 }),
    });

    await this.activityRepo.save(
      this.activityRepo.create({
        orderId,
        type: RequestActivityType.ArrivedToDestination,
      }),
    );

    // السائق يعود إلى Online
    await this.driverRepo.update(driverId, { status: DriverStatus.Online });
    await this.driverRedis.setStatus(driverId, 'Online');

    // ─── Auto-settle payment ───
    // - Wallet mode: debit rider's wallet + credit driver's earnings (minus commission)
    // - Cash mode: only credit driver's earnings (rider pays driver directly)
    // - PaymentGateway: open a Pending charge with the gateway; driver earnings
    //   are credited later by the webhook once the gateway confirms.
    try {
      await this._settlePayment(order);
    } catch (e) {
      // لا نُفشل الـ finishRide لو فشلت التسوية — يُسجَّل خطأ ويُعالَج لاحقاً
      this.logger.error(
        `Payment settlement failed for order #${orderId}: ${(e as Error).message}`,
      );
    }

    const updated = await this.getOrderWithRider(orderId);
    await this.pubSub.publish(DRIVER_ORDER_UPDATED, { driverOrderUpdated: updated });

    // Push to rider: trip completed + ask for review
    this.pushToRider(updated.riderId, {
      type: 'order_completed',
      amount: Number(updated.costAfterCoupon),
      currency: updated.currency,
    });

    this.logger.log(`Ride finished for order #${orderId}, status: ${nextStatus}`);
    return updated;
  }

  // =============================================
  // confirmDelivery — تأكيد تسليم أمانة عبر OTP
  // الراكب يعرض الكود للمستلم، والسائق يُدخله هنا لإثبات التسليم
  // =============================================
  async confirmDelivery(
    driverId: number,
    orderId: number,
    otpCode: string,
  ): Promise<DriverOrderType> {
    const order = await this.getAssignedOrder(driverId, orderId);

    if (order.status !== OrderStatus.Started) {
      throw new BadRequestException('Delivery has not started yet');
    }
    if (!order.receiverPhone) {
      throw new BadRequestException('This order is not a parcel delivery');
    }
    if (!order.otpCode) {
      throw new BadRequestException('No delivery OTP set for this order');
    }
    if (order.otpAttempts >= 5) {
      throw new BadRequestException('Too many failed OTP attempts');
    }
    if (order.otpCode !== otpCode.trim()) {
      await this.orderRepo.update(orderId, {
        otpAttempts: (order.otpAttempts ?? 0) + 1,
      });
      throw new BadRequestException(
        `Invalid OTP. ${5 - ((order.otpAttempts ?? 0) + 1)} attempts remaining.`,
      );
    }

    // OTP صحيح — إنهاء التسليم
    const nextStatus =
      order.paymentMode === PaymentMode.Cash
        ? OrderStatus.WaitingForReview
        : OrderStatus.WaitingForPostPay;

    await this.orderRepo.update(orderId, {
      status: nextStatus,
      finishTimestamp: new Date(),
    });

    await this.activityRepo.save(
      this.activityRepo.create({
        orderId,
        type: RequestActivityType.OtpVerified,
      }),
    );

    await this.driverRepo.update(driverId, { status: DriverStatus.Online });
    await this.driverRedis.setStatus(driverId, 'Online');

    try {
      await this._settlePayment(order);
    } catch (e) {
      this.logger.error(
        `Payment settlement failed for order #${orderId}: ${(e as Error).message}`,
      );
    }

    const updated = await this.getOrderWithRider(orderId);
    await this.pubSub.publish(DRIVER_ORDER_UPDATED, {
      driverOrderUpdated: updated,
    });
    this.pushToRider(updated.riderId, {
      type: 'order_completed',
      amount: Number(updated.costAfterCoupon),
      currency: updated.currency,
    });

    this.logger.log(`Delivery confirmed for order #${orderId}`);
    return updated;
  }

  // =============================================
  // cancelOrder — السائق يلغي الطلب
  // =============================================
  async cancelOrder(driverId: number, orderId: number): Promise<DriverOrderType> {
    const order = await this.getAssignedOrder(driverId, orderId);

    const cancellable = [OrderStatus.DriverAccepted, OrderStatus.Arrived];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException('Cannot cancel at this stage');
    }

    await this.orderRepo.update(orderId, { status: OrderStatus.DriverCanceled });
    await this.driverRepo.update(driverId, { status: DriverStatus.Online });
    await this.driverRedis.setStatus(driverId, 'Online');

    await this.activityRepo.save(
      this.activityRepo.create({
        orderId,
        type: RequestActivityType.CanceledByDriver,
      }),
    );

    const updated = await this.getOrderWithRider(orderId);
    await this.pubSub.publish(DRIVER_ORDER_UPDATED, { driverOrderUpdated: updated });

    this.logger.log(`Order #${orderId} cancelled by driver #${driverId}`);
    return updated;
  }

  // =============================================
  // getActiveOrder — الطلب النشط الحالي للسائق
  // =============================================
  async getActiveOrder(driverId: number): Promise<DriverOrderType | null> {
    const activeStatuses = [
      OrderStatus.DriverAccepted,
      OrderStatus.Arrived,
      OrderStatus.Started,
      OrderStatus.WaitingForPostPay,
    ];

    for (const status of activeStatuses) {
      const order = await this.orderRepo.findOne({
        where: { driverId, status },
        relations: ['rider'],
      });
      if (order) return this.toType(order);
    }
    return null;
  }

  // ─────────────────────────────────────────────
  // completedOrders — سجل رحلات السائق المكتملة
  // ─────────────────────────────────────────────
  async getCompletedOrders(
    driverId: number,
    limit = 20,
    offset = 0,
  ): Promise<DriverOrderType[]> {
    const take = Math.max(1, Math.min(Math.floor(limit) || 20, 50));
    const skip = Math.max(0, Math.floor(offset) || 0);
    const orders = await this.orderRepo.find({
      where: { driverId, status: OrderStatus.Finished },
      relations: ['rider'],
      order: { createdOn: 'DESC' },
      take,
      skip,
    });
    return orders.map((o) => this.toType(o));
  }

  // =============================================
  // Helpers
  // =============================================

  /**
   * تسوية الدفع عند نهاية الرحلة:
   *  - Wallet → debit rider + credit driver (minus platform commission)
   *  - Cash → credit driver فقط (الراكب دفع نقداً مباشرة)
   *  - PaymentGateway/SavedPaymentMethod → يُحال للـ webhook (يُترك Pending)
   *
   * Commission = providerShare من order entity (محسوبة سابقاً عند createOrder).
   */
  private async _settlePayment(order: OrderEntity): Promise<void> {
    if (!order.driverId) {
      this.logger.warn(`Order #${order.id} has no driver — skipping settlement`);
      return;
    }

    const total = Number(order.costAfterCoupon);
    const platformCommission = Number(order.providerShare);
    const driverNet = total - platformCommission;
    const mode = order.paymentMode;

    this.logger.log(
      `Settling order #${order.id}: total=${total} ${order.currency}, ` +
        `commission=${platformCommission}, driverNet=${driverNet}, mode=${mode}`,
    );

    // 1) Wallet payment: خصم الراكب ثم إيداع السائق — بتعويض عند الفشل.
    //    إصلاح: كان الخصم والإيداع منفصلين بلا تعويض (خصم ينجح + إيداع يفشل →
    //    الراكب يُخصم والسائق لا يُدفع)، والرصيد الناقص كان يُكمل الرحلة مجاناً.
    if (mode === PaymentMode.Wallet) {
      let debitTxId: number;
      try {
        const debited = await this.walletService.debit({
          ownerType: WalletOwnerType.Rider,
          ownerId: order.riderId,
          type: WalletTransactionType.TripPayment,
          amount: total,
          currency: order.currency,
          orderId: order.id,
          description: `Trip payment — order #${order.id}`,
        });
        debitTxId = debited.transactionId;
      } catch (e) {
        if (e instanceof InsufficientBalanceError) {
          // لا رحلة مجانية: ننقل الطلب لانتظار الدفع (تُحجب المراجعة/الإغلاق حتى يُدفع).
          await this.orderRepo.update(order.id, {
            status: OrderStatus.WaitingForPostPay,
          });
          this.logger.warn(
            `Order #${order.id}: رصيد الراكب #${order.riderId} غير كافٍ — WaitingForPostPay`,
          );
          return;
        }
        throw e;
      }

      // إيداع أرباح السائق — لو فشل نعكس خصم الراكب (سلامة المال).
      try {
        await this.walletService.credit({
          ownerType: WalletOwnerType.Driver,
          ownerId: order.driverId,
          type: WalletTransactionType.DriverEarnings,
          amount: driverNet,
          currency: order.currency,
          orderId: order.id,
          description: `Driver earnings — order #${order.id} (commission: ${platformCommission})`,
          metadata: { commission: platformCommission, total },
        });
      } catch (e) {
        await this.walletService
          .reverseTransaction(
            debitTxId,
            0,
            `Driver credit failed for order #${order.id}`,
          )
          .catch((re) =>
            this.logger.error(
              `فشل عكس خصم الراكب tx #${debitTxId}: ${(re as Error).message}`,
            ),
          );
        this.logger.error(
          `Driver credit failed for order #${order.id} — تم عكس خصم الراكب`,
        );
        throw e;
      }
      return;
    }

    // 2) Gateway modes: open a Pending charge against the rider's card and
    //    let the webhook (rider-api /wallet/webhook/:gateway) credit the
    //    driver once the gateway confirms.
    const isGatewayMode =
      mode === PaymentMode.PaymentGateway ||
      mode === PaymentMode.SavedPaymentMethod;

    if (isGatewayMode) {
      // Default to HyperPay for SA — the AppConfig.gatewayConfig picker can
      // later route per region/method, but the choice doesn't change the
      // ledger flow (everything funnels through the same webhook).
      const gateway = PaymentGateway.HyperPay;
      const pending = await this.walletService.debit({
        ownerType: WalletOwnerType.Rider,
        ownerId: order.riderId,
        type: WalletTransactionType.TripPayment,
        amount: total,
        currency: order.currency,
        orderId: order.id,
        gateway,
        status: WalletTransactionStatus.Pending,
        description: `Trip payment via ${gateway} — order #${order.id}`,
        metadata: {
          driverId: order.driverId,
          driverNet,
          commission: platformCommission,
        },
      });

      try {
        const checkout = await this.paymentGatewayService.createCheckout(
          gateway,
          {
            amount: total,
            currency: order.currency,
            internalRef: String(pending.transactionId),
          },
        );
        await this.walletService.updateTransactionStatus(
          pending.transactionId,
          WalletTransactionStatus.Pending,
          {
            gatewayRef: checkout.gatewayRef,
            redirectUrl: checkout.redirectUrl,
          },
        );
        this.logger.log(
          `Gateway charge opened for order #${order.id} (tx #${pending.transactionId}, gw ref=${checkout.gatewayRef})`,
        );
      } catch (e) {
        // Mark the pending transaction failed so the webhook doesn't double-
        // charge if the gateway eventually replies anyway.
        await this.walletService.updateTransactionStatus(
          pending.transactionId,
          WalletTransactionStatus.Failed,
          { failureReason: (e as Error).message },
        );
        throw e;
      }
      return; // Driver is credited by the webhook on success.
    }

    // 3) Cash mode: السائق استلم النقد من الراكب مباشرة، لا نُحرّك محفظته.
    //    (Wallet عولج بالكامل في الفرع 1؛ Gateway عبر webhook في الفرع 2.)
    // (يُستحسن لاحقاً تسجيل معاملة informational للـ reporting في الوضع النقدي.)
  }

  private async getOrderOrThrow(orderId: number): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['rider'],
    });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    return order;
  }

  private async getAssignedOrder(
    driverId: number,
    orderId: number,
  ): Promise<OrderEntity> {
    const order = await this.getOrderOrThrow(orderId);
    if (order.driverId !== driverId) {
      throw new ForbiddenException('This order is not assigned to you');
    }
    return order;
  }

  private async getOrderWithRider(orderId: number): Promise<DriverOrderType> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['rider'],
    });
    if (!order) throw new NotFoundException('Order not found after update');
    return this.toType(order);
  }

  private toType(order: OrderEntity): DriverOrderType {
    const rider = (order as OrderEntity & { rider?: RiderEntity }).rider;
    return {
      id: order.id,
      type: order.type,
      status: order.status,
      riderId: order.riderId,
      riderName: rider ? `${rider.firstName ?? ''} ${rider.lastName ?? ''}`.trim() : undefined,
      riderPhone: order.numberMasked ? undefined : rider?.phoneNumber,
      riderRating: rider ? Number(rider.rating) : 5,
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
      familyMode: order.familyMode,
      preferFemaleDriver: order.preferFemaleDriver,
      // Phase H — driver-side awareness
      preferredDriverId: order.preferredDriverId,
      entitlementId: order.entitlementId,
      companyId: order.companyId,
      bookedHours: order.bookedHours,
      nightShift: order.nightShift,
      // ملاحظة أمنية: لا نُرسل otpCode للسائق في توصيل الأمانات —
      // المستلم يعرضه والسائق يُدخله عبر confirmDelivery لإثبات التسليم.
      otpCode: order.type === OrderType.ParcelDelivery ? undefined : order.otpCode,
      receiverName: order.receiverName,
      receiverPhone: order.numberMasked ? undefined : order.receiverPhone,
      isBidOrder: order.isBidOrder,
      etaPickup: order.etaPickup,
      startTimestamp: order.startTimestamp,
      finishTimestamp: order.finishTimestamp,
      createdOn: order.createdOn,
      shoppingList: order.shoppingList,
      budget: order.budget != null ? Number(order.budget) : undefined,
    };
  }
}
