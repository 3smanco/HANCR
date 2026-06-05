import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import {
  AnnouncementType,
  CreateAnnouncementInput,
  CreateGiftBatchInput,
  GiftBatchExportResult,
  GiftBatchType,
  ReferralStatsResult,
  UpdateAnnouncementInput,
} from './dto/marketing.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';

@Resolver()
@UseGuards(AdminJwtGuard, AdminRolesGuard)
@RequireRole('marketing')
export class MarketingResolver {
  constructor(private readonly service: MarketingService) {}

  // Announcements
  @Query(() => [AnnouncementType], { description: 'قائمة الإعلانات' })
  adminAnnouncements(): Promise<AnnouncementType[]> {
    return this.service.listAnnouncements();
  }

  @Mutation(() => AnnouncementType, { description: 'إنشاء إعلان' })
  createAnnouncement(
    @Args('input') input: CreateAnnouncementInput,
  ): Promise<AnnouncementType> {
    return this.service.createAnnouncement(input);
  }

  @Mutation(() => AnnouncementType, { description: 'تعديل إعلان' })
  updateAnnouncement(
    @Args('input') input: UpdateAnnouncementInput,
  ): Promise<AnnouncementType> {
    return this.service.updateAnnouncement(input);
  }

  @Mutation(() => Boolean, { description: 'حذف إعلان' })
  deleteAnnouncement(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.deleteAnnouncement(id);
  }

  // Gift batches
  @Query(() => [GiftBatchType], { description: 'دفعات الهدايا' })
  adminGiftBatches(): Promise<GiftBatchType[]> {
    return this.service.listGiftBatches();
  }

  @Mutation(() => GiftBatchExportResult, {
    description: 'إنشاء دفعة هدايا (تولّد N أكواد)',
  })
  createGiftBatch(
    @Args('input') input: CreateGiftBatchInput,
  ): Promise<GiftBatchExportResult> {
    return this.service.createGiftBatch(input);
  }

  @Query(() => [String], { description: 'أكواد دفعة (للتصدير CSV)' })
  giftBatchCodes(
    @Args('batchId', { type: () => Int }) batchId: number,
  ): Promise<string[]> {
    return this.service.getBatchCodes(batchId);
  }

  // Referrals (no role guard — read-only stats, super suffices)
  @Query(() => ReferralStatsResult, {
    description: 'إحصاءات الإحالات (أعلى المُحيلين)',
  })
  adminReferralStats(): Promise<ReferralStatsResult> {
    return this.service.referralStats();
  }
}
