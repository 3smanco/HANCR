import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OperatorsService } from './operators.service';
import {
  AdminOperatorType,
  CreateOperatorInput,
  ResetOperatorPasswordInput,
  UpdateOperatorInput,
} from './dto/operator.types';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import { AdminUser } from '../auth/admin-jwt.strategy';

/**
 * I5 — إدارة حسابات المشرفين (super-only).
 */
@Resolver(() => AdminOperatorType)
@UseGuards(AdminJwtGuard, AdminRolesGuard)
@RequireRole('super')
export class OperatorsResolver {
  constructor(private readonly service: OperatorsService) {}

  @Query(() => [AdminOperatorType], { description: 'قائمة المشرفين' })
  adminOperators(): Promise<AdminOperatorType[]> {
    return this.service.list();
  }

  @Mutation(() => AdminOperatorType, { description: 'إضافة مشرف' })
  createOperator(
    @Args('input') input: CreateOperatorInput,
  ): Promise<AdminOperatorType> {
    return this.service.create(input);
  }

  @Mutation(() => AdminOperatorType, { description: 'تحديث مشرف' })
  updateOperator(
    @Args('input') input: UpdateOperatorInput,
  ): Promise<AdminOperatorType> {
    return this.service.update(input);
  }

  @Mutation(() => AdminOperatorType, { description: 'إعادة تعيين كلمة المرور' })
  resetOperatorPassword(
    @Args('input') input: ResetOperatorPasswordInput,
  ): Promise<AdminOperatorType> {
    return this.service.resetPassword(input);
  }

  @Mutation(() => Boolean, { description: 'حذف مشرف' })
  deleteOperator(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<boolean> {
    return this.service.remove(id, admin.adminId);
  }
}
