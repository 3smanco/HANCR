import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class RiderType {
  @Field(() => Int)
  id!: number;

  @Field()
  phoneNumber!: string;

  @Field()
  countryCode!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  email?: string;

  @Field()
  banned!: boolean;

  @Field()
  active!: boolean;

  @Field(() => Float)
  balance!: number;

  @Field()
  currency!: string;

  @Field(() => Float)
  rating!: number;

  @Field(() => Int)
  totalRides!: number;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field()
  createdAt!: Date;
}
