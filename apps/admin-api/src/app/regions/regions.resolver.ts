import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { AdminRegionType, CreateRegionInput, UpdateRegionInput } from './dto/region.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Resolver(() => AdminRegionType)
export class RegionsResolver {
  constructor(private readonly regionsService: RegionsService) {}

  @Query(() => [AdminRegionType], { description: 'قائمة المناطق' })
  @UseGuards(AdminJwtGuard)
  adminRegions(): Promise<AdminRegionType[]> {
    return this.regionsService.findAll();
  }

  @Query(() => AdminRegionType, { description: 'منطقة بالمعرّف' })
  @UseGuards(AdminJwtGuard)
  adminRegion(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminRegionType> {
    return this.regionsService.findOne(id);
  }

  @Mutation(() => AdminRegionType, { description: 'إنشاء منطقة جديدة' })
  @UseGuards(AdminJwtGuard)
  createRegion(
    @Args('input') input: CreateRegionInput,
  ): Promise<AdminRegionType> {
    return this.regionsService.create(input);
  }

  @Mutation(() => AdminRegionType, { description: 'تحديث منطقة' })
  @UseGuards(AdminJwtGuard)
  updateRegion(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateRegionInput,
  ): Promise<AdminRegionType> {
    return this.regionsService.update(id, input);
  }

  @Mutation(() => AdminRegionType, { description: 'تفعيل/تعطيل منطقة' })
  @UseGuards(AdminJwtGuard)
  toggleRegionEnabled(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminRegionType> {
    return this.regionsService.toggleEnabled(id);
  }
}
