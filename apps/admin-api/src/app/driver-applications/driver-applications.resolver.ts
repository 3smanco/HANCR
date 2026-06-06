import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GqlThrottlerGuard } from '@hancr/observability';
import { DriverApplicationsService } from './driver-applications.service';
import { ApplicationUploadUrlService } from './application-upload-url.service';
import {
  ApplicationDocUploadUrlType,
  DriverApplicationListResult,
  DriverApplicationType,
  GenerateApplicationDocUploadUrlInput,
  SubmitDriverApplicationInput,
  UpdateApplicationStatusInput,
} from './dto/driver-application.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import type { AdminUser } from '../auth/admin-jwt.strategy';

type GqlReqCtx = {
  req?: { ip?: string; headers?: Record<string, string | string[]> };
};

@Resolver(() => DriverApplicationType)
export class DriverApplicationsResolver {
  constructor(
    private readonly service: DriverApplicationsService,
    private readonly uploads: ApplicationUploadUrlService,
  ) {}

  // ── Public — called from the marketing-site wizard ──────────────────────

  /**
   * M3 — Application status lookup for the applicant. The phone acts as a
   * lightweight verifier so anyone holding the application ID can't peek.
   * Returns only the public-safe fields.
   */
  @Query(() => DriverApplicationType, {
    nullable: true,
    description: 'فحص حالة طلب تسجيل سائق بالـ ID والجوال',
  })
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 300_000 } })
  async checkDriverApplicationStatus(
    @Args('applicationId', { type: () => Int }) applicationId: number,
    @Args('phone') phone: string,
  ): Promise<DriverApplicationType | null> {
    return this.service.findByIdAndPhone(applicationId, phone.trim());
  }


  /** Sign one document for upload (PUT). Rate-limited to discourage abuse. */
  @Mutation(() => ApplicationDocUploadUrlType, {
    description: 'توليد رابط رفع موقَّع لوثيقة من نموذج التسجيل العام',
  })
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 300_000 } })
  generateApplicationDocUploadUrl(
    @Args('input') input: GenerateApplicationDocUploadUrlInput,
  ): Promise<ApplicationDocUploadUrlType> {
    return this.uploads.generate(input);
  }

  /** Submit the full driver application. Rate-limited per IP. */
  @Mutation(() => DriverApplicationType, {
    description: 'إرسال طلب تسجيل سائق من الموقع التسويقي',
  })
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  submitDriverApplication(
    @Args('input') input: SubmitDriverApplicationInput,
    @Context() ctx: GqlReqCtx,
  ): Promise<DriverApplicationType> {
    const ip = ctx.req?.ip;
    const uaRaw = ctx.req?.headers?.['user-agent'];
    const ua = Array.isArray(uaRaw) ? uaRaw[0] : uaRaw;
    return this.service.submit(input, ip, ua);
  }

  // ── Admin queries / mutations ───────────────────────────────────────────

  @Query(() => DriverApplicationListResult, { description: 'طلبات تسجيل السائقين' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops', 'support')
  adminDriverApplications(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('status', { nullable: true }) status?: string,
  ): Promise<DriverApplicationListResult> {
    return this.service.list(page, limit, status);
  }

  @Query(() => DriverApplicationType, { description: 'تفاصيل طلب' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops', 'support')
  adminDriverApplication(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DriverApplicationType> {
    return this.service.getOne(id);
  }

  @Mutation(() => DriverApplicationType, { description: 'تحديث حالة طلب تسجيل سائق' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  updateDriverApplicationStatus(
    @Args('input') input: UpdateApplicationStatusInput,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<DriverApplicationType> {
    return this.service.updateStatus(input, admin.adminId);
  }
}
