import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

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
