import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from '@hancr/database';
import { ServiceType } from './dto/service.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => ServiceType)
export class ServiceResolver {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
  ) {}

  /**
   * قائمة الخدمات المتاحة في المنطقة
   * (يُستخدم لعرض شبكة الخدمات في الصفحة الرئيسية)
   */
  @Query(() => [ServiceType], {
    description: 'قائمة الخدمات المتاحة حسب المنطقة',
  })
  @UseGuards(JwtAuthGuard)
  async services(
    @Args('regionId', { type: () => Int }) regionId: number,
  ): Promise<ServiceType[]> {
    const services = await this.serviceRepo.find({
      where: { regionId, enabled: true },
      order: { displayOrder: 'ASC' },
    });

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      nameEn: s.nameEn,
      serviceType: s.serviceType,
      baseFare: Number(s.baseFare),
      minimumFee: Number(s.minimumFee),
      hourlyRate: s.hourlyRate ? Number(s.hourlyRate) : undefined,
      searchRadius: s.searchRadius,
      bidModeEnabled: s.bidModeEnabled,
      enabled: s.enabled,
      displayOrder: s.displayOrder,
      iconUrl: s.iconUrl,
      isVip: s.isVip,
    }));
  }
}
