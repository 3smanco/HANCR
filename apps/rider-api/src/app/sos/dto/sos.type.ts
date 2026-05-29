import { ObjectType, Field, Int, Float, InputType, registerEnumType } from '@nestjs/graphql';
import { SosStatus, SosTriggeredBy, EmergencyContactRelation } from '@hancr/database';

registerEnumType(SosStatus, { name: 'SosStatus' });
registerEnumType(SosTriggeredBy, { name: 'SosTriggeredBy' });
registerEnumType(EmergencyContactRelation, { name: 'EmergencyContactRelation' });

@ObjectType()
export class EmergencyContactType {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;

  @Field()
  phoneNumber!: string;

  @Field(() => EmergencyContactRelation)
  relation!: EmergencyContactRelation;

  @Field()
  autoShareTrips!: boolean;

  @Field(() => Int)
  priority!: number;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class SosIncidentType {
  @Field(() => Int)
  id!: number;

  @Field(() => SosTriggeredBy)
  triggeredBy!: SosTriggeredBy;

  @Field(() => Int)
  triggeredById!: number;

  @Field(() => Int, { nullable: true })
  orderId?: number;

  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;

  @Field(() => Float, { nullable: true })
  lastLatitude?: number;

  @Field(() => Float, { nullable: true })
  lastLongitude?: number;

  @Field(() => SosStatus)
  status!: SosStatus;

  @Field(() => Int)
  contactsNotified!: number;

  @Field()
  policeNotified!: boolean;

  @Field()
  createdAt!: Date;

  @Field({ nullable: true })
  resolvedAt?: Date;
}

@InputType()
export class AddEmergencyContactInput {
  @Field()
  name!: string;

  @Field()
  phoneNumber!: string;

  @Field(() => EmergencyContactRelation, {
    defaultValue: EmergencyContactRelation.Family,
  })
  relation!: EmergencyContactRelation;

  @Field({ defaultValue: false })
  autoShareTrips!: boolean;

  @Field(() => Int, { defaultValue: 0 })
  priority!: number;
}

@InputType()
export class TriggerSosInput {
  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;

  @Field(() => Int, { nullable: true })
  orderId?: number;
}
