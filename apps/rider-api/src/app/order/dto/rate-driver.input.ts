import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsNumber, IsOptional, Min, Max, IsString } from 'class-validator';

@InputType()
export class RateDriverInput {
  @Field(() => Int)
  @IsNumber()
  orderId!: number;

  /** التقييم من 1 إلى 5 */
  @Field(() => Float)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  /** تعليق اختياري */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;

  /** إكرامية اختيارية */
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tip?: number;
}
