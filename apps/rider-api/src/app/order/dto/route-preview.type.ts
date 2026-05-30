import { InputType, ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { GeoPointInput } from './geo-point.input';

@InputType()
export class RoutePreviewInput {
  @Field(() => GeoPointInput)
  origin!: GeoPointInput;

  @Field(() => GeoPointInput)
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
