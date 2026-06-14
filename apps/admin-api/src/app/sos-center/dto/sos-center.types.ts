import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/** مستوى أولوية حادثة SOS مُحتسَب. */
export type SosPriority = 'critical' | 'high' | 'normal';

/** حادثة SOS نشطة مُثراة بالدولة + رقم الطوارئ السيادي. */
@ObjectType()
export class SosCenterIncident {
  @Field(() => Int) id!: number;
  @Field() triggeredBy!: string; // Rider | Driver | System
  @Field(() => Int) triggeredById!: number;
  @Field(() => Int, { nullable: true }) orderId?: number;
  @Field() status!: string;
  @Field(() => Float, { nullable: true }) lat?: number;
  @Field(() => Float, { nullable: true }) lng?: number;
  @Field() policeNotified!: boolean;
  @Field(() => Int) contactsNotified!: number;
  @Field() createdAt!: Date;
  /** عمر الحادثة بالدقائق. */
  @Field(() => Int) ageMinutes!: number;
  /** هل يوجد تحديث موقع حيّ؟ */
  @Field() hasLiveLocation!: boolean;
  /** الأولوية المُحتسَبة. */
  @Field() priority!: string;

  // إثراء جغرافي (عبر الطلب→المنطقة→الدولة)
  @Field(() => Int, { nullable: true }) regionId?: number;
  @Field({ nullable: true }) countryIso?: string;
  @Field({ nullable: true }) countryName?: string;
  @Field({ nullable: true }) flag?: string;
  /** رقم الطوارئ السيادي للدولة (999/911/112…). */
  @Field({ nullable: true }) emergencyNumber?: string;
}

/** تجميع حوادث SOS لدولة. */
@ObjectType()
export class SosCountryGroup {
  @Field({ nullable: true }) countryIso?: string;
  @Field({ nullable: true }) countryName?: string;
  @Field({ nullable: true }) flag?: string;
  @Field({ nullable: true }) emergencyNumber?: string;
  @Field(() => Int) activeCount!: number;
}

/**
 * مركز SOS العالمي — كل الحوادث النشطة عبر النطاق، مُثراة بالدولة ورقم الطوارئ
 * السيادي، مُرتَّبة بالأولوية + تجميع لكل دولة.
 */
@ObjectType()
export class GlobalSosCenter {
  @Field(() => [SosCenterIncident]) incidents!: SosCenterIncident[];
  @Field(() => [SosCountryGroup]) byCountry!: SosCountryGroup[];
  @Field(() => Int) totalActive!: number;
  @Field(() => Int) criticalCount!: number;
}
