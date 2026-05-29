import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class PoolMemberType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  riderId!: number;

  @Field({ nullable: true })
  riderName?: string;

  @Field()
  role!: string;

  @Field()
  joinedAt!: Date;
}

@ObjectType()
export class PoolType {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;

  @Field()
  type!: string;

  @Field(() => Int)
  ownerId!: number;

  @Field()
  active!: boolean;

  @Field(() => [PoolMemberType])
  members!: PoolMemberType[];

  @Field()
  createdAt!: Date;
}
