import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegionEntity } from '@hancr/database';
import { AdminRegionType, CreateRegionInput, UpdateRegionInput } from './dto/region.types';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly regionRepo: Repository<RegionEntity>,
  ) {}

  async findAll(): Promise<AdminRegionType[]> {
    const regions = await this.regionRepo.find({ order: { id: 'ASC' } });
    return regions.map((r) => this.toType(r));
  }

  async findOne(id: number): Promise<AdminRegionType> {
    const region = await this.regionRepo.findOne({ where: { id } });
    if (!region) throw new NotFoundException(`Region #${id} not found`);
    return this.toType(region);
  }

  async create(input: CreateRegionInput): Promise<AdminRegionType> {
    const region = this.regionRepo.create({
      name: input.name,
      nameEn: input.nameEn,
      currency: input.currency,
      metroApiUrl: input.metroApiUrl,
      defaultSearchRadius: input.defaultSearchRadius ?? 5000,
      bidModeEnabled: input.bidModeEnabled ?? false,
      boundary: input.boundary as Record<string, unknown> | undefined,
      enabled: true,
    });
    const saved = await this.regionRepo.save(region);
    return this.toType(saved);
  }

  async update(id: number, input: UpdateRegionInput): Promise<AdminRegionType> {
    const region = await this.regionRepo.findOne({ where: { id } });
    if (!region) throw new NotFoundException(`Region #${id} not found`);

    if (input.name !== undefined) region.name = input.name;
    if (input.nameEn !== undefined) region.nameEn = input.nameEn;
    if (input.currency !== undefined) region.currency = input.currency;
    if (input.enabled !== undefined) region.enabled = input.enabled;
    if (input.bidModeEnabled !== undefined) region.bidModeEnabled = input.bidModeEnabled;
    if (input.metroApiUrl !== undefined) region.metroApiUrl = input.metroApiUrl;
    if (input.defaultSearchRadius !== undefined) region.defaultSearchRadius = input.defaultSearchRadius;
    if (input.boundary !== undefined) region.boundary = input.boundary as Record<string, unknown>;

    const saved = await this.regionRepo.save(region);
    return this.toType(saved);
  }

  async toggleEnabled(id: number): Promise<AdminRegionType> {
    const region = await this.regionRepo.findOne({ where: { id } });
    if (!region) throw new NotFoundException(`Region #${id} not found`);
    region.enabled = !region.enabled;
    const saved = await this.regionRepo.save(region);
    return this.toType(saved);
  }

  private toType(e: RegionEntity): AdminRegionType {
    const t = new AdminRegionType();
    t.id = e.id;
    t.name = e.name;
    t.nameEn = e.nameEn;
    t.currency = e.currency;
    t.enabled = e.enabled;
    t.bidModeEnabled = e.bidModeEnabled;
    t.metroApiUrl = e.metroApiUrl;
    t.defaultSearchRadius = e.defaultSearchRadius;
    t.boundary = e.boundary;
    t.createdAt = e.createdAt;
    t.updatedAt = e.updatedAt;
    return t;
  }
}
