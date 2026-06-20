import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SosTriggeredBy } from '@hancr/database';
import { SosService } from '@hancr/sos';
import {
  EmergencyContactType,
  SosIncidentType,
  AddEmergencyContactInput,
  TriggerSosInput,
} from './dto/sos.type';
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';

@Resolver()
export class SosResolver {
  constructor(private readonly sosService: SosService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Emergency Contacts (driver-side)
  // ─────────────────────────────────────────────────────────────────────────

  @Query(() => [EmergencyContactType], {
    description: 'جهات الطوارئ المسجَّلة للسائق',
  })
  @UseGuards(JwtAuthGuard)
  async myDriverEmergencyContacts(
    @CurrentDriver() driver: AuthDriver,
  ): Promise<EmergencyContactType[]> {
    return this.sosService.listContacts('Driver', driver.driverId);
  }

  @Mutation(() => EmergencyContactType, {
    description: 'إضافة جهة طوارئ للسائق',
  })
  @UseGuards(JwtAuthGuard)
  async addDriverEmergencyContact(
    @CurrentDriver() driver: AuthDriver,
    @Args('input') input: AddEmergencyContactInput,
  ): Promise<EmergencyContactType> {
    if (!input.phoneNumber.startsWith('+') || input.phoneNumber.length < 8) {
      throw new BadRequestException(
        'Phone must be in E.164 format (e.g. +966501234567)',
      );
    }
    if (input.name.trim().length === 0) {
      throw new BadRequestException('Name is required');
    }
    return this.sosService.addContact({
      ownerType: 'Driver',
      ownerId: driver.driverId,
      name: input.name.trim(),
      phoneNumber: input.phoneNumber.trim(),
      relation: input.relation,
      autoShareTrips: input.autoShareTrips,
      priority: input.priority,
    });
  }

  @Mutation(() => Boolean, {
    description: 'حذف جهة طوارئ للسائق',
  })
  @UseGuards(JwtAuthGuard)
  async removeDriverEmergencyContact(
    @CurrentDriver() driver: AuthDriver,
    @Args('contactId', { type: () => Int }) contactId: number,
  ): Promise<boolean> {
    return this.sosService.removeContact(contactId, 'Driver', driver.driverId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SOS Incidents
  // ─────────────────────────────────────────────────────────────────────────

  @Query(() => SosIncidentType, {
    nullable: true,
    description: 'حادثة SOS نشطة حالياً للسائق (إن وُجدت)',
  })
  @UseGuards(JwtAuthGuard)
  async myActiveDriverSos(
    @CurrentDriver() driver: AuthDriver,
  ): Promise<SosIncidentType | null> {
    return this.sosService.getActiveSos(SosTriggeredBy.Driver, driver.driverId);
  }

  @Mutation(() => SosIncidentType, {
    description: '🚨 تفعيل حادثة طوارئ — السائق',
  })
  @UseGuards(JwtAuthGuard)
  // SOS: 10/60s — السائق في خطر قد يضغط متكرراً. Service idempotent.
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  async triggerDriverSos(
    @CurrentDriver() driver: AuthDriver,
    @Args('input') input: TriggerSosInput,
  ): Promise<SosIncidentType> {
    return this.sosService.triggerSos({
      triggeredBy: SosTriggeredBy.Driver,
      triggeredById: driver.driverId,
      latitude: input.latitude,
      longitude: input.longitude,
      orderId: input.orderId,
    });
  }

  @Mutation(() => Boolean, {
    description: 'بثّ موقع السائق الحيّ أثناء حادثة طوارئ نشطة (كل 3ث)',
  })
  @UseGuards(JwtAuthGuard)
  @Throttle({ strict: { limit: 30, ttl: 60000 } })
  async updateDriverSosLocation(
    @CurrentDriver() driver: AuthDriver,
    @Args('latitude') latitude: number,
    @Args('longitude') longitude: number,
  ): Promise<boolean> {
    return this.sosService.updateActiveLocation(
      SosTriggeredBy.Driver,
      driver.driverId,
      latitude,
      longitude,
    );
  }

  @Mutation(() => SosIncidentType, {
    description: 'إلغاء حادثة طوارئ (إنذار خاطئ) — السائق',
  })
  @UseGuards(JwtAuthGuard)
  async cancelDriverSos(
    @CurrentDriver() driver: AuthDriver,
    @Args('incidentId', { type: () => Int }) incidentId: number,
  ): Promise<SosIncidentType> {
    try {
      return await this.sosService.cancelSos(
        incidentId,
        SosTriggeredBy.Driver,
        driver.driverId,
      );
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(`فشل إلغاء الـ SOS: ${(e as Error).message}`);
    }
  }
}
