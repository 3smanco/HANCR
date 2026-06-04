import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
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
  ): Promise<AdminComplaintDetailType> {
    // TODO: actor id from JWT (I5)
    return this.service.updateStatus(input, 0);
  }

  @Mutation(() => AdminComplaintDetailType, {
    description: 'إضافة ملاحظة على شكوى',
  })
  @UseGuards(AdminJwtGuard)
  addComplaintNote(
    @Args('input') input: AddComplaintNoteInput,
  ): Promise<AdminComplaintDetailType> {
    return this.service.addNote(input, 0);
  }
}
