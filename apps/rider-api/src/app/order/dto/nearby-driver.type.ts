import { ObjectType, Field, Float } from '@nestjs/graphql';

/**
 * نقطة سائق قريب للعرض على خريطة الراكب (إحداثيات فقط — بلا هوية).
 */
@ObjectType()
export class NearbyDriverPin {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;

  @Field(() => Float)
  heading!: number;
}
