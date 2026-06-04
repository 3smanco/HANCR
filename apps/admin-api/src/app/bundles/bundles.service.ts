import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RideBundleEntity } from '@hancr/database';
import {
  AdminBundleType,
  CreateBundleInput,
  UpdateBundleInput,
} from './dto/bundle.types';

@Injectable()
export class BundlesService {
  constructor(
    @InjectRepository(RideBundleEntity)
    private readonly repo: Repository<RideBundleEntity>,
  ) {}

  async findAll(): Promise<AdminBundleType[]> {
    const rows = await this.repo.find({ order: { id: 'DESC' } });
    return rows.map((r) => this.toType(r));
  }

  async create(input: CreateBundleInput): Promise<AdminBundleType> {
    const saved = await this.repo.save(this.repo.create(input));
    return this.toType(saved);
  }

  async update(
    id: number,
    input: UpdateBundleInput,
  ): Promise<AdminBundleType> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Bundle not found');
    Object.assign(row, input);
    const saved = await this.repo.save(row);
    return this.toType(saved);
  }

  async toggleActive(id: number): Promise<AdminBundleType> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Bundle not found');
    row.active = !row.active;
    const saved = await this.repo.save(row);
    return this.toType(saved);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toType(b: RideBundleEntity): AdminBundleType {
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
      createdAt: b.createdAt,
    };
  }
}
