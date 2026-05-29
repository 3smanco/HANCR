import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsNumber, MaxLength, Min, Max } from 'class-validator';

@InputType()
export class UpdateDriverInput {
  @Field({ nullable: true }) @IsOptional() @MaxLength(50) firstName?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(50) lastName?: string;
  @Field({ nullable: true }) @IsOptional() carBrand?: string;
  @Field({ nullable: true }) @IsOptional() carModel?: string;
  @Field({ nullable: true }) @IsOptional() carColor?: string;
  @Field({ nullable: true }) @IsOptional() plateNumber?: string;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsNumber() @Min(2010) @Max(2030) carYear?: number;
  @Field({ nullable: true }) @IsOptional() carPhotoUrl?: string;
  @Field({ nullable: true }) @IsOptional() avatarUrl?: string;
  @Field({ nullable: true }) @IsOptional() fcmToken?: string;
  @Field(() => [Int], { nullable: true }) @IsOptional() serviceIds?: number[];
}
