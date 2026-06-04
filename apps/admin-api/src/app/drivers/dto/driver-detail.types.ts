import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString } from 'class-validator';

@ObjectType()
export class AdminDriverDocumentType {
  @Field(() => Int) id!: number;
  @Field(() => Int) driverId!: number;
  @Field() type!: string;
  @Field() url!: string;
  @Field({ nullable: true }) expiresAt?: Date;
  @Field() status!: string;
  @Field({ nullable: true }) rejectedReason?: string;
  @Field() uploadedAt!: Date;
  @Field({ nullable: true }) reviewedAt?: Date;
  @Field(() => Int, { nullable: true }) reviewedBy?: number;
}

@ObjectType()
export class AdminDriverOrderSummaryType {
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field() status!: string;
  @Field(() => Float) cost!: number;
  @Field() currency!: string;
  @Field() createdOn!: Date;
}

@ObjectType()
export class AdminDriverTransactionType {
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field() direction!: string;
  @Field(() => Float) amount!: number;
  @Field(() => Float) balanceAfter!: number;
  @Field() currency!: string;
  @Field() status!: string;
  @Field({ nullable: true }) description?: string;
  @Field() createdAt!: Date;
}

@ObjectType()
export class AdminDriverReviewType {
  @Field(() => Int) id!: number;
  @Field(() => Int) orderId!: number;
  @Field(() => Float) rating!: number;
  @Field({ nullable: true }) comment?: string;
  @Field() createdAt!: Date;
}

@ObjectType()
export class AdminDriverDetailType {
  // الأساسيات (subset)
  @Field(() => Int) id!: number;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field() phoneNumber!: string;
  @Field({ nullable: true }) avatarUrl?: string;
  @Field() status!: string;
  @Field() active!: boolean;
  @Field() banned!: boolean;
  @Field(() => Float) rating!: number;
  @Field(() => Int) ratingCount!: number;
  @Field({ nullable: true }) carBrand?: string;
  @Field({ nullable: true }) carModel?: string;
  @Field({ nullable: true }) carColor?: string;
  @Field({ nullable: true }) plateNumber?: string;
  @Field(() => Int, { nullable: true }) carYear?: number;
  @Field(() => Float) balance!: number;
  @Field() currency!: string;
  @Field({ nullable: true }) gender?: string;
  @Field() kidsApproved!: boolean;
  @Field() nightApproved!: boolean;
  @Field() approvalStatus!: string;
  @Field({ nullable: true }) rejectionReason?: string;
  @Field() createdAt!: Date;

  // التبويبات
  @Field(() => [AdminDriverDocumentType]) documents!: AdminDriverDocumentType[];
  @Field(() => [AdminDriverOrderSummaryType])
  recentOrders!: AdminDriverOrderSummaryType[];
  @Field(() => [AdminDriverTransactionType])
  recentTransactions!: AdminDriverTransactionType[];
  @Field(() => [AdminDriverReviewType]) reviews!: AdminDriverReviewType[];
}

@InputType()
export class SetDriverStatusInput {
  @Field(() => Int) @IsString() driverId!: number;

  @Field()
  @IsString()
  @IsIn([
    'pending_docs',
    'docs_uploaded',
    'approved',
    'soft_reject',
    'hard_reject',
  ])
  approvalStatus!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}

@InputType()
export class ReviewDocumentInput {
  @Field(() => Int) documentId!: number;

  @Field()
  approve!: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rejectedReason?: string;
}
