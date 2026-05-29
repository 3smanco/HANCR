import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from '@hancr/database';
import { ServiceType } from '@hancr/database';
import { AdminServiceType, CreateServiceInput, UpdateServiceInput } from './dto/service.types';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
  ) {}

  async findAll(regionId?: number): Promise<AdminServiceType[]> {
    const where = regionId ? { regionId } : {};
    const services = await this.serviceRepo.find({
      where,
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
    return services.map((s) => this.toType(s));
  }

  async findOne(id: number): Promise<AdminServiceType> {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException(`Service #${id} not found`);
    return this.toType(service);
  }

  async create(input: CreateServiceInput): Promise<AdminServiceType> {
    const service = this.serviceRepo.create({
      name: input.name,
      nameEn: input.nameEn,
      serviceType: input.serviceType as ServiceType,
      regionId: input.regionId,
      baseFare: input.baseFare,
      perHundredMeters: input.perHundredMeters,
      perMinuteDrive: input.perMinuteDrive,
      perMinuteWait: input.perMinuteWait,
      minimumFee: input.minimumFee,
      hourlyRate: input.hourlyRate,
      extraMinuteRate: input.extraMinuteRate,
      providerSharePercent: input.providerSharePercent ?? 20,
      bidModeEnabled: input.bidModeEnabled ?? false,
      isVip: input.isVip ?? false,
      iconUrl: input.iconUrl,
      displayOrder: input.displayOrder ?? 0,
      enabled: true,
    });
    const saved = await this.serviceRepo.save(service);
    return this.toType(saved);
  }

  async update(id: number, input: UpdateServiceInput): Promise<AdminServiceType> {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException(`Service #${id} not found`);

    if (input.name !== undefined) service.name = input.name;
    if (input.nameEn !== undefined) service.nameEn = input.nameEn;
    if (input.baseFare !== undefined) service.baseFare = input.baseFare;
    if (input.perHundredMeters !== undefined) service.perHundredMeters = input.perHundredMeters;
    if (input.perMinuteDrive !== undefined) service.perMinuteDrive = input.perMinuteDrive;
    if (input.perMinuteWait !== undefined) service.perMinuteWait = input.perMinuteWait;
    if (input.minimumFee !== undefined) service.minimumFee = input.minimumFee;
    if (input.providerSharePercent !== undefined) service.providerSharePercent = input.providerSharePercent;
    if (input.cancellationTotalFee !== undefined) service.cancellationTotalFee = input.cancellationTotalFee;
    if (input.enabled !== undefined) service.enabled = input.enabled;
    if (input.bidModeEnabled !== undefined) service.bidModeEnabled = input.bidModeEnabled;
    if (input.isVip !== undefined) service.isVip = input.isVip;
    if (input.iconUrl !== undefined) service.iconUrl = input.iconUrl;
    if (input.displayOrder !== undefined) service.displayOrder = input.displayOrder;
    if (input.availableTimeFrom !== undefined) service.availableTimeFrom = input.availableTimeFrom;
    if (input.availableTimeTo !== undefined) service.availableTimeTo = input.availableTimeTo;
    if (input.timeMultipliers !== undefined) {
      service.timeMultipliers = input.timeMultipliers as Array<{
        startHour: number; endHour: number; multiplier: number;
      }>;
    }
    if (input.weekdayMultipliers !== undefined) {
      service.weekdayMultipliers = input.weekdayMultipliers as Array<{
        weekdays: number[]; multiplier: number;
      }>;
    }
    if (input.dateRangeMultipliers !== undefined) {
      service.dateRangeMultipliers = input.dateRangeMultipliers as Array<{
        from: string; to: string; multiplier: number; label?: string;
      }>;
    }

    const saved = await this.serviceRepo.save(service);
    return this.toType(saved);
  }

  async toggleEnabled(id: number): Promise<AdminServiceType> {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException(`Service #${id} not found`);
    service.enabled = !service.enabled;
    const saved = await this.serviceRepo.save(service);
    return this.toType(saved);
  }

  private toType(e: ServiceEntity): AdminServiceType {
    const t = new AdminServiceType();
    t.id = e.id;
    t.name = e.name;
    t.nameEn = e.nameEn;
    t.serviceType = e.serviceType;
    t.baseFare = Number(e.baseFare);
    t.perHundredMeters = Number(e.perHundredMeters);
    t.perMinuteDrive = Number(e.perMinuteDrive);
    t.perMinuteWait = Number(e.perMinuteWait);
    t.minimumFee = Number(e.minimumFee);
    t.hourlyRate = e.hourlyRate !== undefined ? Number(e.hourlyRate) : undefined;
    t.extraMinuteRate = e.extraMinuteRate !== undefined ? Number(e.extraMinuteRate) : undefined;
    t.providerSharePercent = Number(e.providerSharePercent);
    t.prepayPercent = Number(e.prepayPercent);
    t.cancellationTotalFee = Number(e.cancellationTotalFee);
    t.cancellationDriverShare = Number(e.cancellationDriverShare);
    t.searchRadius = e.searchRadius;
    t.availableTimeFrom = e.availableTimeFrom;
    t.availableTimeTo = e.availableTimeTo;
    t.bidModeEnabled = e.bidModeEnabled;
    t.enabled = e.enabled;
    t.displayOrder = e.displayOrder;
    t.iconUrl = e.iconUrl;
    t.isVip = e.isVip;
    t.regionId = e.regionId;
    t.timeMultipliers = e.timeMultipliers;
    t.weekdayMultipliers = e.weekdayMultipliers;
    t.dateRangeMultipliers = e.dateRangeMultipliers;
    t.createdAt = e.createdAt;
    t.updatedAt = e.updatedAt;
    return t;
  }
}
