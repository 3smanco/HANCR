import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsNumber,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GeoPointInput } from '../../order/dto/geo-point.input';

@InputType()
export class CreateBidInput {
  /** نقاط المسار */
  @Field(() => [GeoPointInput])
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => GeoPointInput)
  points!: GeoPointInput[];

  /** العناوين */
  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(2)
  addresses!: string[];

  /** السعر الذي يقترحه الراكب */
  @Field(() => Float)
  @IsNumber()
  @Min(1)
  proposedPrice!: number;

  /** معرّف الخدمة */
  @Field(() => Int)
  @IsNumber()
  serviceId!: number;

  /** معرّف المنطقة */
  @Field(() => Int)
  @IsNumber()
  regionId!: number;
}
