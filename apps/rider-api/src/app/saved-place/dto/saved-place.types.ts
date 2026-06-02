import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsLatitude, IsLongitude, IsString, MaxLength } from 'class-validator';

@ObjectType()
export class SavedPlaceType {
  @Field(() => Int) id!: number;
  @Field() label!: string;
  @Field() address!: string;
  @Field(() => Float) lat!: number;
  @Field(() => Float) lng!: number;
  @Field() type!: string;
}

@InputType()
export class SavedPlaceInput {
  @Field()
  @IsString()
  @MaxLength(60)
  label!: string;

  @Field()
  @IsString()
  @MaxLength(255)
  address!: string;

  @Field(() => Float)
  @IsLatitude()
  lat!: number;

  @Field(() => Float)
  @IsLongitude()
  lng!: number;

  @Field({ nullable: true })
  @IsString()
  type?: string;
}
