import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity } from '@hancr/database';
import {
  AdminLeadType,
  LeadListResult,
  SubmitLeadInput,
  UpdateLeadStatusInput,
} from './dto/lead.types';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepo: Repository<LeadEntity>,
  ) {}

  async submit(
    input: SubmitLeadInput,
    sourceIp?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const lead = this.leadRepo.create({
      type: input.type,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim(),
      company: input.company?.trim(),
      city: input.city?.trim(),
      message: input.message?.trim(),
      status: 'new',
      sourceIp,
      userAgent,
    });
    await this.leadRepo.save(lead);
    return true;
  }

  async list(
    page = 1,
    limit = 20,
    type?: string,
    status?: string,
  ): Promise<LeadListResult> {
    const qb = this.leadRepo
      .createQueryBuilder('l')
      .orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (type) qb.andWhere('l.type = :type', { type });
    if (status) qb.andWhere('l.status = :status', { status });

    const [items, total] = await qb.getManyAndCount();

    const [newCount, contactedCount] = await Promise.all([
      this.leadRepo.count({ where: { status: 'new' } }),
      this.leadRepo.count({ where: { status: 'contacted' } }),
    ]);

    return {
      items: items.map((l) => this.toType(l)),
      total,
      page,
      limit,
      newCount,
      contactedCount,
    };
  }

  async getOne(id: number): Promise<AdminLeadType> {
    const l = await this.leadRepo.findOne({ where: { id } });
    if (!l) throw new NotFoundException(`Lead #${id} not found`);
    return this.toType(l);
  }

  async updateStatus(input: UpdateLeadStatusInput): Promise<AdminLeadType> {
    const l = await this.leadRepo.findOne({ where: { id: input.leadId } });
    if (!l) throw new NotFoundException(`Lead #${input.leadId} not found`);
    l.status = input.status;
    if (input.note) {
      const meta = (l.metadata ?? {}) as Record<string, unknown>;
      const notes = Array.isArray(meta['notes']) ? (meta['notes'] as string[]) : [];
      notes.push(`[${new Date().toISOString()}] ${input.note}`);
      meta['notes'] = notes;
      l.metadata = meta;
    }
    await this.leadRepo.save(l);
    return this.toType(l);
  }

  private toType(l: LeadEntity): AdminLeadType {
    return {
      id: l.id,
      type: l.type,
      name: l.name,
      email: l.email,
      phone: l.phone,
      company: l.company,
      city: l.city,
      message: l.message,
      status: l.status,
      createdAt: l.createdAt,
    };
  }
}
