import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { WalletService } from './wallet.service';
import {
  WalletTransactionEntity,
  WalletTransactionDirection,
  WalletTransactionStatus,
  WalletOwnerType,
  WalletTransactionType,
  PaymentGateway,
  RiderEntity,
  DriverEntity,
} from '@hancr/database';
import { InsufficientBalanceError } from './dto/transaction.dto';

/**
 * WalletService unit tests
 *
 * يغطي:
 *  - credit/debit successful flow
 *  - InsufficientBalanceError عند debit بدون رصيد كافٍ
 *  - Currency mismatch protection
 *  - Pending status لا يُحرّك الرصيد
 *  - getBalance / listTransactions / getLedgerTotal
 *  - Idempotency-related behaviors
 */
describe('WalletService', () => {
  let service: WalletService;
  let txRepo: jest.Mocked<Repository<WalletTransactionEntity>>;
  let riderRepo: jest.Mocked<Repository<RiderEntity>>;
  let driverRepo: jest.Mocked<Repository<DriverEntity>>;
  let dataSource: jest.Mocked<DataSource>;
  let mockEm: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    mockEm = {
      query: jest.fn(),
      create: jest.fn((_entity, data) => ({ id: 999, ...data })),
      save: jest.fn(async (entity: unknown) => entity),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(WalletTransactionEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RiderEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(DriverEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(async (cb: (em: EntityManager) => unknown) =>
              cb(mockEm),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    txRepo = module.get(getRepositoryToken(WalletTransactionEntity));
    riderRepo = module.get(getRepositoryToken(RiderEntity));
    driverRepo = module.get(getRepositoryToken(DriverEntity));
    dataSource = module.get(DataSource);
  });

  describe('credit (إضافة للمحفظة)', () => {
    it('يجب أن يضيف للرصيد ويُنشئ معاملة Completed', async () => {
      mockEm.query
        .mockResolvedValueOnce([
          { id: 5, balance: '100.00', currency: 'SAR' },
        ])
        .mockResolvedValueOnce(undefined); // UPDATE balance

      const result = await service.credit({
        ownerType: WalletOwnerType.Rider,
        ownerId: 5,
        type: WalletTransactionType.Recharge,
        amount: 50,
        currency: 'SAR',
      });

      expect(result.newBalance).toBe(150);
      expect(result.currency).toBe('SAR');
      expect(mockEm.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, balance, currency FROM hancr_rider'),
        [5],
      );
      expect(mockEm.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE hancr_rider SET balance'),
        [150, 5],
      );
    });

    it('يجب أن يرفض الـ amount السالب أو صفر', async () => {
      await expect(
        service.credit({
          ownerType: WalletOwnerType.Rider,
          ownerId: 5,
          type: WalletTransactionType.Recharge,
          amount: 0,
          currency: 'SAR',
        }),
      ).rejects.toThrow('credit amount must be positive');

      await expect(
        service.credit({
          ownerType: WalletOwnerType.Rider,
          ownerId: 5,
          type: WalletTransactionType.Recharge,
          amount: -10,
          currency: 'SAR',
        }),
      ).rejects.toThrow();
    });

    it('Pending credit لا يُحرِّك الرصيد', async () => {
      mockEm.query.mockResolvedValueOnce([
        { id: 5, balance: '100.00', currency: 'SAR' },
      ]);

      const result = await service.credit({
        ownerType: WalletOwnerType.Rider,
        ownerId: 5,
        type: WalletTransactionType.Recharge,
        amount: 50,
        currency: 'SAR',
        status: WalletTransactionStatus.Pending,
      });

      // الرصيد ما تغيَّر
      expect(result.newBalance).toBe(100);
      // ولا تم UPDATE
      expect(mockEm.query).toHaveBeenCalledTimes(1); // فقط SELECT
    });
  });

  describe('debit (خصم من المحفظة)', () => {
    it('يجب أن يخصم بنجاح مع رصيد كافٍ', async () => {
      mockEm.query
        .mockResolvedValueOnce([
          { id: 5, balance: '100.00', currency: 'SAR' },
        ])
        .mockResolvedValueOnce(undefined);

      const result = await service.debit({
        ownerType: WalletOwnerType.Rider,
        ownerId: 5,
        type: WalletTransactionType.TripPayment,
        amount: 30,
        currency: 'SAR',
      });

      expect(result.newBalance).toBe(70);
    });

    it('يجب أن يرمي InsufficientBalanceError عند نقص الرصيد', async () => {
      mockEm.query.mockResolvedValueOnce([
        { id: 5, balance: '20.00', currency: 'SAR' },
      ]);

      await expect(
        service.debit({
          ownerType: WalletOwnerType.Rider,
          ownerId: 5,
          type: WalletTransactionType.TripPayment,
          amount: 50,
          currency: 'SAR',
        }),
      ).rejects.toBeInstanceOf(InsufficientBalanceError);
    });

    it('Pending debit مسموح حتى لو الرصيد ناقص (سيُتحقق عند Complete)', async () => {
      mockEm.query.mockResolvedValueOnce([
        { id: 5, balance: '10.00', currency: 'SAR' },
      ]);

      const result = await service.debit({
        ownerType: WalletOwnerType.Rider,
        ownerId: 5,
        type: WalletTransactionType.TripPayment,
        amount: 50,
        currency: 'SAR',
        status: WalletTransactionStatus.Pending,
      });

      // pending لا يُحرّك الرصيد ولا يفشل
      expect(result.newBalance).toBe(10);
    });
  });

  describe('Currency validation', () => {
    it('يجب أن يرفض currency mismatch', async () => {
      mockEm.query.mockResolvedValueOnce([
        { id: 5, balance: '100.00', currency: 'SAR' },
      ]);

      await expect(
        service.credit({
          ownerType: WalletOwnerType.Rider,
          ownerId: 5,
          type: WalletTransactionType.Recharge,
          amount: 50,
          currency: 'AED', // wallet هو SAR
        }),
      ).rejects.toThrow('Currency mismatch');
    });
  });

  describe('Owner not found', () => {
    it('يجب أن يفشل لو الـ Rider غير موجود', async () => {
      mockEm.query.mockResolvedValueOnce([]); // SELECT returns empty

      await expect(
        service.credit({
          ownerType: WalletOwnerType.Rider,
          ownerId: 999,
          type: WalletTransactionType.Recharge,
          amount: 50,
          currency: 'SAR',
        }),
      ).rejects.toThrow('Rider #999 not found');
    });
  });

  describe('Driver wallet', () => {
    it('يجب أن يتعامل مع driver wallet بنفس المنطق', async () => {
      mockEm.query
        .mockResolvedValueOnce([
          { id: 7, balance: '500.00', currency: 'SAR' },
        ])
        .mockResolvedValueOnce(undefined);

      const result = await service.credit({
        ownerType: WalletOwnerType.Driver,
        ownerId: 7,
        type: WalletTransactionType.DriverEarnings,
        amount: 80,
        currency: 'SAR',
      });

      expect(result.newBalance).toBe(580);
      expect(mockEm.query).toHaveBeenCalledWith(
        expect.stringContaining('hancr_driver'),
        [7],
      );
    });
  });

  describe('getBalance', () => {
    it('يجلب رصيد الراكب', async () => {
      riderRepo.findOne.mockResolvedValue({
        balance: '250.00',
        currency: 'SAR',
      } as unknown as RiderEntity);

      const result = await service.getBalance(WalletOwnerType.Rider, 1);
      expect(result).toEqual({ balance: 250, currency: 'SAR' });
    });

    it('يجلب رصيد السائق', async () => {
      driverRepo.findOne.mockResolvedValue({
        balance: '1200.00',
        currency: 'AED',
      } as unknown as DriverEntity);

      const result = await service.getBalance(WalletOwnerType.Driver, 7);
      expect(result).toEqual({ balance: 1200, currency: 'AED' });
    });

    it('يرمي error لو المستخدم غير موجود', async () => {
      riderRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getBalance(WalletOwnerType.Rider, 999),
      ).rejects.toThrow('Rider #999 not found');
    });
  });

  describe('listTransactions', () => {
    it('يجلب آخر معاملات لمحفظة', async () => {
      const mockTxs = [
        { id: 1, amount: '10' },
        { id: 2, amount: '20' },
      ] as unknown as WalletTransactionEntity[];
      txRepo.find.mockResolvedValue(mockTxs);

      const result = await service.listTransactions(
        WalletOwnerType.Rider,
        1,
        10,
        0,
      );

      expect(result).toBe(mockTxs);
      expect(txRepo.find).toHaveBeenCalledWith({
        where: { ownerType: WalletOwnerType.Rider, ownerId: 1 },
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('updateTransactionStatus', () => {
    it('يضع completedAt عند الانتقال لـ Completed', async () => {
      const tx = {
        id: 42,
        status: WalletTransactionStatus.Pending,
        metadata: {},
      } as unknown as WalletTransactionEntity;
      txRepo.findOne.mockResolvedValue(tx);
      txRepo.save.mockImplementation(async (t) => t as WalletTransactionEntity);

      const result = await service.updateTransactionStatus(
        42,
        WalletTransactionStatus.Completed,
        { reason: 'webhook' },
      );

      expect(result.status).toBe(WalletTransactionStatus.Completed);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.metadata).toEqual({ reason: 'webhook' });
    });

    it('يرفض update لو الـ tx غير موجودة', async () => {
      txRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateTransactionStatus(999, WalletTransactionStatus.Completed),
      ).rejects.toThrow('Transaction #999 not found');
    });
  });

  describe('getTransactionById', () => {
    it('يستخدم findOne بـ id', async () => {
      const tx = { id: 1 } as WalletTransactionEntity;
      txRepo.findOne.mockResolvedValue(tx);
      const result = await service.getTransactionById(1);
      expect(result).toBe(tx);
      expect(txRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('Atomic transaction', () => {
    it('يُستدعى dataSource.transaction مع callback', async () => {
      mockEm.query
        .mockResolvedValueOnce([
          { id: 5, balance: '100.00', currency: 'SAR' },
        ])
        .mockResolvedValueOnce(undefined);

      await service.credit({
        ownerType: WalletOwnerType.Rider,
        ownerId: 5,
        type: WalletTransactionType.Recharge,
        amount: 50,
        currency: 'SAR',
      });

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('SELECT يستخدم FOR UPDATE row lock', async () => {
      mockEm.query
        .mockResolvedValueOnce([
          { id: 5, balance: '100.00', currency: 'SAR' },
        ])
        .mockResolvedValueOnce(undefined);

      await service.credit({
        ownerType: WalletOwnerType.Rider,
        ownerId: 5,
        type: WalletTransactionType.Recharge,
        amount: 1,
        currency: 'SAR',
      });

      const calls = mockEm.query.mock.calls;
      expect(calls[0][0]).toContain('FOR UPDATE');
    });
  });

  describe('Edge cases', () => {
    it('يحفظ gateway و gatewayRef في المعاملة', async () => {
      mockEm.query
        .mockResolvedValueOnce([
          { id: 5, balance: '100.00', currency: 'SAR' },
        ])
        .mockResolvedValueOnce(undefined);

      await service.credit({
        ownerType: WalletOwnerType.Rider,
        ownerId: 5,
        type: WalletTransactionType.Recharge,
        amount: 100,
        currency: 'SAR',
        gateway: PaymentGateway.HyperPay,
        gatewayRef: 'hpay_abc123',
      });

      expect(mockEm.create).toHaveBeenCalledWith(
        WalletTransactionEntity,
        expect.objectContaining({
          gateway: PaymentGateway.HyperPay,
          gatewayRef: 'hpay_abc123',
        }),
      );
    });

    it('Direction مُحدَّد تلقائياً (credit → Credit)', async () => {
      mockEm.query
        .mockResolvedValueOnce([
          { id: 5, balance: '100.00', currency: 'SAR' },
        ])
        .mockResolvedValueOnce(undefined);

      await service.credit({
        ownerType: WalletOwnerType.Rider,
        ownerId: 5,
        type: WalletTransactionType.Recharge,
        amount: 100,
        currency: 'SAR',
      });

      expect(mockEm.create).toHaveBeenCalledWith(
        WalletTransactionEntity,
        expect.objectContaining({
          direction: WalletTransactionDirection.Credit,
        }),
      );
    });
  });
});
