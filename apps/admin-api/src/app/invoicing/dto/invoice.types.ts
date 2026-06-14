import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class InvoiceLine {
  @Field() label!: string;
  @Field(() => Float) amount!: number;
}

/**
 * فاتورة مُوطَّنة — تتكيّف مع النظام الضريبي للدولة (VAT خليج / GST أوروبا /
 * Sales أمريكا). الضريبة مُستخرَجة من المبلغ المُحاسَب (شامل الضريبة).
 */
@ObjectType()
export class InvoiceType {
  @Field(() => Int) orderId!: number;
  @Field() currency!: string;
  @Field() countryIso!: string;
  @Field() countryName!: string;
  /** بنود الفاتورة (أجرة/انتظار/خيارات/خصم). */
  @Field(() => [InvoiceLine]) lines!: InvoiceLine[];
  /** الصافي قبل الضريبة. */
  @Field(() => Float) net!: number;
  /** نوع الضريبة المعروض (VAT/GST/SALES/NONE). */
  @Field() taxType!: string;
  /** نسبة الضريبة %. */
  @Field(() => Float) taxRate!: number;
  /** مبلغ الضريبة. */
  @Field(() => Float) taxAmount!: number;
  /** الإجمالي (= المبلغ المُحاسَب). */
  @Field(() => Float) total!: number;
  /** التسمية الضريبية المحلية (اختياري). */
  @Field({ nullable: true }) taxLabel?: string;
  @Field({ nullable: true }) issuedAt?: Date;
}
