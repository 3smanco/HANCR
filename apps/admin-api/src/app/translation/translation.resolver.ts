import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { TranslationService } from './translation.service';
import { OrderConversation } from './dto/translation.types';

@Resolver()
export class TranslationResolver {
  constructor(
    private readonly translation: TranslationService,
    private readonly scope: ScopeService,
  ) {}

  /** محادثة رحلة مُحلَّلة لغوياً + إشارة الحاجة للترجمة. مُقيَّد بالنطاق. */
  @Query(() => OrderConversation, {
    description: 'محادثة رحلة محلّلة لغوياً',
  })
  @UseGuards(AdminJwtGuard)
  async orderConversation(
    @CurrentAdmin() admin: AdminUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<OrderConversation> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.translation.orderConversation(orderId, allowed);
  }
}
