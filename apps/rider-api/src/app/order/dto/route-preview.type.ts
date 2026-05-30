import { InputType, ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GeoPointInput } from './geo-point.input';

@InputType()
export class RoutePreviewInput {
  @Field(() => GeoPointInput)
  @ValidateNested()
  @Type(() => GeoPointInput)
  origin!: GeoPointInput;

  @Field(() => GeoPointInput)
  @ValidateNested()
  @Type(() => GeoPointInput)
  destination!: GeoPointInput;

  @Field(() => Int)
  @IsNumber()
  serviceId!: number;
}

@ObjectType()
export class RoutePreviewType {
  /** مسافة الطريق الفعلية بالأمتار */
  @Field(() => Int)
  distanceMeters!: number;

  /** مدة القيادة المتوقعة بالثواني */
  @Field(() => Int)
  durationSeconds!: number;

  /** الأجرة التقديرية */
  @Field(() => Float)
  estimatedFare!: number;

  @Field()
  currency!: string;

  /** Polyline المشفّر لرسم المسار */
  @Field({ nullable: true })
  polyline?: string;
}
