import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import {
  AnnouncementEntity,
  GiftBatchEntity,
  GiftCodeEntity,
  RiderEntity,
} from '@hancr/database';
import {
  AnnouncementType,
  CreateAnnouncementInput,
  CreateGiftBatchInput,
  GiftBatchExportResult,
  GiftBatchType,
  ReferralStatsResult,
  UpdateAnnouncementInput,
} from './dto/marketing.types';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly annRepo: Repository<AnnouncementEntity>,
    @InjectRepository(GiftBatchEntity)
    private readonly batchRepo: Repository<GiftBatchEntity>,
    @InjectRepository(GiftCodeEntity)
    private readonly codeRepo: Repository<GiftCodeEntity>,
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
  ) {}

  // ─── Announcements ───────────────────────────────────────────────────────

  async listAnnouncements(): Promise<AnnouncementType[]> {
    const rows = await this.annRepo.find({ order: { id: 'DESC' } });
    return rows.map((r) => this.toAnnType(r));
  }

  async createAnnouncement(
    input: CreateAnnouncementInput,
  ): Promise<AnnouncementType> {
    const saved = await this.annRepo.save(
      this.annRepo.create({
        title: input.title,
        body: input.body,
        target: input.target,
        url: input.url,
        startsAt: input.startsAt ?? new Date(),
        endsAt: input.endsAt,
        active: true,
      }),
    );
    return this.toAnnType(saved);
  }

  async updateAnnouncement(
    input: UpdateAnnouncementInput,
  ): Promise<AnnouncementType> {
    const row = await this.annRepo.findOne({ where: { id: input.id } });
    if (!row) throw new NotFoundException('Announcement not found');
    if (input.title !== undefined) row.title = input.title;
    if (input.body !== undefined) row.body = input.body;
    if (input.target !== undefined) row.target = input.target;
    if (input.url !== undefined) row.url = input.url;
    if (input.startsAt !== undefined) row.startsAt = input.startsAt;
    if (input.endsAt !== undefined) row.endsAt = input.endsAt;
    if (input.active !== undefined) row.active = input.active;
    const saved = await this.annRepo.save(row);
    return this.toAnnType(saved);
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const r = await this.annRepo.delete(id);
    return (r.affected ?? 0) > 0;
  }

  // ─── Gift batches ────────────────────────────────────────────────────────

  async listGiftBatches(): Promise<GiftBatchType[]> {
    const rows = await this.batchRepo.find({ order: { id: 'DESC' } });
    return rows.map((b) => this.toBatchType(b));
  }

  async createGiftBatch(
    input: CreateGiftBatchInput,
  ): Promise<GiftBatchExportResult> {
    const batch = await this.batchRepo.save(
      this.batchRepo.create({
        name: input.name,
        amount: input.amount,
        currency: input.currency.toUpperCase(),
        totalCount: input.totalCount,
        claimedCount: 0,
        expiresAt: input.expiresAt,
      }),
    );
    // Generate unique codes (chunked to avoid one massive insert)
    const codes: string[] = [];
    const batchSize = 100;
    while (codes.length < input.totalCount) {
      const remaining = input.totalCount - codes.length;
      const chunkSize = Math.min(batchSize, remaining);
      const chunk: GiftCodeEntity[] = [];
      for (let i = 0; i < chunkSize; i++) {
        const code = this.generateCode();
        chunk.push(this.codeRepo.create({ batchId: batch.id, code }));
        codes.push(code);
      }
      await this.codeRepo.save(chunk);
    }
    return {
      batch: this.toBatchType(batch),
      codes,
    };
  }

  async getBatchCodes(batchId: number): Promise<string[]> {
    const codes = await this.codeRepo.find({
      where: { batchId },
      order: { id: 'ASC' },
    });
    return codes.map((c) => c.code);
  }

  // ─── Referral stats ──────────────────────────────────────────────────────

  async referralStats(): Promise<ReferralStatsResult> {
    // count of riders who have a referrerId set
    const totalInvited = await this.riderRepo
      .createQueryBuilder('r')
      .where('r.referredBy IS NOT NULL')
      .getCount();

    // Top 10 referrers by count of invitees
    const rows = await this.riderRepo
      .createQueryBuilder('r')
      .select('r.referredBy', 'referredBy')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.referredBy IS NOT NULL')
      .groupBy('r.referredBy')
      .orderBy('cnt', 'DESC')
      .limit(10)
      .getRawMany<{ referredBy: number; cnt: string }>();

    if (rows.length === 0) {
      return { totalInvited, topReferrers: [] };
    }

    const referrerIds = rows.map((r) => Number(r.referredBy));
    const referrers = await this.riderRepo.findBy({ id: In(referrerIds) });
    const refMap = new Map(referrers.map((r) => [r.id, r]));

    return {
      totalInvited,
      topReferrers: rows.map((r) => {
        const referrer = refMap.get(Number(r.referredBy));
        return {
          riderId: Number(r.referredBy),
          name: referrer
            ? [referrer.firstName, referrer.lastName]
                .filter(Boolean)
                .join(' ') || undefined
            : undefined,
          phone: referrer?.phoneNumber,
          referralCode: referrer?.referralCode,
          invitedCount: Number(r.cnt),
        };
      }),
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private generateCode(): string {
    // HANCR-GFT-XXXX (4 uppercase alphanumeric)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `HANCR-GFT-${suffix}`;
  }

  private toAnnType(a: AnnouncementEntity): AnnouncementType {
    return {
      id: a.id,
      title: a.title,
      body: a.body,
      target: a.target,
      url: a.url,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      active: a.active,
      createdAt: a.createdAt,
    };
  }

  private toBatchType(b: GiftBatchEntity): GiftBatchType {
    return {
      id: b.id,
      name: b.name,
      amount: Number(b.amount),
      currency: b.currency,
      totalCount: b.totalCount,
      claimedCount: b.claimedCount,
      expiresAt: b.expiresAt,
      createdAt: b.createdAt,
    };
  }

  // unused but kept for tree-shake protection
  private _unused() {
    Not(0);
  }
}
