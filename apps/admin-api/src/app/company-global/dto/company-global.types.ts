import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/** إنفاق شركة في دولة واحدة (أصلي + محوَّل لعملة الأساس). */
@ObjectType()
export class CompanyCountrySpend {
  @Field({ nullable: true }) countryIso?: string;
  @Field() countryName!: string;
  @Field({ nullable: true }) flag?: string;
  @Field() currency!: string;
  @Field(() => Int) orders!: number;
  @Field(() => Float) spentNative!: number;
  @Field(() => Float) spentBase!: number;
}

/**
 * ملف شركة عالمي (MNC) — مقرّ يدفع رحلات فروعه عبر الدول. الإنفاق مدمَج بعملة
 * الأساس + موزّع لكل دولة؛ يُعرَف ما إن كانت الشركة متعددة الجنسيات.
 */
@ObjectType()
export class CompanyGlobalProfile {
  @Field(() => Int) companyId!: number;
  @Field() name!: string;
  @Field() status!: string;
  @Field() currency!: string;
  @Field(() => Float) balance!: number;
  /** إجمالي الإنفاق (عملة الأساس) عبر كل الدول. */
  @Field(() => Float) totalSpentBase!: number;
  @Field() baseCurrency!: string;
  /** عدد الدول النشطة. */
  @Field(() => Int) countriesActive!: number;
  /** هل الشركة متعددة الجنسيات (نشطة في أكثر من دولة)؟ */
  @Field() multinational!: boolean;
  @Field(() => [CompanyCountrySpend]) byCountry!: CompanyCountrySpend[];
}
