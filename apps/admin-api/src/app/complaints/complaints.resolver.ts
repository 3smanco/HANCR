import { Resolver, Query, Mutation, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import {
  AddComplaintNoteInput,
  AdminComplaintDetailType,
  AdminComplaintType,
  ComplaintListResult,
  UpdateComplaintStatusInput,
} from './dto/complaint.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import type { AdminUser } from '../auth/admin-jwt.strategy';

@Resolver(() => AdminComplaintType)
export class ComplaintsResolver {
  constructor(private readonly service: ComplaintsService) {}

  @Query(() => ComplaintListResult, { description: 'قائمة الشكاوى' })
  @UseGuards(AdminJwtGuard)
  adminComplaints(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('status', { nullable: true }) status?: string,
  ): Promise<ComplaintListResult> {
    return this.service.list(page, limit, status);
  }

  @Query(() => AdminComplaintDetailType, {
    description: 'تفاصيل شكوى مع timeline',
  })
  @UseGuards(AdminJwtGuard)
  adminComplaintDetail(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminComplaintDetailType> {
    return this.service.getDetail(id);
  }

  @Mutation(() => AdminComplaintDetailType, {
    description: 'تحديث حالة شكوى',
  })
  @UseGuards(AdminJwtGuard)
  updateComplaintStatus(
    @Args('input') input: UpdateComplaintStatusInput,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<AdminComplaintDetailType> {
    return this.service.updateStatus(input, admin.adminId);
  }

  @Mutation(() => AdminComplaintDetailType, {
    description: 'إضافة ملاحظة على شكوى',
  })
  @UseGuards(AdminJwtGuard)
  addComplaintNote(
    @Args('input') input: AddComplaintNoteInput,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<AdminComplaintDetailType> {
    return this.service.addNote(input, admin.adminId);
  }

  @Mutation(() => AdminComplaintDetailType, { description: 'إسناد شكوى لموظف' })
  @UseGuards(AdminJwtGuard)
  assignComplaint(
    @Args('complaintId', { type: () => Int }) complaintId: number,
    @Args('assigneeId', { type: () => Int }) assigneeId: number,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<AdminComplaintDetailType> {
    return this.service.assign(complaintId, assigneeId, admin.adminId);
  }

  @Mutation(() => AdminComplaintDetailType, {
    description: 'إجراء مالي على شكوى (رد أموال/كوبون لمحفظة المُبلِّغ)',
  })
  @UseGuards(AdminJwtGuard)
  refundComplaint(
    @Args('complaintId', { type: () => Int }) complaintId: number,
    @Args('amount', { type: () => Float }) amount: number,
    @Args('voucher', { nullable: true, defaultValue: false }) voucher: boolean,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<AdminComplaintDetailType> {
    return this.service.refund(complaintId, amount, admin.adminId, voucher);
  }
}
