import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { AdminServiceType, CreateServiceInput, UpdateServiceInput } from './dto/service.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Resolver(() => AdminServiceType)
export class ServicesResolver {
  constructor(private readonly servicesService: ServicesService) {}

  @Query(() => [AdminServiceType], { description: 'قائمة الخدمات' })
  @UseGuards(AdminJwtGuard)
  adminServices(
    @Args('regionId', { type: () => Int, nullable: true }) regionId?: number,
  ): Promise<AdminServiceType[]> {
    return this.servicesService.findAll(regionId);
  }

  @Query(() => AdminServiceType, { description: 'خدمة بالمعرّف' })
  @UseGuards(AdminJwtGuard)
  adminService(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminServiceType> {
    return this.servicesService.findOne(id);
  }

  @Mutation(() => AdminServiceType, { description: 'إنشاء خدمة جديدة' })
  @UseGuards(AdminJwtGuard)
  createService(
    @Args('input') input: CreateServiceInput,
  ): Promise<AdminServiceType> {
    return this.servicesService.create(input);
  }

  @Mutation(() => AdminServiceType, { description: 'تحديث خدمة' })
  @UseGuards(AdminJwtGuard)
  updateService(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateServiceInput,
  ): Promise<AdminServiceType> {
    return this.servicesService.update(id, input);
  }

  @Mutation(() => AdminServiceType, { description: 'تفعيل/تعطيل خدمة' })
  @UseGuards(AdminJwtGuard)
  toggleServiceEnabled(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminServiceType> {
    return this.servicesService.toggleEnabled(id);
  }
}
