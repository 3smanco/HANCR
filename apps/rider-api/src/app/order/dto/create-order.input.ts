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
  MaxLength,
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
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  addresses!: string[];

  /** معرّف الخدمة (Economy, VIP, ...) */
  @Field(() => Int)
  @IsNumber()
  @Min(1)
  serviceId!: number;

  /** معرّف المنطقة الجغرافية */
  @Field(() => Int)
  @IsNumber()
  @Min(1)
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

  /** وضع العائلة — يُفضّل سائقة وسلوكاً عائلياً */
  @Field({ nullable: true })
  @IsOptional()
  familyMode?: boolean;

  /** تفضيل صريح لسائقة (مستقل عن وضع العائلة) */
  @Field({ nullable: true })
  @IsOptional()
  preferFemaleDriver?: boolean;

  /** سائق مفضّل (VIP / اشتراك) — لو متاح وقريب يحجز له مباشرة */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  preferredDriverId?: number;

  // ===== G1 — وضع الليل =====

  /**
   * عند true:
   *  - لا surge (سعر ثابت)
   *  - مشاركة موقع تلقائية مع جهات الطوارئ
   *  - تفضيل السائقين night_approved (لاحقاً)
   */
  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  nightShift?: boolean;

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

  /** كود الخصم الذي يُدخله الراكب */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  couponCode?: string;

  // ===== Grocery Run =====

  /** قائمة المشتريات (Grocery Run) */
  @Field(() => [ShoppingListItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShoppingListItemInput)
  @ArrayMaxSize(50)
  shoppingList?: ShoppingListItemInput[];

  /** ميزانية الشراء (الحد الأقصى) */
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;
}

@InputType()
export class ShoppingListItemInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  @Max(99)
  qty!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}
