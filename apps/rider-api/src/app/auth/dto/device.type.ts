import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DeviceType {
  @Field(() => Int)
  id!: number;

  @Field({ nullable: true })
  deviceName?: string;

  @Field({ nullable: true })
  platform?: string;

  @Field()
  lastActiveAt!: Date;

  /** هل هذه هي الجلسة الحالية (نفس الجهاز) */
  @Field()
  current!: boolean;

  @Field()
  createdAt!: Date;
}
