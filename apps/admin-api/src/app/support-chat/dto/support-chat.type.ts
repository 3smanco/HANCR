import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdminSupportMessageType {
  @Field(() => Int) id!: number;
  @Field(() => Int) conversationId!: number;
  @Field() senderType!: string;
  @Field(() => Int) senderId!: number;
  @Field() body!: string;
  @Field({ nullable: true }) imageUrl?: string;
  @Field() isRead!: boolean;
  @Field() createdAt!: Date;
}

@ObjectType()
export class AdminSupportConversationType {
  @Field(() => Int) id!: number;
  @Field(() => Int) riderId!: number;
  @Field({ nullable: true }) riderName?: string;
  @Field({ nullable: true }) riderPhone?: string;
  @Field() status!: string;
  @Field(() => Int, { nullable: true }) assignedAgentId?: number;
  @Field({ nullable: true }) lastMessageAt?: Date;
  @Field({ nullable: true }) lastMessage?: string;
  @Field(() => Int) unreadCount!: number;
  @Field() createdAt!: Date;
}

@ObjectType()
export class AdminSupportConversationDetailType extends AdminSupportConversationType {
  @Field(() => [AdminSupportMessageType]) messages!: AdminSupportMessageType[];
}
