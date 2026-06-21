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

  @Field({ nullable: true })
  imageUrl?: string;

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

/** حدث محادثة عابر (يكتب الآن / تمّت القراءة) */
@ObjectType()
export class ChatEventType {
  @Field(() => Int)
  orderId!: number;

  /** الطرف صاحب الحدث: 'rider' | 'driver' */
  @Field()
  actorType!: string;
}
