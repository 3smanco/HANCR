import { Resolver, Query, Mutation, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { IntelligenceService } from './intelligence.service';
import { SurgeStateType } from './intelligence.types';

@Resolver()
export class IntelligenceResolver {
  constructor(private readonly service: IntelligenceService) {}

  @Query(() => SurgeStateType, {
    description: 'N11 — حالة التسعير الديناميكي (surge) والمقترح',
  })
  @UseGuards(AdminJwtGuard)
  surgeState(): Promise<SurgeStateType> {
    return this.service.surgeState();
  }

  @Mutation(() => Int, {
    description: 'N11 — إرسال الحملات المجدولة المستحقة فوراً (يدوي)',
  })
  @UseGuards(AdminJwtGuard)
  dispatchDueCampaigns(): Promise<number> {
    return this.service.dispatchDueCampaigns();
  }
}
