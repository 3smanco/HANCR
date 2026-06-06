import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export const APPLICATION_STATUSES = [
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'needs_more_info',
] as const;

export const DOC_TYPES = [
  'national_id',
  'license',
  'vehicle_registration',
  'insurance',
  'profile_photo',
] as const;

@ObjectType()
export class DriverApplicationType {
  @Field(() => Int) id!: number;
  @Field() fullName!: string;
  @Field() email!: string;
  @Field() phone!: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) nationalIdNumber?: string;
  @Field({ nullable: true }) dateOfBirth?: string;
  @Field({ nullable: true }) vehicleBrand?: string;
  @Field({ nullable: true }) vehicleModel?: string;
  @Field(() => Int, { nullable: true }) vehicleYear?: number;
  @Field({ nullable: true }) vehicleColor?: string;
  @Field({ nullable: true }) plateNumber?: string;
  @Field({ nullable: true }) docNationalIdUrl?: string;
  @Field({ nullable: true }) docLicenseUrl?: string;
  @Field({ nullable: true }) docVehicleRegistrationUrl?: string;
  @Field({ nullable: true }) docInsuranceUrl?: string;
  @Field({ nullable: true }) docProfilePhotoUrl?: string;
  @Field() status!: string;
  @Field({ nullable: true }) rejectionReason?: string;
  @Field({ nullable: true }) reviewedAt?: Date;
  @Field() createdAt!: Date;
}

@ObjectType()
export class DriverApplicationListResult {
  @Field(() => [DriverApplicationType]) items!: DriverApplicationType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) submittedCount!: number;
  @Field(() => Int) inReviewCount!: number;
}

@ObjectType()
export class ApplicationDocUploadUrlType {
  @Field() uploadUrl!: string;
  @Field() publicUrl!: string;
  @Field() objectKey!: string;
  @Field() expiresIn!: number;
}

@InputType()
export class GenerateApplicationDocUploadUrlInput {
  @Field()
  @IsString()
  @IsIn(DOC_TYPES as unknown as string[])
  type!: string;

  @Field({ defaultValue: 'image/jpeg' })
  @IsString()
  @Matches(/^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/, {
    message: 'contentType must be image/jpeg|png|webp or application/pdf',
  })
  contentType!: string;
}

@InputType()
export class SubmitDriverApplicationInput {
  @Field() @IsString() @Length(3, 120) fullName!: string;
  @Field() @IsEmail() @MaxLength(160) email!: string;
  @Field()
  @IsString()
  @Matches(/^\+?[0-9]{8,20}$/, { message: 'invalid phone format' })
  phone!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(80) city?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(40) nationalIdNumber?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() dateOfBirth?: string;

  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(60) vehicleBrand?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(60) vehicleModel?: string;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() vehicleYear?: number;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(40) vehicleColor?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(30) plateNumber?: string;

  @Field({ nullable: true }) @IsOptional() @IsString() docNationalIdUrl?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() docLicenseUrl?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() docVehicleRegistrationUrl?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() docInsuranceUrl?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() docProfilePhotoUrl?: string;
}

@InputType()
export class UpdateApplicationStatusInput {
  @Field(() => Int) applicationId!: number;

  @Field()
  @IsString()
  @IsIn(APPLICATION_STATUSES as unknown as string[])
  status!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
