import { ObjectType, Field, Int, Float, InputType, registerEnumType } from '@nestjs/graphql';
import { SosStatus, SosTriggeredBy } from '@hancr/database';

registerEnumType(SosStatus, { name: 'SosStatus' });
registerEnumType(SosTriggeredBy, { name: 'SosTriggeredBy' });

/**
 * SosIncidentAdminType — رؤية الأدمن لحادثة SOS (مع كل التفاصيل).
 */
@ObjectType()
export class SosIncidentAdminType {
  @Field(() => Int) id!: number;
  @Field(() => SosTriggeredBy) triggeredBy!: SosTriggeredBy;
  @Field(() => Int) triggeredById!: number;
  @Field(() => Int, { nullable: true }) orderId?: number;

  @Field(() => Float) latitude!: number;
  @Field(() => Float) longitude!: number;
  @Field(() => Float, { nullable: true }) lastLatitude?: number;
  @Field(() => Float, { nullable: true }) lastLongitude?: number;
  @Field({ nullable: true }) lastLocationAt?: Date;

  @Field(() => SosStatus) status!: SosStatus;
  @Field({ nullable: true }) adminNote?: string;
  @Field(() => Int) contactsNotified!: number;
  @Field() policeNotified!: boolean;

  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
  @Field({ nullable: true }) resolvedAt?: Date;
}

@InputType()
export class ResolveSosInput {
  @Field(() => Int)
  incidentId!: number;

  @Field({ nullable: true, description: 'سبب الإغلاق / ملاحظة' })
  adminNote?: string;

  @Field({ defaultValue: false, description: 'تم إبلاغ الشرطة' })
  markPoliceNotified!: boolean;
}

/** بثّ موقع حادثة حيّ (live) */
@ObjectType()
export class SosLocationUpdateType {
  @Field(() => Int) incidentId!: number;
  @Field(() => Float) latitude!: number;
  @Field(() => Float) longitude!: number;
  @Field() at!: string;
}
