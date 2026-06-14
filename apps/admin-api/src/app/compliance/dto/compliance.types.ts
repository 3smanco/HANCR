import { Field, Int, ObjectType } from '@nestjs/graphql';

/** حالة وثيقة واحدة مقابل متطلّب الدولة. */
export type DocState =
  | 'ok'
  | 'expiring'
  | 'expired'
  | 'pending'
  | 'rejected'
  | 'missing';

/** الحالة الكلّية لامتثال السائق. */
export type ComplianceStatus = 'compliant' | 'pending' | 'non_compliant';

@ObjectType()
export class DocComplianceItem {
  /** نوع الوثيقة (national_id/license/...). */
  @Field() type!: string;
  /** حالة الوثيقة مقابل المتطلّب. */
  @Field() state!: string;
  /** هل الوثيقة مطلوبة في هذه الدولة؟ (غير المطلوبة تُعرَض للعلم). */
  @Field() required!: boolean;
  /** تاريخ الانتهاء إن وُجد. */
  @Field({ nullable: true }) expiresAt?: Date;
  /** أيام حتى الانتهاء (سالب = منتهٍ). */
  @Field(() => Int, { nullable: true }) daysToExpiry?: number;
}

/**
 * امتثال وثائق السائق — يتكيّف مع متطلّبات دولته (`CountryEntity.docRequirements`):
 * رخصة قطرية / PCO لندن / DMV كاليفورنيا… كل دولة قائمتها.
 */
@ObjectType()
export class DriverComplianceType {
  @Field(() => Int) driverId!: number;
  @Field() driverName!: string;
  @Field({ nullable: true }) countryIso?: string;
  @Field({ nullable: true }) countryName?: string;
  /** الحالة الكلّية. */
  @Field() status!: string;
  /** الوثائق المطلوبة الناقصة. */
  @Field(() => [String]) missing!: string[];
  /** الوثائق المطلوبة المنتهية. */
  @Field(() => [String]) expired!: string[];
  /** وثائق ستنتهي قريباً (≤30 يوماً). */
  @Field(() => [String]) expiringSoon!: string[];
  /** تفصيل كل وثيقة. */
  @Field(() => [DocComplianceItem]) items!: DocComplianceItem[];
}
