import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GeoPointInput } from './geo-point.input';

@InputType()
export class CreateOrderInput {
  /** نقاط المسار [الانطلاق, ...محطات اختيارية, الوجهة] */
  @Field(() => [GeoPointInput])
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => GeoPointInput)
  points!: GeoPointInput[];

  /** العناوين النصية المقابلة */
  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  addresses!: string[];

  /** معرّف الخدمة (Economy, VIP, ...) */
  @Field(() => Int)
  @IsNumber()
  serviceId!: number;

  /** معرّف المنطقة الجغرافية */
  @Field(() => Int)
  @IsNumber()
  regionId!: number;

  // ===== Ride Moods =====

  /** رحلة صامتة */
  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  quietRide?: boolean;

  /** درجة الحرارة المطلوبة (18-28 درجة) */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(28)
  requestedTemperature?: number;

  /** إيقاف الموسيقى */
  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  audioOff?: boolean;

  /** تشفير رقم الهاتف */
  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  numberMasked?: boolean;

  // ===== OTP للتسليم الآمن =====

  /** هاتف المستلم (لتوليد OTP) */
  @Field({ nullable: true })
  @IsOptional()
  receiverPhone?: string;

  /** اسم المستلم */
  @Field({ nullable: true })
  @IsOptional()
  receiverName?: string;

  // ===== Bid Mode =====

  /** هل هذا طلب Bid Mode */
  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isBidOrder?: boolean;

  // ===== Chauffeur بالساعة =====

  /** عدد الساعات (للحجز بالساعة) */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  bookedHours?: number;

  // ===== الدفع =====

  /** طريقة الدفع: Cash | SavedPaymentMethod | PaymentGateway | Wallet */
  @Field({ nullable: true, defaultValue: 'Cash' })
  @IsOptional()
  paymentMode?: string;

  // ===== الحجز المسبق =====

  /** وقت الحجز المسبق */
  @Field({ nullable: true })
  @IsOptional()
  scheduledAt?: Date;

  // ===== الأسعار =====

  /** السعر المقترح في Bid Mode */
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  proposedPrice?: number;

  /** معرّف القسيمة */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  couponId?: number;
}
