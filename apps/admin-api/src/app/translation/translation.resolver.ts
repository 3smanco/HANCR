import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { TranslationService } from './translation.service';
import { TranslationProvider } from './translation.provider';
import {
  OrderConversation,
  ProviderReadiness,
  TranslationResult,
} from './dto/translation.types';

@Resolver()
export class TranslationResolver {
  constructor(
    private readonly translation: TranslationService,
    private readonly provider: TranslationProvider,
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

  /** ترجمة نصّ فعلية عبر المزوّد (تعمل فور إضافة `TRANSLATION_API_KEY`). */
  @Query(() => TranslationResult, { description: 'ترجمة نصّ' })
  @UseGuards(AdminJwtGuard)
  translateText(
    @Args('text') text: string,
    @Args('target', { nullable: true, defaultValue: 'ar' }) target: string,
  ): Promise<TranslationResult> {
    return this.provider.translate(text, target || 'ar');
  }

  /** جاهزية المزوّدين الفعلية (مفاتيح Twilio/Stripe/HyperPay/Moyasar/Translation). super فقط. */
  @Query(() => ProviderReadiness, {
    description: 'جاهزية المزوّدين الفعلية',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('super')
  providerReadiness(): ProviderReadiness {
    const has = (k: string) => {
      const v = process.env[k];
      return !!v && v.trim().length > 0;
    };
    const stripe = has('STRIPE_SECRET_KEY');
    const hyperpay = has('HYPERPAY_ACCESS_TOKEN');
    const moyasar = has('MOYASAR_API_KEY');
    return {
      smsTwilio:
        has('TWILIO_ACCOUNT_SID') &&
        has('TWILIO_AUTH_TOKEN') &&
        has('TWILIO_FROM_NUMBER'),
      paymentStripe: stripe,
      paymentHyperPay: hyperpay,
      paymentMoyasar: moyasar,
      translation: this.provider.isConfigured(),
      anyPayment: stripe || hyperpay || moyasar,
    };
  }
}
