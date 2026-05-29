import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsNumber, Min, Max, IsArray, IsOptional } from 'class-validator';

@InputType()
export class UpdateLocationInput {
  @Field(() => Float)
  @IsNumber()
  @Min(-90) @Max(90)
  lat!: number;

  @Field(() => Float)
  @IsNumber()
  @Min(-180) @Max(180)
  lng!: number;

  /** الاتجاه بالدرجات (0-360) */
  @Field(() => Int, { defaultValue: 0 })
  @IsNumber()
  @Min(0) @Max(360)
  heading!: number;

  /** معرّفات الخدمات التي يقدمها السائق في هذه الجلسة */
  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray()
  serviceIds?: number[];
}
