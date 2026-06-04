import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import {
  AddEmployeeInput,
  AdminCompanyEmployeeType,
  AdminCompanyType,
  CreateCompanyInput,
  TopUpCompanyInput,
  UpdateCompanyInput,
} from './dto/company.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Resolver(() => AdminCompanyType)
export class CompaniesResolver {
  constructor(private readonly service: CompaniesService) {}

  @Query(() => [AdminCompanyType], { description: 'قائمة الشركات' })
  @UseGuards(AdminJwtGuard)
  adminCompanies(): Promise<AdminCompanyType[]> {
    return this.service.findAll();
  }

  @Query(() => [AdminCompanyEmployeeType], { description: 'موظفو الشركة' })
  @UseGuards(AdminJwtGuard)
  companyEmployees(
    @Args('companyId', { type: () => Int }) companyId: number,
  ): Promise<AdminCompanyEmployeeType[]> {
    return this.service.listEmployees(companyId);
  }

  @Query(() => String, { description: 'تقرير CSV لطلبات الشركة' })
  @UseGuards(AdminJwtGuard)
  companyOrdersCsv(
    @Args('companyId', { type: () => Int }) companyId: number,
    @Args('from', { nullable: true }) from?: string,
    @Args('to', { nullable: true }) to?: string,
  ): Promise<string> {
    return this.service.ordersCsv(companyId, from, to);
  }

  @Mutation(() => AdminCompanyType, { description: 'إنشاء شركة' })
  @UseGuards(AdminJwtGuard)
  createCompany(
    @Args('input') input: CreateCompanyInput,
  ): Promise<AdminCompanyType> {
    return this.service.create(input);
  }

  @Mutation(() => AdminCompanyType, { description: 'تحديث شركة' })
  @UseGuards(AdminJwtGuard)
  updateCompany(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateCompanyInput,
  ): Promise<AdminCompanyType> {
    return this.service.update(id, input);
  }

  @Mutation(() => AdminCompanyType, { description: 'شحن رصيد الشركة' })
  @UseGuards(AdminJwtGuard)
  topUpCompany(
    @Args('input') input: TopUpCompanyInput,
  ): Promise<AdminCompanyType> {
    return this.service.topUp(input);
  }

  @Mutation(() => Boolean, { description: 'حذف شركة (وكل موظفيها)' })
  @UseGuards(AdminJwtGuard)
  deleteCompany(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.remove(id);
  }

  @Mutation(() => AdminCompanyEmployeeType, {
    description: 'إضافة موظف لشركة',
  })
  @UseGuards(AdminJwtGuard)
  addCompanyEmployee(
    @Args('input') input: AddEmployeeInput,
  ): Promise<AdminCompanyEmployeeType> {
    return this.service.addEmployee(input);
  }

  @Mutation(() => Boolean, { description: 'إلغاء صلاحية موظف' })
  @UseGuards(AdminJwtGuard)
  revokeCompanyEmployee(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.revokeEmployee(id);
  }
}
