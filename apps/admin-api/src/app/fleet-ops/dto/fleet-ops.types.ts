import { Field, Int, ObjectType } from '@nestjs/graphql';

/** خطورة قرب انتهاء وثيقة. */
export type ExpirySeverity = 'expired' | 'critical' | 'soon';

/** تنبيه انتهاء وثيقة سائق واحد ضمن الأسطول. */
@ObjectType()
export class DocExpiryAlert {
  @Field(() => Int) driverId!: number;
  @Field() driverName!: string;
  @Field({ nullable: true }) countryIso?: string;
  @Field({ nullable: true }) countryName?: string;
  @Field(() => Int, { nullable: true }) regionId?: number;
  /** نوع الوثيقة (license/insurance/vehicle_registration…). */
  @Field() docType!: string;
  @Field() expiresAt!: Date;
  /** أيام حتى الانتهاء (سالب = منتهٍ). */
  @Field(() => Int) daysToExpiry!: number;
  /** expired | critical (≤7د) | soon. */
  @Field() severity!: string;
}

/**
 * لوحة تنبيهات انتهاء وثائق الأسطول — رؤية إقليمية موحَّدة لكل الوثائق
 * المنتهية أو المقتربة من الانتهاء عبر سائقي النطاق (MOT/استمارة/تأمين/رخصة).
 */
@ObjectType()
export class FleetDocAlerts {
  @Field(() => [DocExpiryAlert]) alerts!: DocExpiryAlert[];
  /** نافذة الفحص بالأيام. */
  @Field(() => Int) withinDays!: number;
  @Field(() => Int) expiredCount!: number;
  @Field(() => Int) criticalCount!: number;
  @Field(() => Int) soonCount!: number;
}
