import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class BidOfferType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  driverId!: number;

  @Field({ nullable: true })
  driverName?: string;

  @Field({ nullable: true })
  driverAvatarUrl?: string;

  @Field(() => Float)
  driverRating!: number;

  @Field({ nullable: true })
  carBrand?: string;

  @Field({ nullable: true })
  carModel?: string;

  @Field({ nullable: true })
  carColor?: string;

  @Field({ nullable: true })
  plateNumber?: string;

  @Field(() => Float)
  offeredPrice!: number;

  @Field()
  currency!: string;

  @Field()
  status!: string;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class BidType {
  @Field(() => Int)
  id!: number;

  @Field()
  status!: string;

  @Field(() => Float)
  riderProposedPrice!: number;

  @Field()
  currency!: string;

  @Field()
  expiresAt!: Date;

  @Field(() => [BidOfferType])
  offers!: BidOfferType[];

  @Field()
  createdAt!: Date;
}
