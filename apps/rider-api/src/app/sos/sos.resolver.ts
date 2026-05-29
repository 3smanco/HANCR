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
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver()
export class SosResolver {
  constructor(private readonly sosService: SosService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Emergency Contacts
  // ─────────────────────────────────────────────────────────────────────────

  @Query(() => [EmergencyContactType], {
    description: 'جهات الطوارئ المسجَّلة للراكب',
  })
  @UseGuards(JwtAuthGuard)
  async myEmergencyContacts(
    @CurrentUser() user: AuthUser,
  ): Promise<EmergencyContactType[]> {
    return this.sosService.listContacts('Rider', user.riderId);
  }

  @Mutation(() => EmergencyContactType, {
    description: 'إضافة جهة طوارئ',
  })
  @UseGuards(JwtAuthGuard)
  async addEmergencyContact(
    @CurrentUser() user: AuthUser,
    @Args('input') input: AddEmergencyContactInput,
  ): Promise<EmergencyContactType> {
    // basic validation — E.164 format
    if (!input.phoneNumber.startsWith('+') || input.phoneNumber.length < 8) {
      throw new BadRequestException(
        'Phone must be in E.164 format (e.g. +966501234567)',
      );
    }
    if (input.name.trim().length === 0) {
      throw new BadRequestException('Name is required');
    }
    return this.sosService.addContact({
      ownerType: 'Rider',
      ownerId: user.riderId,
      name: input.name.trim(),
      phoneNumber: input.phoneNumber.trim(),
      relation: input.relation,
      autoShareTrips: input.autoShareTrips,
      priority: input.priority,
    });
  }

  @Mutation(() => Boolean, {
    description: 'حذف جهة طوارئ',
  })
  @UseGuards(JwtAuthGuard)
  async removeEmergencyContact(
    @CurrentUser() user: AuthUser,
    @Args('contactId', { type: () => Int }) contactId: number,
  ): Promise<boolean> {
    return this.sosService.removeContact(contactId, 'Rider', user.riderId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SOS Incidents
  // ─────────────────────────────────────────────────────────────────────────

  @Query(() => SosIncidentType, {
    nullable: true,
    description: 'حادثة SOS نشطة حالياً (إن وُجدت)',
  })
  @UseGuards(JwtAuthGuard)
  async myActiveSos(
    @CurrentUser() user: AuthUser,
  ): Promise<SosIncidentType | null> {
    return this.sosService.getActiveSos(SosTriggeredBy.Rider, user.riderId);
  }

  @Mutation(() => SosIncidentType, {
    description: '🚨 تفعيل حادثة طوارئ',
  })
  @UseGuards(JwtAuthGuard)
  // SOS: 10/60s — الشخص الفزع قد يضغط مراراً. الـ service idempotent
  // (لا ينشئ حادثة جديدة لو فيه Active للمستخدم نفسه).
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  async triggerSos(
    @CurrentUser() user: AuthUser,
    @Args('input') input: TriggerSosInput,
  ): Promise<SosIncidentType> {
    return this.sosService.triggerSos({
      triggeredBy: SosTriggeredBy.Rider,
      triggeredById: user.riderId,
      latitude: input.latitude,
      longitude: input.longitude,
      orderId: input.orderId,
    });
  }

  @Mutation(() => SosIncidentType, {
    description: 'إلغاء حادثة طوارئ (إنذار خاطئ)',
  })
  @UseGuards(JwtAuthGuard)
  async cancelSos(
    @CurrentUser() user: AuthUser,
    @Args('incidentId', { type: () => Int }) incidentId: number,
  ): Promise<SosIncidentType> {
    try {
      return await this.sosService.cancelSos(
        incidentId,
        SosTriggeredBy.Rider,
        user.riderId,
      );
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(`فشل إلغاء الـ SOS: ${(e as Error).message}`);
    }
  }
}
