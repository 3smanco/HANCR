import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WalletOwnerType } from '@hancr/database';
import { WalletsService } from './wallets.service';
import {
  AdjustWalletInput,
  AdminWalletTransactionType,
  WalletBalanceListResult,
  WalletTransactionsResult,
} from './dto/wallet.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import type { AdminUser } from '../auth/admin-jwt.strategy';

@Resolver(() => WalletBalanceListResult)
export class WalletsResolver {
  constructor(private readonly service: WalletsService) {}

  @Query(() => WalletBalanceListResult, {
    description: 'قائمة الأرصدة لنوع مالك (Rider/Driver/Company)',
  })
  @UseGuards(AdminJwtGuard)
  adminWalletBalances(
    @Args('ownerType', { type: () => WalletOwnerType })
    ownerType: WalletOwnerType,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('search', { nullable: true }) search?: string,
  ): Promise<WalletBalanceListResult> {
    return this.service.listBalances(ownerType, page, limit, search);
  }

  @Query(() => WalletTransactionsResult, {
    description: 'سجل معاملات محفظة مالك معيّن',
  })
  @UseGuards(AdminJwtGuard)
  adminWalletTransactions(
    @Args('ownerType', { type: () => WalletOwnerType })
    ownerType: WalletOwnerType,
    @Args('ownerId', { type: () => Int }) ownerId: number,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<WalletTransactionsResult> {
    return this.service.listTransactions(ownerType, ownerId, limit, offset);
  }

  @Mutation(() => AdminWalletTransactionType, {
    description: 'تعديل يدوي للمحفظة (موجب=إضافة، سالب=خصم)',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('finance')
  adminAdjustWallet(
    @Args('input') input: AdjustWalletInput,
  ): Promise<AdminWalletTransactionType> {
    return this.service.adjust(input);
  }

  /**
   * N3 — Reverse a completed transaction with an audit trail.
   * Creates an offsetting AdminAdjustment tx; the original keeps its status
   * but gains metadata.reversedBy/reversedAt.
   */
  @Mutation(() => AdminWalletTransactionType, {
    description: 'إلغاء معاملة بإنشاء معاملة معاكسة (audit)',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('finance')
  adminReverseWalletTransaction(
    @Args('transactionId', { type: () => Int }) transactionId: number,
    @Args('reason') reason: string,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<AdminWalletTransactionType> {
    return this.service.reverseTransaction(transactionId, admin.adminId, reason);
  }
}
