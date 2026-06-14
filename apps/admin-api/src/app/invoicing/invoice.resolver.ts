import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { InvoiceService } from './invoice.service';
import { InvoiceType } from './dto/invoice.types';

@Resolver()
export class InvoiceResolver {
  constructor(
    private readonly invoices: InvoiceService,
    private readonly scope: ScopeService,
  ) {}

  /** فاتورة مُوطَّنة لطلب (ضريبة حسب دولة الطلب). مُقيَّدة بنطاق المشغّل. */
  @Query(() => InvoiceType, { description: 'فاتورة طلب مُوطَّنة' })
  @UseGuards(AdminJwtGuard)
  async orderInvoice(
    @CurrentAdmin() admin: AdminUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<InvoiceType> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.invoices.buildInvoice(orderId, allowed);
  }
}
