import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import {
  PoolEntity,
  PoolMemberEntity,
  RiderEntity,
} from '@hancr/database';
import { PoolType as PoolTypeEnum } from '@hancr/database';
import { PoolType, PoolMemberType } from './dto/pool.type';

/**
 * المجموعة العائلية: إنشاء، دعوة أعضاء بالهاتف، حدود إنفاق شهرية.
 * الإنفاق الشهري يُتتبَّع في Redis بمفتاح شهري (يُصفَّر تلقائياً كل شهر)،
 * فلا حاجة لكتابة DB في مسار الطلب الساخن ولا لمنطق تصفير يدوي.
 */
@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name);

  constructor(
    @InjectRepository(PoolEntity)
    private readonly poolRepo: Repository<PoolEntity>,
    @InjectRepository(PoolMemberEntity)
    private readonly memberRepo: Repository<PoolMemberEntity>,
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private spendKey(memberId: number): string {
    const now = new Date();
    const ym = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    return `hancr:pool:spend:${memberId}:${ym}`;
  }

  private async getSpend(memberId: number): Promise<number> {
    const v = await this.redis.get(this.spendKey(memberId));
    return v ? Number(v) : 0;
  }

  // ─────────────────────────────────────────────
  // قراءة المجموعة (مملوكة أو عضوية)
  // ─────────────────────────────────────────────
  async getMyPool(riderId: number): Promise<PoolType | null> {
    // المجموعة التي يملكها الراكب لها الأولوية
    let pool = await this.poolRepo.findOne({
      where: { ownerId: riderId, active: true },
      relations: ['members'],
    });

    if (!pool) {
      // أو مجموعة هو عضو فيها
      const membership = await this.memberRepo.findOne({
        where: { riderId, active: true },
        relations: ['pool', 'pool.members'],
      });
      pool = membership?.pool ?? null;
    }
    if (!pool || !pool.active) return null;

    return this.toPoolType(pool, riderId);
  }

  private async toPoolType(
    pool: PoolEntity,
    viewerId: number,
  ): Promise<PoolType> {
    const members = (pool.members ?? []).filter((m) => m.active);
    const riderIds = members.map((m) => m.riderId);
    const riders = riderIds.length
      ? await this.riderRepo.find({ where: riderIds.map((id) => ({ id })) })
      : [];
    const byId = new Map(riders.map((r) => [r.id, r]));

    const memberTypes: PoolMemberType[] = await Promise.all(
      members.map(async (m) => {
        const r = byId.get(m.riderId);
        const name = r
          ? [r.firstName, r.lastName].filter(Boolean).join(' ') || r.phoneNumber
          : undefined;
        return {
          id: m.id,
          riderId: m.riderId,
          riderName: name,
          phone: r?.phoneNumber,
          role: m.riderId === pool.ownerId ? 'owner' : 'member',
          monthlySpendLimit:
            m.monthlySpendLimit != null ? Number(m.monthlySpendLimit) : undefined,
          currentMonthSpend: await this.getSpend(m.id),
          joinedAt: m.createdAt,
        };
      }),
    );

    return {
      id: pool.id,
      name: pool.name,
      type: pool.poolType,
      ownerId: pool.ownerId,
      active: pool.active,
      isOwner: pool.ownerId === viewerId,
      members: memberTypes,
      createdAt: pool.createdAt,
    };
  }

  // ─────────────────────────────────────────────
  // إنشاء مجموعة عائلية
  // ─────────────────────────────────────────────
  async createFamily(ownerId: number, name: string): Promise<PoolType> {
    const existing = await this.poolRepo.findOne({
      where: { ownerId, active: true },
    });
    if (existing) {
      throw new ForbiddenException('لديك مجموعة عائلية بالفعل.');
    }
    const owner = await this.riderRepo.findOne({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('Account not found');

    const pool = await this.poolRepo.save(
      this.poolRepo.create({
        name: name?.trim()?.slice(0, 100) || 'عائلتي',
        poolType: PoolTypeEnum.Family,
        currency: owner.currency || 'QAR',
        balance: 0,
        active: true,
        ownerId,
      }),
    );
    // المالك عضو في مجموعته
    await this.memberRepo.save(
      this.memberRepo.create({ poolId: pool.id, riderId: ownerId, active: true }),
    );
    const full = await this.poolRepo.findOne({
      where: { id: pool.id },
      relations: ['members'],
    });
    return this.toPoolType(full!, ownerId);
  }

  // ─────────────────────────────────────────────
  // دعوة عضو بالهاتف (المالك فقط)
  // ─────────────────────────────────────────────
  async inviteMember(
    ownerId: number,
    phone: string,
    monthlySpendLimit?: number,
  ): Promise<PoolType> {
    const pool = await this.ownedPool(ownerId);
    const invitee = await this.riderRepo.findOne({
      where: { phoneNumber: phone.trim() },
    });
    if (!invitee) {
      throw new NotFoundException('لا يوجد مستخدم HANCR بهذا الرقم. اطلب منه التسجيل أولاً.');
    }
    if (invitee.id === ownerId) {
      throw new ForbiddenException('أنت مالك المجموعة بالفعل.');
    }
    // عضو في مجموعة أخرى؟
    const other = await this.memberRepo.findOne({
      where: { riderId: invitee.id, active: true },
    });
    if (other && other.poolId !== pool.id) {
      throw new ForbiddenException('هذا المستخدم عضو في مجموعة أخرى.');
    }
    const existing = await this.memberRepo.findOne({
      where: { poolId: pool.id, riderId: invitee.id },
    });
    if (existing) {
      await this.memberRepo.update(existing.id, {
        active: true,
        monthlySpendLimit: monthlySpendLimit ?? existing.monthlySpendLimit,
      });
    } else {
      await this.memberRepo.save(
        this.memberRepo.create({
          poolId: pool.id,
          riderId: invitee.id,
          active: true,
          monthlySpendLimit: monthlySpendLimit ?? undefined,
        }),
      );
    }
    return this.getMyPool(ownerId) as Promise<PoolType>;
  }

  async updateMemberLimit(
    ownerId: number,
    memberId: number,
    monthlySpendLimit?: number,
  ): Promise<PoolType> {
    const pool = await this.ownedPool(ownerId);
    const member = await this.memberRepo.findOne({
      where: { id: memberId, poolId: pool.id },
    });
    if (!member) throw new NotFoundException('العضو غير موجود.');
    await this.memberRepo.update(member.id, {
      monthlySpendLimit: monthlySpendLimit ?? undefined,
    });
    return this.getMyPool(ownerId) as Promise<PoolType>;
  }

  async removeMember(ownerId: number, memberId: number): Promise<PoolType> {
    const pool = await this.ownedPool(ownerId);
    const member = await this.memberRepo.findOne({
      where: { id: memberId, poolId: pool.id },
    });
    if (!member) throw new NotFoundException('العضو غير موجود.');
    if (member.riderId === ownerId) {
      throw new ForbiddenException('لا يمكن إزالة مالك المجموعة. احذف المجموعة بدلاً من ذلك.');
    }
    await this.memberRepo.update(member.id, { active: false });
    return this.getMyPool(ownerId) as Promise<PoolType>;
  }

  /** يغادر العضو المجموعة (غير المالك) */
  async leaveFamily(riderId: number): Promise<boolean> {
    const membership = await this.memberRepo.findOne({
      where: { riderId, active: true },
      relations: ['pool'],
    });
    if (!membership) return true;
    if (membership.pool?.ownerId === riderId) {
      throw new ForbiddenException('أنت المالك — احذف المجموعة بدلاً من المغادرة.');
    }
    await this.memberRepo.update(membership.id, { active: false });
    return true;
  }

  /** يحذف المالك مجموعته (يلغّي تفعيلها وكل أعضائها) */
  async deleteFamily(ownerId: number): Promise<boolean> {
    const pool = await this.poolRepo.findOne({
      where: { ownerId, active: true },
    });
    if (!pool) return true;
    await this.memberRepo.update({ poolId: pool.id }, { active: false });
    await this.poolRepo.update(pool.id, { active: false });
    return true;
  }

  private async ownedPool(ownerId: number): Promise<PoolEntity> {
    const pool = await this.poolRepo.findOne({
      where: { ownerId, active: true },
    });
    if (!pool) throw new NotFoundException('لا تملك مجموعة عائلية.');
    return pool;
  }

  // ─────────────────────────────────────────────
  // فرض حدود الإنفاق (يُستدعى من order.service)
  // ─────────────────────────────────────────────
  /**
   * يتحقق أن طلباً بقيمة `amount` لا يتجاوز حدّ الإنفاق الشهري للعضو.
   * لا يؤثر على الركاب الذين ليسوا أعضاءً أو بلا حدّ مضبوط.
   * يرمي ForbiddenException عند التجاوز.
   */
  async assertWithinSpendLimit(riderId: number, amount: number): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { riderId, active: true },
    });
    if (!member || member.monthlySpendLimit == null) return; // لا حدّ
    // المالك غير مقيَّد
    const pool = await this.poolRepo.findOne({
      where: { id: member.poolId },
      select: ['id', 'ownerId'],
    });
    if (pool?.ownerId === riderId) return;

    const limit = Number(member.monthlySpendLimit);
    const spent = await this.getSpend(member.id);
    if (spent + amount > limit) {
      throw new ForbiddenException(
        `تجاوزت حدّ الإنفاق الشهري للعائلة (${limit}). المتبقّي: ${Math.max(0, limit - spent).toFixed(2)}.`,
      );
    }
  }

  /** يسجّل إنفاقاً للعضو (يُستدعى عند اكتمال الطلب) — Redis monthly counter */
  async recordSpend(riderId: number, amount: number): Promise<void> {
    if (!amount || amount <= 0) return;
    const member = await this.memberRepo.findOne({
      where: { riderId, active: true },
      select: ['id', 'poolId'],
    });
    if (!member) return;
    try {
      const key = this.spendKey(member.id);
      await this.redis.incrbyfloat(key, amount);
      // انتهاء بعد ~40 يوماً (يغطي الشهر ثم يُنظَّف)
      await this.redis.expire(key, 40 * 24 * 3600);
    } catch (e) {
      this.logger.warn(`recordSpend failed for rider ${riderId}: ${e}`);
    }
  }
}
