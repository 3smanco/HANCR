import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CancelReasonEntity, ReviewParameterEntity } from '@hancr/database';
import {
  CancelReasonType,
  ReviewParameterType,
  UpsertCancelReasonInput,
  UpsertReviewParameterInput,
} from './dto/settings.types';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(CancelReasonEntity)
    private readonly reasonRepo: Repository<CancelReasonEntity>,
    @InjectRepository(ReviewParameterEntity)
    private readonly paramRepo: Repository<ReviewParameterEntity>,
  ) {}

  // ─── Cancel Reasons ──────────────────────────────────────────────────────

  async listReasons(): Promise<CancelReasonType[]> {
    const rows = await this.reasonRepo.find({
      order: { appliesTo: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });
    return rows.map((r) => this.toReasonType(r));
  }

  async upsertReason(
    input: UpsertCancelReasonInput,
  ): Promise<CancelReasonType> {
    let row: CancelReasonEntity;
    if (input.id) {
      const existing = await this.reasonRepo.findOne({
        where: { id: input.id },
      });
      if (!existing) throw new NotFoundException('Reason not found');
      Object.assign(existing, input);
      row = await this.reasonRepo.save(existing);
    } else {
      row = await this.reasonRepo.save(this.reasonRepo.create(input));
    }
    return this.toReasonType(row);
  }

  async deleteReason(id: number): Promise<boolean> {
    const r = await this.reasonRepo.delete(id);
    return (r.affected ?? 0) > 0;
  }

  // ─── Review Parameters ───────────────────────────────────────────────────

  async listParameters(): Promise<ReviewParameterType[]> {
    const rows = await this.paramRepo.find({
      order: { target: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });
    return rows.map((r) => this.toParamType(r));
  }

  async upsertParameter(
    input: UpsertReviewParameterInput,
  ): Promise<ReviewParameterType> {
    let row: ReviewParameterEntity;
    if (input.id) {
      const existing = await this.paramRepo.findOne({
        where: { id: input.id },
      });
      if (!existing) throw new NotFoundException('Parameter not found');
      Object.assign(existing, input);
      row = await this.paramRepo.save(existing);
    } else {
      row = await this.paramRepo.save(this.paramRepo.create(input));
    }
    return this.toParamType(row);
  }

  async deleteParameter(id: number): Promise<boolean> {
    const r = await this.paramRepo.delete(id);
    return (r.affected ?? 0) > 0;
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────

  private toReasonType(r: CancelReasonEntity): CancelReasonType {
    return {
      id: r.id,
      code: r.code,
      labelAr: r.labelAr,
      labelEn: r.labelEn,
      appliesTo: r.appliesTo,
      sortOrder: r.sortOrder,
      active: r.active,
      createdAt: r.createdAt,
    };
  }

  private toParamType(p: ReviewParameterEntity): ReviewParameterType {
    return {
      id: p.id,
      code: p.code,
      labelAr: p.labelAr,
      labelEn: p.labelEn,
      target: p.target,
      sortOrder: p.sortOrder,
      active: p.active,
      createdAt: p.createdAt,
    };
  }
}
