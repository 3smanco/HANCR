import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SupportConversationType {
  @Field(() => Int) id!: number;
  @Field() status!: string;
  @Field(() => Int, { nullable: true }) assignedAgentId?: number;
  @Field({ nullable: true }) lastMessageAt?: Date;
  @Field() createdAt!: Date;
}

@ObjectType()
export class SupportMessageType {
  @Field(() => Int) id!: number;
  @Field(() => Int) conversationId!: number;
  /** 'rider' | 'agent' */
  @Field() senderType!: string;
  @Field(() => Int) senderId!: number;
  @Field() body!: string;
  @Field({ nullable: true }) imageUrl?: string;
  @Field() isRead!: boolean;
  @Field() createdAt!: Date;
}
