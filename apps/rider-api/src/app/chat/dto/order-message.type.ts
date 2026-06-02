import { Field, Int, ObjectType } from '@nestjs/graphql';

/** رسالة محادثة بين الراكب والسائق */
@ObjectType()
export class OrderMessageType {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  orderId!: number;

  @Field()
  message!: string;

  /** 'rider' | 'driver' */
  @Field()
  senderType!: string;

  @Field(() => Int)
  senderId!: number;

  @Field()
  isRead!: boolean;

  @Field()
  sentAt!: Date;
}
