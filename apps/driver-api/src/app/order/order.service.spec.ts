import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { OrderService } from './order.service';
import {
  OrderEntity,
  DriverEntity,
  RiderEntity,
  RequestActivityEntity,
  OrderStatus,
  DriverStatus,
  PaymentMode,
  PaymentGateway,
  WalletOwnerType,
  WalletTransactionType,
} from '@hancr/database';
import { DriverRedisService, OrderRedisService } from '@hancr/redis';
import { PushNotificationService } from '@hancr/notifications';
import {
  WalletService,
  InsufficientBalanceError,
  PaymentGatewayService,
} from '@hancr/wallet';
import { SosService } from '@hancr/sos';
import { PUB_SUB } from '../pubsub.provider';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepo: jest.Mocked<Repository<OrderEntity>>;
  let driverRepo: jest.Mocked<Repository<DriverEntity>>;
  let riderRepo: jest.Mocked<Repository<RiderEntity>>;
  let activityRepo: jest.Mocked<Repository<RequestActivityEntity>>;
  let driverRedis: jest.Mocked<DriverRedisService>;
  let orderRedis: jest.Mocked<OrderRedisService>;
  let pushNotifications: jest.Mocked<PushNotificationService>;
  let walletService: jest.Mocked<WalletService>;
  let paymentGatewayService: jest.Mocked<PaymentGatewayService>;
  let sosService: jest.Mocked<SosService>;
  let pubSub: jest.Mocked<RedisPubSub>;

  const makeOrder = (overrides: Partial<OrderEntity> = {}): OrderEntity =>
    ({
      id: 1,
      riderId: 5,
      driverId: 7,
      status: OrderStatus.Found,
      paymentMode: PaymentMode.Cash,
      costBest: 50,
      costAfterCoupon: 50,
      providerShare: 10,
      currency: 'SAR',
      points: [
        { lat: 24.7, lng: 46.6 },
        { lat: 24.8, lng: 46.7 },
      ],
      addresses: ['Origin', 'Destination'],
      ...overrides,
    } as unknown as OrderEntity);

  const makeDriver = (overrides: Partial<DriverEntity> = {}): DriverEntity =>
    ({
      id: 7,
      firstName: 'محمد',
      lastName: 'السائق',
      plateNumber: 'ABC 123',
      active: true,
      banned: false,
      status: DriverStatus.Online,
      ...overrides,
    } as unknown as DriverEntity);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DriverEntity),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RiderEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RequestActivityEntity),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn(),
          },
        },
        {
          provide: DriverRedisService,
          useValue: { setStatus: jest.fn() },
        },
        {
          provide: OrderRedisService,
          useValue: { removeOrder: jest.fn() },
        },
        {
          provide: PushNotificationService,
          useValue: { sendToToken: jest.fn() },
        },
        {
          provide: WalletService,
          useValue: {
            credit: jest.fn(),
            debit: jest.fn(),
            reverseTransaction: jest.fn(),
            updateTransactionStatus: jest.fn(),
          },
        },
        {
          provide: PaymentGatewayService,
          useValue: {
            createCheckout: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              ({
                PAYMENT_WEBHOOK_URL:
                  'https://api.hancr.test/rider/wallet/webhook/{gateway}',
                PUBLIC_BASE_URL: 'https://hancr.test',
              })[key],
            ),
          },
        },
        {
          provide: SosService,
          useValue: {
            shareTripWithContacts: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: PUB_SUB,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepo = module.get(getRepositoryToken(OrderEntity));
    driverRepo = module.get(getRepositoryToken(DriverEntity));
    riderRepo = module.get(getRepositoryToken(RiderEntity));
    activityRepo = module.get(getRepositoryToken(RequestActivityEntity));
    driverRedis = module.get(DriverRedisService);
    orderRedis = module.get(OrderRedisService);
    pushNotifications = module.get(PushNotificationService);
    walletService = module.get(WalletService);
    paymentGatewayService = module.get(PaymentGatewayService);
    sosService = module.get(SosService);
    pubSub = module.get(PUB_SUB);

    // افتراضي: getOrderWithRider يُرجع order مع تفاصيل rider
    orderRepo.findOne.mockImplementation(async ({ where }) => {
      const w = where as { id?: number; driverId?: number; status?: OrderStatus };
      if (w.id) return makeOrder({ id: w.id });
      return null;
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('acceptOrder', () => {
    beforeEach(() => {
      orderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.Found }));
      driverRepo.findOne.mockResolvedValue(makeDriver());
      // القبول الآن تحديث مشروط ذرّي يُرجع affected
      orderRepo.update.mockResolvedValue({ affected: 1 } as never);
    });

    it('يقبل الطلب ويُحدِّث الحالة + يضع ETA (تحديث مشروط على Found)', async () => {
      await service.acceptOrder(7, 1);

      expect(orderRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, status: OrderStatus.Found }),
        expect.objectContaining({
          status: OrderStatus.DriverAccepted,
          driverId: 7,
        }),
      );
    });

    it('يرفض لو سبق قبول الطلب من سائق آخر (affected=0)', async () => {
      orderRepo.update.mockResolvedValue({ affected: 0 } as never);
      await expect(service.acceptOrder(7, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('يحدِّث حالة السائق إلى Busy في DB و Redis', async () => {
      await service.acceptOrder(7, 1);

      expect(driverRepo.update).toHaveBeenCalledWith(7, {
        status: DriverStatus.Busy,
      });
      expect(driverRedis.setStatus).toHaveBeenCalledWith(7, 'Busy');
    });

    it('يُزيل الطلب من Redis (لمنع سائقين آخرين من رؤيته)', async () => {
      await service.acceptOrder(7, 1);
      expect(orderRedis.removeOrder).toHaveBeenCalledWith(1);
    });

    it('يرفض لو حالة الطلب ليست Found', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.DriverAccepted }),
      );

      await expect(service.acceptOrder(7, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('يرفض لو السائق غير موجود', async () => {
      driverRepo.findOne.mockResolvedValue(null);
      await expect(service.acceptOrder(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('يرفض لو السائق محظور', async () => {
      driverRepo.findOne.mockResolvedValue(makeDriver({ banned: true }));
      await expect(service.acceptOrder(7, 1)).rejects.toThrow(ForbiddenException);
    });

    it('يرفض لو السائق غير نشط', async () => {
      driverRepo.findOne.mockResolvedValue(makeDriver({ active: false }));
      await expect(service.acceptOrder(7, 1)).rejects.toThrow(ForbiddenException);
    });

    it('يُرسل GraphQL subscription event', async () => {
      await service.acceptOrder(7, 1);
      expect(pubSub.publish).toHaveBeenCalledWith(
        'DRIVER_ORDER_UPDATED',
        expect.any(Object),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('arrivedAtPickup', () => {
    it('ينقل الحالة من DriverAccepted إلى Arrived', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.DriverAccepted }),
      );
      await service.arrivedAtPickup(7, 1);
      expect(orderRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: OrderStatus.Arrived }),
      );
    });

    it('يرفض لو الحالة ليست DriverAccepted', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.Started }),
      );
      await expect(service.arrivedAtPickup(7, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('startRide', () => {
    beforeEach(() => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.Arrived }),
      );
    });

    it('ينقل الحالة إلى Started + يضع startTimestamp', async () => {
      await service.startRide(7, 1);
      expect(orderRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: OrderStatus.Started,
          startTimestamp: expect.any(Date),
        }),
      );
    });

    it('يستدعي trip sharing عبر SosService', async () => {
      await service.startRide(7, 1);
      // الـ shareTripWithContacts غير متزامن (fire-and-forget)
      await new Promise((r) => setTimeout(r, 50));
      expect(sosService.shareTripWithContacts).toHaveBeenCalled();
    });

    it('يرفض لو الحالة ليست Arrived', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.Found }),
      );
      await expect(service.startRide(7, 1)).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('finishRide — payment settlement', () => {
    it('Cash payment: يحفظ نهاية الرحلة بدون خصم من الراكب', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({
          status: OrderStatus.Started,
          paymentMode: PaymentMode.Cash,
        }),
      );

      await service.finishRide(7, 1);

      // ما تم خصم من الراكب
      expect(walletService.debit).not.toHaveBeenCalled();
      // ولا credit للسائق (Cash → driver got paid directly)
      expect(walletService.credit).not.toHaveBeenCalled();
    });

    it('Wallet payment: يخصم من الراكب ويُضيف للسائق (- commission)', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({
          status: OrderStatus.Started,
          paymentMode: PaymentMode.Wallet,
          costAfterCoupon: 100,
          providerShare: 20,
        }),
      );
      walletService.debit.mockResolvedValue({
        transactionId: 1,
        newBalance: 0,
        currency: 'SAR',
      });
      walletService.credit.mockResolvedValue({
        transactionId: 2,
        newBalance: 80,
        currency: 'SAR',
      });

      await service.finishRide(7, 1);

      // Debit الراكب بالكامل (100)
      expect(walletService.debit).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerType: WalletOwnerType.Rider,
          ownerId: 5,
          type: WalletTransactionType.TripPayment,
          amount: 100,
        }),
      );

      // Credit السائق بـ (100 - 20 commission) = 80
      expect(walletService.credit).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerType: WalletOwnerType.Driver,
          ownerId: 7,
          type: WalletTransactionType.DriverEarnings,
          amount: 80,
        }),
      );
    });

    it('Wallet payment: InsufficientBalance لا رحلة مجانية — ينقل لـ WaitingForPostPay بلا credit', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({
          status: OrderStatus.Started,
          paymentMode: PaymentMode.Wallet,
        }),
      );
      walletService.debit.mockRejectedValue(
        new InsufficientBalanceError(10, 50, 'SAR'),
      );

      const result = await service.finishRide(7, 1);

      expect(result).toBeDefined();
      // لا يُدفع للسائق عند رصيد ناقص
      expect(walletService.credit).not.toHaveBeenCalled();
      // الطلب يُنقل لانتظار الدفع (يمنع إكمال الرحلة مجاناً)
      expect(orderRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: OrderStatus.WaitingForPostPay }),
      );
    });

    it('Wallet payment: فشل إيداع السائق بعد خصم الراكب → يعكس خصم الراكب', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({
          status: OrderStatus.Started,
          paymentMode: PaymentMode.Wallet,
          costAfterCoupon: 100,
          providerShare: 20,
        }),
      );
      walletService.debit.mockResolvedValue({
        transactionId: 42,
        newBalance: 0,
        currency: 'SAR',
      });
      walletService.credit.mockRejectedValue(new Error('credit failed'));
      walletService.reverseTransaction.mockResolvedValue(
        {} as never,
      );

      // _settlePayment محاط بـ try/catch في finishRide فلا يرمي
      const result = await service.finishRide(7, 1);
      expect(result).toBeDefined();

      // تم عكس خصم الراكب (tx #42) حتى لا يُخصم بلا دفع السائق
      expect(walletService.reverseTransaction).toHaveBeenCalledWith(
        42,
        expect.any(Number),
        expect.any(String),
      );
    });

    it('PaymentGateway: يفتح خصماً Pending على الراكب ويترك إيداع السائق للـ webhook', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({
          status: OrderStatus.Started,
          paymentMode: PaymentMode.PaymentGateway,
          costAfterCoupon: 100,
          providerShare: 25,
        }),
      );
      walletService.debit.mockResolvedValue({
        transactionId: 9,
        newBalance: 0,
        currency: 'SAR',
      });
      paymentGatewayService.createCheckout.mockResolvedValue({
        gatewayRef: 'gw_1',
        redirectUrl: 'https://pay',
        gateway: PaymentGateway.HyperPay,
      });

      await service.finishRide(7, 1);

      // خصم Pending على الراكب يحمل بيانات السائق (للـ webhook)
      expect(walletService.debit).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerType: WalletOwnerType.Rider,
          status: 'Pending',
        }),
      );
      expect(paymentGatewayService.createCheckout).toHaveBeenCalledWith(
        PaymentGateway.HyperPay,
        expect.objectContaining({
          internalRef: '9',
          webhookUrl:
            'https://api.hancr.test/rider/wallet/webhook/hyperpay',
          returnUrl: 'https://hancr.test',
        }),
      );
      // لا يُدفع للسائق synchronously — الـ webhook يفعل ذلك بعد تأكيد البوابة
      expect(walletService.credit).not.toHaveBeenCalled();
    });

    it('السائق يعود لـ Online بعد انتهاء الرحلة', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.Started }),
      );
      await service.finishRide(7, 1);
      expect(driverRepo.update).toHaveBeenCalledWith(7, {
        status: DriverStatus.Online,
      });
      expect(driverRedis.setStatus).toHaveBeenCalledWith(7, 'Online');
    });

    it('يرفض لو الحالة ليست Started', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.Arrived }),
      );
      await expect(service.finishRide(7, 1)).rejects.toThrow(BadRequestException);
    });

    it('Settlement failure لا يكسر الرحلة', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({
          status: OrderStatus.Started,
          paymentMode: PaymentMode.Wallet,
        }),
      );
      walletService.debit.mockRejectedValue(new Error('DB connection error'));

      // لا يجب أن يرمي — _settlePayment محاط بـ try/catch
      const result = await service.finishRide(7, 1);
      expect(result).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('cancelOrder', () => {
    it('يلغي order في حالة DriverAccepted', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.DriverAccepted }),
      );

      await service.cancelOrder(7, 1);

      expect(orderRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: OrderStatus.DriverCanceled }),
      );
      expect(driverRepo.update).toHaveBeenCalledWith(7, {
        status: DriverStatus.Online,
      });
    });

    it('يلغي order في حالة Arrived', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.Arrived }),
      );
      await service.cancelOrder(7, 1);
      expect(orderRepo.update).toHaveBeenCalled();
    });

    it('يرفض الإلغاء بعد بدء الرحلة', async () => {
      orderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.Started }),
      );
      await expect(service.cancelOrder(7, 1)).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('getActiveOrder', () => {
    it('يجلب طلب نشط حسب الأولوية', async () => {
      const activeOrder = makeOrder({ status: OrderStatus.Started });
      orderRepo.findOne
        .mockResolvedValueOnce(null) // DriverAccepted
        .mockResolvedValueOnce(null) // Arrived
        .mockResolvedValueOnce(activeOrder); // Started
      driverRepo.findOne.mockResolvedValue(makeDriver());

      const result = await service.getActiveOrder(7);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });

    it('يُرجع null لو لا يوجد طلب نشط', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      const result = await service.getActiveOrder(7);
      expect(result).toBeNull();
    });
  });
});
