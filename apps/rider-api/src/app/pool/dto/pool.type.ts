import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class PoolMemberType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  riderId!: number;

  @Field({ nullable: true })
  riderName?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  role!: string;

  /** الحد الشهري لهذا العضو (إن وُجد) */
  @Field(() => Float, { nullable: true })
  monthlySpendLimit?: number;

  /** الإنفاق الشهري الحالي لهذا العضو */
  @Field(() => Float)
  currentMonthSpend!: number;

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

  /** هل المستخدم الحالي هو مالك المجموعة */
  @Field()
  isOwner!: boolean;

  @Field(() => [PoolMemberType])
  members!: PoolMemberType[];

  @Field()
  createdAt!: Date;
}
