import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  AdminCreateDriverInput,
  AdminCreateRiderInput,
  AdminDriverType,
  AdminRiderDetailType,
  AdminRiderType,
  AdminUpdateDriverInput,
  AdminUpdateRiderInput,
  DriverListResult,
  RiderListResult,
} from './dto/user.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';

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

  /** N3 — Bundled rider detail for /users/riders/[id]. */
  @Query(() => AdminRiderDetailType, {
    description: 'تفاصيل راكب موسَّعة (رحلات/أماكن/إنفاق)',
  })
  @UseGuards(AdminJwtGuard)
  adminRiderDetail(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminRiderDetailType> {
    return this.usersService.getRiderDetail(id);
  }

  @Mutation(() => AdminRiderType, { description: 'إنشاء راكب يدوياً' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  adminCreateRider(
    @Args('input') input: AdminCreateRiderInput,
  ): Promise<AdminRiderType> {
    return this.usersService.createRider(input);
  }

  @Mutation(() => AdminRiderType, { description: 'تعديل بيانات راكب' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  adminUpdateRider(
    @Args('input') input: AdminUpdateRiderInput,
  ): Promise<AdminRiderType> {
    return this.usersService.updateRider(input);
  }

  @Mutation(() => AdminRiderType, { description: 'حظر راكب' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  banRider(
    @Args('id', { type: () => Int }) id: number,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<AdminRiderType> {
    return this.usersService.banRider(id, reason);
  }

  @Mutation(() => AdminRiderType, { description: 'رفع الحظر عن راكب' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
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

  @Mutation(() => AdminDriverType, { description: 'إنشاء سائق يدوياً' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  adminCreateDriver(
    @Args('input') input: AdminCreateDriverInput,
  ): Promise<AdminDriverType> {
    return this.usersService.createDriver(input);
  }

  @Mutation(() => AdminDriverType, { description: 'تعديل بيانات سائق' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  adminUpdateDriver(
    @Args('input') input: AdminUpdateDriverInput,
  ): Promise<AdminDriverType> {
    return this.usersService.updateDriver(input);
  }

  @Mutation(() => AdminDriverType, { description: 'اعتماد سائق جديد' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  approveDriver(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminDriverType> {
    return this.usersService.approveDriver(id);
  }

  @Mutation(() => AdminDriverType, { description: 'حظر سائق' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  banDriver(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminDriverType> {
    return this.usersService.banDriver(id);
  }

  @Mutation(() => AdminDriverType, { description: 'رفع الحظر عن سائق' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  unbanDriver(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminDriverType> {
    return this.usersService.unbanDriver(id);
  }

  /** H3 — اعتماد السائق للنقل المدرسي و/أو العمل الليلي */
  @Mutation(() => AdminDriverType, {
    description: 'تعيين اعتمادات السائق (مدارس / ليلي)',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
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
