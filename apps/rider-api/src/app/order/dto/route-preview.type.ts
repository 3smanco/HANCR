import { InputType, ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GeoPointInput } from './geo-point.input';

/** تفصيل الأجرة الشفّاف — يُعرَض للراكب قبل التأكيد. */
@ObjectType()
export class FareBreakdownType {
  @Field(() => Float) base!: number;
  @Field(() => Float) distance!: number;
  @Field(() => Float) time!: number;
  @Field(() => Float) wait!: number;
  @Field(() => Float) subtotal!: number;
  @Field(() => Float) zoneMultiplier!: number;
  @Field(() => Float) peakMultiplier!: number;
  @Field({ nullable: true }) peakLabel?: string;
  @Field(() => Float) surgeMultiplier!: number;
  @Field(() => Float) combinedMultiplier!: number;
  @Field(() => Float) beforeMinimum!: number;
  @Field(() => Float) minimumFee!: number;
  @Field(() => Boolean) minimumApplied!: boolean;
  @Field(() => Float) total!: number;
}

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

  /** تفصيل الأجرة (أساسي · مسافة · وقت · مضاعفات · حد أدنى · إجمالي) */
  @Field(() => FareBreakdownType, { nullable: true })
  breakdown?: FareBreakdownType;
}
