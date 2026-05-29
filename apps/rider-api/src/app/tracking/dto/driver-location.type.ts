import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

/**
 * DriverLocationType — موقع السائق المنشور عبر Redis pubSub.
 *
 * مطابق لـ apps/driver-api للحفاظ على تطابق الـ payload عبر الخدمتين
 * (driver-api ينشر، rider-api يستقبل عبر نفس Redis instance).
 */
@ObjectType()
export class DriverLocationType {
  @Field(() => Int)
  driverId!: number;

  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;

  @Field(() => Int)
  heading!: number;

  @Field()
  updatedAt!: Date;
}
