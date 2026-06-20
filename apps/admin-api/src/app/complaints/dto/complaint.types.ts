import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

@ObjectType()
export class AdminComplaintActivityType {
  @Field(() => Int) id!: number;
  @Field() actorType!: string;
  @Field(() => Int, { nullable: true }) actorId?: number;
  @Field() type!: string;
  @Field({ nullable: true }) note?: string;
  @Field() createdAt!: Date;
}

@ObjectType()
export class AdminComplaintType {
  @Field(() => Int) id!: number;
  @Field(() => Int, { nullable: true }) orderId?: number;
  @Field() reportedByType!: string;
  @Field(() => Int) reportedById!: number;
  @Field({ nullable: true }) reporterName?: string;
  @Field() category!: string;
  @Field() description!: string;
  @Field() status!: string;
  @Field({ nullable: true }) resolutionNote?: string;
  @Field(() => Int, { nullable: true }) assignedTo?: number;
  @Field({ nullable: true }) dueAt?: Date;
  @Field() createdAt!: Date;
  @Field({ nullable: true }) resolvedAt?: Date;
}

@ObjectType()
export class AdminComplaintDetailType extends AdminComplaintType {
  @Field(() => [AdminComplaintActivityType])
  activities!: AdminComplaintActivityType[];
}

@ObjectType()
export class ComplaintListResult {
  @Field(() => [AdminComplaintType]) items!: AdminComplaintType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
  @Field(() => Int) submittedCount!: number;
  @Field(() => Int) underReviewCount!: number;
}

@InputType()
export class UpdateComplaintStatusInput {
  @Field(() => Int) complaintId!: number;

  @Field()
  @IsString()
  @IsIn(['submitted', 'under_review', 'resolved', 'dismissed'])
  status!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}

@InputType()
export class AddComplaintNoteInput {
  @Field(() => Int) complaintId!: number;

  @Field()
  @IsString()
  @MinLength(2)
  note!: string;
}
