import { InputType, Field, Float, ObjectType } from '@nestjs/graphql';
import { IsNumber, Min, Max } from 'class-validator';

@InputType()
export class GeoPointInput {
  @Field(() => Float)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Field(() => Float)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

@ObjectType()
export class GeoPointType {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;
}
