import { Args, Int, Mutation, Query, Resolver, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GqlThrottlerGuard } from '@hancr/observability';
import { LeadsService } from './leads.service';
import {
  AdminLeadType,
  LeadListResult,
  SubmitLeadInput,
  UpdateLeadStatusInput,
} from './dto/lead.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';

type GqlReqCtx = {
  req?: {
    ip?: string;
    headers?: Record<string, string | string[]>;
  };
};

@Resolver(() => AdminLeadType)
export class LeadsResolver {
  constructor(private readonly service: LeadsService) {}

  /**
   * PUBLIC mutation — called from the marketing site forms.
   * Throttled to 5 requests / 5 min per IP to discourage spam.
   */
  @Mutation(() => Boolean, { description: 'إرسال lead من الموقع التسويقي (عام)' })
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  submitLead(
    @Args('input') input: SubmitLeadInput,
    @Context() ctx: GqlReqCtx,
  ): Promise<boolean> {
    const ip = ctx.req?.ip;
    const uaRaw = ctx.req?.headers?.['user-agent'];
    const ua = Array.isArray(uaRaw) ? uaRaw[0] : uaRaw;
    return this.service.submit(input, ip, ua);
  }

  // ── Authenticated admin queries / mutations ─────────────────────────────

  @Query(() => LeadListResult, { description: 'قائمة الـ leads (لوحة الإدارة)' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops', 'support', 'marketing')
  adminLeads(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('type', { nullable: true }) type?: string,
    @Args('status', { nullable: true }) status?: string,
  ): Promise<LeadListResult> {
    return this.service.list(page, limit, type, status);
  }

  @Query(() => AdminLeadType, { description: 'تفاصيل lead' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops', 'support', 'marketing')
  adminLead(@Args('id', { type: () => Int }) id: number): Promise<AdminLeadType> {
    return this.service.getOne(id);
  }

  @Mutation(() => AdminLeadType, { description: 'تحديث حالة lead' })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops', 'support', 'marketing')
  updateLeadStatus(
    @Args('input') input: UpdateLeadStatusInput,
  ): Promise<AdminLeadType> {
    return this.service.updateStatus(input);
  }
}
