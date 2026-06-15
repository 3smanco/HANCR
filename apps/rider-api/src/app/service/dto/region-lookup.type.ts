import { ObjectType, Field, Int } from '@nestjs/graphql';

/** ملخّص منطقة جغرافية — يُستخدم لتحديد منطقة الزائر وعرض المدن المفعّلة. */
@ObjectType()
export class RegionLookupType {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;

  @Field()
  nameEn!: string;

  @Field()
  currency!: string;

  @Field(() => Int, { nullable: true })
  countryId?: number;

  @Field(() => Int, { nullable: true })
  cityId?: number;
}
