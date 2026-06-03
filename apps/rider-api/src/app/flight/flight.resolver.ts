import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FlightService } from './flight.service';
import {
  FlightTrackingInput,
  FlightTrackingType,
} from './dto/flight-tracking.types';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => FlightTrackingType)
export class FlightResolver {
  constructor(private readonly service: FlightService) {}

  @Query(() => [FlightTrackingType], { description: 'تتبّعات الرحلات الجوية' })
  @UseGuards(JwtAuthGuard)
  flightTrackings(
    @CurrentUser() user: AuthUser,
  ): Promise<FlightTrackingType[]> {
    return this.service.list(user.riderId);
  }

  @Mutation(() => FlightTrackingType, { description: 'بدء تتبّع رحلة طيران' })
  @UseGuards(JwtAuthGuard)
  trackFlight(
    @CurrentUser() user: AuthUser,
    @Args('input') input: FlightTrackingInput,
  ): Promise<FlightTrackingType> {
    return this.service.create(user.riderId, input);
  }

  @Mutation(() => Boolean, { description: 'إلغاء تتبّع رحلة' })
  @UseGuards(JwtAuthGuard)
  cancelFlightTracking(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.cancel(user.riderId, id);
  }
}
