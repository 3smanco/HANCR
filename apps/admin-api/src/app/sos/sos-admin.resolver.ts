import { Resolver, Query, Mutation, Subscription, Args, Int } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { SosStatus } from '@hancr/database';
import { SOS_INCIDENT_CHANNEL, SOS_LOCATION_CHANNEL } from '@hancr/sos';
import { SosAdminService } from './sos-admin.service';
import {
  SosIncidentAdminType,
  SosLocationUpdateType,
  ResolveSosInput,
} from './dto/sos.type';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { PUB_SUB } from '../pubsub.provider';

@Resolver(() => SosIncidentAdminType)
export class SosAdminResolver {
  constructor(
    private readonly sosAdmin: SosAdminService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────

  @Query(() => [SosIncidentAdminType], {
    description: 'قائمة حوادث الطوارئ (نشطة افتراضياً)',
  })
  @UseGuards(AdminJwtGuard)
  async sosIncidents(
    @Args('statuses', {
      type: () => [SosStatus],
      nullable: true,
      description: 'فلترة بحالات معيَّنة. الافتراضي: Active فقط',
    })
    statuses: SosStatus[] | undefined,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<SosIncidentAdminType[]> {
    return this.sosAdmin.listIncidents({ statuses, limit, offset });
  }

  @Query(() => Int, {
    description: 'عدد الحوادث النشطة (لـ dashboard badge)',
  })
  @UseGuards(AdminJwtGuard)
  async activeSosCount(): Promise<number> {
    return this.sosAdmin.countActive();
  }

  @Query(() => SosIncidentAdminType, {
    description: 'جلب حادثة بمعرّفها',
  })
  @UseGuards(AdminJwtGuard)
  async sosIncident(
    @Args('incidentId', { type: () => Int }) incidentId: number,
  ): Promise<SosIncidentAdminType> {
    return this.sosAdmin.getById(incidentId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────

  @Mutation(() => SosIncidentAdminType, {
    description: 'إغلاق حادثة بقرار الأدمن',
  })
  @UseGuards(AdminJwtGuard)
  async resolveSosIncident(
    @Args('input') input: ResolveSosInput,
  ): Promise<SosIncidentAdminType> {
    return this.sosAdmin.resolveIncident({
      incidentId: input.incidentId,
      adminNote: input.adminNote,
      markPoliceNotified: input.markPoliceNotified,
    });
  }

  @Mutation(() => SosIncidentAdminType, {
    description: 'تصعيد حادثة (تواصل مع الشرطة)',
  })
  @UseGuards(AdminJwtGuard)
  async escalateSosIncident(
    @Args('incidentId', { type: () => Int }) incidentId: number,
    @Args('adminNote') adminNote: string,
  ): Promise<SosIncidentAdminType> {
    return this.sosAdmin.escalateIncident(incidentId, adminNote);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Subscription — Live SOS dashboard
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscription لاستقبال حوادث SOS الجديدة فوراً.
   *
   * Flow:
   *  1. Rider/Driver app يضغط زر SOS
   *  2. rider-api / driver-api يستدعي SosService.triggerSos()
   *  3. SosService ينشر event على Redis channel `SOS_INCIDENT_CREATED`
   *  4. admin-api (هنا) يستقبل + يبثّ للأدمن المُشترك عبر WebSocket
   */
  @Subscription(() => SosIncidentAdminType, {
    description: 'حوادث SOS جديدة (live)',
    name: 'sosIncidentCreated',
  })
  sosIncidentCreated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(SOS_INCIDENT_CHANNEL);
  }

  /** بثّ موقع الحوادث النشطة آنياً (لتحريك الماركر على الخريطة الحيّة). */
  @Subscription(() => SosLocationUpdateType, {
    description: 'تحديثات موقع حوادث SOS (live)',
    name: 'sosLocationUpdated',
  })
  sosLocationUpdated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(SOS_LOCATION_CHANNEL);
  }
}
