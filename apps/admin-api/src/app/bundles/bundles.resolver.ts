import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BundlesService } from './bundles.service';
import {
  AdminBundleType,
  CreateBundleInput,
  UpdateBundleInput,
} from './dto/bundle.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Resolver(() => AdminBundleType)
export class BundlesResolver {
  constructor(private readonly service: BundlesService) {}

  @Query(() => [AdminBundleType], { description: 'قائمة حزم الرحلات' })
  @UseGuards(AdminJwtGuard)
  adminBundles(): Promise<AdminBundleType[]> {
    return this.service.findAll();
  }

  @Mutation(() => AdminBundleType, { description: 'إنشاء حزمة' })
  @UseGuards(AdminJwtGuard)
  createBundle(
    @Args('input') input: CreateBundleInput,
  ): Promise<AdminBundleType> {
    return this.service.create(input);
  }

  @Mutation(() => AdminBundleType, { description: 'تحديث حزمة' })
  @UseGuards(AdminJwtGuard)
  updateBundle(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateBundleInput,
  ): Promise<AdminBundleType> {
    return this.service.update(id, input);
  }

  @Mutation(() => AdminBundleType, { description: 'تفعيل/تعطيل حزمة' })
  @UseGuards(AdminJwtGuard)
  toggleBundleActive(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminBundleType> {
    return this.service.toggleActive(id);
  }

  @Mutation(() => Boolean, { description: 'حذف حزمة' })
  @UseGuards(AdminJwtGuard)
  deleteBundle(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.remove(id);
  }
}
