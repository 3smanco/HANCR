import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

@ObjectType()
export class DriverDocumentType {
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field() url!: string;
  @Field({ nullable: true }) expiresAt?: Date;
  @Field() status!: string;
  @Field({ nullable: true }) rejectedReason?: string;
  @Field() uploadedAt!: Date;
  @Field({ nullable: true }) reviewedAt?: Date;
}

@InputType()
export class UploadDocumentInput {
  /** national_id | license | vehicle_registration | insurance | criminal_record */
  @Field()
  @IsString()
  @IsIn([
    'national_id',
    'license',
    'vehicle_registration',
    'insurance',
    'criminal_record',
  ])
  type!: string;

  @Field()
  @IsUrl({ require_tld: false })
  url!: string;

  @Field({ nullable: true })
  @IsOptional()
  expiresAt?: Date;
}
