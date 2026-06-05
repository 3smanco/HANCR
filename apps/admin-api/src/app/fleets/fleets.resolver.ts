import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FleetsService } from './fleets.service';
import {
  AdminFleetType,
  AssignDriverToFleetInput,
  CreateFleetInput,
  FleetDriverType,
  TopUpFleetInput,
  UpdateFleetInput,
} from './dto/fleet.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';

@Resolver(() => AdminFleetType)
@UseGuards(AdminJwtGuard, AdminRolesGuard)
@RequireRole('ops')
export class FleetsResolver {
  constructor(private readonly service: FleetsService) {}

  @Query(() => [AdminFleetType], { description: 'قائمة الأساطيل' })
  adminFleets(): Promise<AdminFleetType[]> {
    return this.service.list();
  }

  @Query(() => [FleetDriverType], { description: 'سائقو الأسطول' })
  fleetDrivers(
    @Args('fleetId', { type: () => Int }) fleetId: number,
  ): Promise<FleetDriverType[]> {
    return this.service.listDrivers(fleetId);
  }

  @Mutation(() => AdminFleetType, { description: 'إنشاء أسطول' })
  createFleet(
    @Args('input') input: CreateFleetInput,
  ): Promise<AdminFleetType> {
    return this.service.create(input);
  }

  @Mutation(() => AdminFleetType, { description: 'تحديث أسطول' })
  updateFleet(
    @Args('input') input: UpdateFleetInput,
  ): Promise<AdminFleetType> {
    return this.service.update(input);
  }

  @Mutation(() => AdminFleetType, { description: 'شحن رصيد أسطول' })
  @RequireRole('finance')
  topUpFleet(@Args('input') input: TopUpFleetInput): Promise<AdminFleetType> {
    return this.service.topUp(input);
  }

  @Mutation(() => Boolean, { description: 'حذف أسطول (يجب أن يكون بلا سائقين)' })
  deleteFleet(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.remove(id);
  }

  @Mutation(() => FleetDriverType, { description: 'تعيين سائق لأسطول' })
  assignDriverToFleet(
    @Args('input') input: AssignDriverToFleetInput,
  ): Promise<FleetDriverType> {
    return this.service.assignDriver(input);
  }

  @Mutation(() => Boolean, { description: 'إلغاء انتساب السائق' })
  unassignDriverFromFleet(
    @Args('driverId', { type: () => Int }) driverId: number,
  ): Promise<boolean> {
    return this.service.unassignDriver(driverId);
  }
}
