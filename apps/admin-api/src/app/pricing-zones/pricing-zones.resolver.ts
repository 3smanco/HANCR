import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
} from '@nestjs/graphql';
import {
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingZoneEntity } from '@hancr/database';
import {
  AdminPricingZoneType,
  UpsertPricingZoneInput,
} from './dto/pricing-zone.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';

@Injectable()
export class PricingZonesService {
  constructor(
    @InjectRepository(PricingZoneEntity)
    private readonly repo: Repository<PricingZoneEntity>,
  ) {}

  async list(): Promise<AdminPricingZoneType[]> {
    const rows = await this.repo.find({ order: { id: 'DESC' } });
    return rows.map((r) => this.toType(r));
  }

  async upsert(
    input: UpsertPricingZoneInput,
  ): Promise<AdminPricingZoneType> {
    let row: PricingZoneEntity;
    if (input.id) {
      const existing = await this.repo.findOne({ where: { id: input.id } });
      if (!existing) throw new NotFoundException('Zone not found');
      Object.assign(existing, input);
      row = await this.repo.save(existing);
    } else {
      row = await this.repo.save(this.repo.create(input));
    }
    return this.toType(row);
  }

  async remove(id: number): Promise<boolean> {
    const r = await this.repo.delete(id);
    return (r.affected ?? 0) > 0;
  }

  private toType(z: PricingZoneEntity): AdminPricingZoneType {
    return {
      id: z.id,
      name: z.name,
      regionId: z.regionId,
      serviceId: z.serviceId,
      fleetId: z.fleetId,
      baseFare: Number(z.baseFare),
      perKm: Number(z.perKm),
      perMinute: Number(z.perMinute),
      multiplier: Number(z.multiplier),
      startsAt: z.startsAt,
      endsAt: z.endsAt,
      active: z.active,
      createdAt: z.createdAt,
    };
  }
}

@Resolver(() => AdminPricingZoneType)
@UseGuards(AdminJwtGuard, AdminRolesGuard)
@RequireRole('finance')
export class PricingZonesResolver {
  constructor(private readonly service: PricingZonesService) {}

  @Query(() => [AdminPricingZoneType], { description: 'مناطق التسعير' })
  pricingZones(): Promise<AdminPricingZoneType[]> {
    return this.service.list();
  }

  @Mutation(() => AdminPricingZoneType, {
    description: 'إنشاء/تحديث منطقة تسعير',
  })
  upsertPricingZone(
    @Args('input') input: UpsertPricingZoneInput,
  ): Promise<AdminPricingZoneType> {
    return this.service.upsert(input);
  }

  @Mutation(() => Boolean, { description: 'حذف منطقة تسعير' })
  deletePricingZone(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.remove(id);
  }
}
