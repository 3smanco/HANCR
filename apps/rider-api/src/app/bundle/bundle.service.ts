import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import {
  RideBundleEntity,
  RiderEntitlementEntity,
  WalletOwnerType,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@hancr/database';
import { WalletService } from '@hancr/wallet';
import {
  PurchaseResultType,
  RideBundleType,
  RiderEntitlementType,
} from './dto/bundle.types';

/**
 * منطق Ride Bundles — حزم رحلات مدفوعة مسبقاً.
 * - شراء حزمة: خصم من محفظة الراكب → إنشاء entitlement مع expires_at.
 * - استخدام: في createOrder، عند وجود entitlement active ومسافة ≤ maxDistanceKm،
 *   ندفع الرحلة من رصيد الرحلات (decrementUsage) بدل خصم سعر.
 */
@Injectable()
export class BundleService {
  private readonly logger = new Logger(BundleService.name);

  constructor(
    @InjectRepository(RideBundleEntity)
    private readonly bundleRepo: Repository<RideBundleEntity>,
    @InjectRepository(RiderEntitlementEntity)
    private readonly entRepo: Repository<RiderEntitlementEntity>,
    private readonly walletService: WalletService,
  ) {}

  async availableBundles(regionId: number): Promise<RideBundleType[]> {
    const rows = await this.bundleRepo.find({
      where: { active: true, regionId },
      order: { ridesCount: 'ASC' },
    });
    return rows.map((b) => this.toBundleType(b));
  }

  async myEntitlements(riderId: number): Promise<RiderEntitlementType[]> {
    // علّم منتهية الصلاحية أولاً
    await this.entRepo.update(
      { riderId, status: 'active', expiresAt: LessThan(new Date()) },
      { status: 'expired' },
    );
    const rows = await this.entRepo.find({
      where: { riderId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return rows.map((e) => this.toEntType(e));
  }

  async purchase(
    riderId: number,
    bundleId: number,
  ): Promise<PurchaseResultType> {
    const bundle = await this.bundleRepo.findOne({ where: { id: bundleId } });
    if (!bundle || !bundle.active) {
      throw new NotFoundException('Bundle not found or inactive');
    }

    // خصم من محفظة الراكب (يرمي InsufficientBalanceError لو الرصيد ناقص)
    try {
      await this.walletService.debit({
        ownerType: WalletOwnerType.Rider,
        ownerId: riderId,
        type: WalletTransactionType.TripPayment,
        amount: Number(bundle.price),
        currency: bundle.currency,
        status: WalletTransactionStatus.Completed,
        description: `Bundle purchase: ${bundle.name}`,
      });
    } catch (e) {
      throw new BadRequestException(
        (e as Error).message || 'Wallet debit failed',
      );
    }

    const expiresAt = new Date(
      Date.now() + bundle.validityDays * 86_400_000,
    );
    const saved = await this.entRepo.save(
      this.entRepo.create({
        riderId,
        bundleId: bundle.id,
        bundleName: bundle.name,
        ridesTotal: bundle.ridesCount,
        ridesRemaining: bundle.ridesCount,
        maxDistanceKm: Number(bundle.maxDistanceKm),
        expiresAt,
        amountPaid: Number(bundle.price),
        currency: bundle.currency,
        status: 'active',
      }),
    );

    const balance = await this.walletService.getBalance(
      WalletOwnerType.Rider,
      riderId,
    );
    this.logger.log(
      `Rider #${riderId} purchased bundle #${bundle.id} (${bundle.ridesCount} rides)`,
    );

    return {
      success: true,
      entitlement: this.toEntType(saved),
      newWalletBalance: balance.balance,
    };
  }

  /**
   * يُستدعى من order.service.createOrder للتحقق من توفّر entitlement.
   * يُرجع الأكثر قُرباً من الانتهاء أولاً (لاستخدام الأقدم).
   */
  async findUsableEntitlement(
    riderId: number,
    distanceMeters: number,
  ): Promise<RiderEntitlementEntity | null> {
    const distanceKm = distanceMeters / 1000;
    const rows = await this.entRepo.find({
      where: {
        riderId,
        status: 'active',
        expiresAt: MoreThan(new Date()),
        ridesRemaining: MoreThan(0),
      },
      order: { expiresAt: 'ASC' },
    });
    for (const e of rows) {
      const maxKm = Number(e.maxDistanceKm);
      if (maxKm === 0 || distanceKm <= maxKm) return e;
    }
    return null;
  }

  /** يخصم رحلة واحدة. يُستدعى بعد نجاح createOrder. */
  async decrementUsage(entitlementId: number): Promise<void> {
    await this.entRepo.decrement(
      { id: entitlementId },
      'ridesRemaining',
      1,
    );
    // لو نفدت، علّمها exhausted
    const row = await this.entRepo.findOne({ where: { id: entitlementId } });
    if (row && row.ridesRemaining <= 0) {
      await this.entRepo.update(entitlementId, { status: 'exhausted' });
    }
  }

  private toBundleType(b: RideBundleEntity): RideBundleType {
    return {
      id: b.id,
      name: b.name,
      ridesCount: b.ridesCount,
      price: Number(b.price),
      currency: b.currency,
      validityDays: b.validityDays,
      maxDistanceKm: Number(b.maxDistanceKm),
      regionId: b.regionId,
      active: b.active,
    };
  }

  private toEntType(e: RiderEntitlementEntity): RiderEntitlementType {
    return {
      id: e.id,
      bundleId: e.bundleId,
      bundleName: e.bundleName,
      ridesTotal: e.ridesTotal,
      ridesRemaining: e.ridesRemaining,
      maxDistanceKm: Number(e.maxDistanceKm),
      expiresAt: e.expiresAt,
      amountPaid: Number(e.amountPaid),
      currency: e.currency,
      status: e.status,
      createdAt: e.createdAt,
    };
  }
}
