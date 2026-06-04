import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  AdminRiderType,
  AdminDriverType,
  RiderListResult,
  DriverListResult,
} from './dto/user.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // ─── Riders ────────────────────────────────────────────────────────────────

  @Query(() => RiderListResult, { description: 'قائمة الركاب' })
  @UseGuards(AdminJwtGuard)
  adminListRiders(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<RiderListResult> {
    return this.usersService.listRiders(page, limit);
  }

  @Query(() => AdminRiderType, { description: 'بيانات راكب' })
  @UseGuards(AdminJwtGuard)
  adminGetRider(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminRiderType> {
    return this.usersService.getRider(id);
  }

  @Mutation(() => AdminRiderType, { description: 'حظر راكب' })
  @UseGuards(AdminJwtGuard)
  banRider(
    @Args('id', { type: () => Int }) id: number,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<AdminRiderType> {
    return this.usersService.banRider(id, reason);
  }

  @Mutation(() => AdminRiderType, { description: 'رفع الحظر عن راكب' })
  @UseGuards(AdminJwtGuard)
  unbanRider(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminRiderType> {
    return this.usersService.unbanRider(id);
  }

  // ─── Drivers ───────────────────────────────────────────────────────────────

  @Query(() => DriverListResult, { description: 'قائمة السائقين' })
  @UseGuards(AdminJwtGuard)
  adminListDrivers(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('pendingOnly', { defaultValue: false }) pendingOnly: boolean,
  ): Promise<DriverListResult> {
    return this.usersService.listDrivers(page, limit, pendingOnly);
  }

  @Query(() => AdminDriverType, { description: 'بيانات سائق' })
  @UseGuards(AdminJwtGuard)
  adminGetDriver(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminDriverType> {
    return this.usersService.getDriver(id);
  }

  @Mutation(() => AdminDriverType, { description: 'اعتماد سائق جديد' })
  @UseGuards(AdminJwtGuard)
  approveDriver(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminDriverType> {
    return this.usersService.approveDriver(id);
  }

  @Mutation(() => AdminDriverType, { description: 'حظر سائق' })
  @UseGuards(AdminJwtGuard)
  banDriver(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminDriverType> {
    return this.usersService.banDriver(id);
  }

  @Mutation(() => AdminDriverType, { description: 'رفع الحظر عن سائق' })
  @UseGuards(AdminJwtGuard)
  unbanDriver(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminDriverType> {
    return this.usersService.unbanDriver(id);
  }

  /** H3 — اعتماد السائق للنقل المدرسي و/أو العمل الليلي */
  @Mutation(() => AdminDriverType, {
    description: 'تعيين اعتمادات السائق (مدارس / ليلي)',
  })
  @UseGuards(AdminJwtGuard)
  setDriverApproval(
    @Args('driverId', { type: () => Int }) driverId: number,
    @Args('kidsApproved', { nullable: true }) kidsApproved?: boolean,
    @Args('nightApproved', { nullable: true }) nightApproved?: boolean,
  ): Promise<AdminDriverType> {
    return this.usersService.setApprovals(driverId, {
      kidsApproved,
      nightApproved,
    });
  }
}
