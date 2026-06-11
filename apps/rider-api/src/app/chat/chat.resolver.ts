import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  Args,
  Int,
} from '@nestjs/graphql';
import { UseGuards, Inject, BadRequestException } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { ChatService } from './chat.service';
import { OrderMessageType } from './dto/order-message.type';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';

export const ORDER_MESSAGE_ADDED = 'ORDER_MESSAGE_ADDED';

@Resolver(() => OrderMessageType)
export class ChatResolver {
  constructor(
    private readonly chatService: ChatService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  @Query(() => [OrderMessageType], { description: 'رسائل المحادثة لطلب' })
  @UseGuards(JwtAuthGuard)
  orderMessages(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<OrderMessageType[]> {
    return this.chatService.list(user.riderId, orderId);
  }

  @Mutation(() => OrderMessageType, { description: 'إرسال رسالة للسائق' })
  @UseGuards(JwtAuthGuard)
  async sendOrderMessage(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('message') message: string,
  ): Promise<OrderMessageType> {
    if (!message.trim()) throw new BadRequestException('الرسالة فارغة');
    const msg = await this.chatService.send(user.riderId, orderId, message);
    await this.pubSub.publish(ORDER_MESSAGE_ADDED, { orderMessageAdded: msg });
    return msg;
  }

  @Subscription(() => OrderMessageType, {
    description: 'رسائل المحادثة الفورية',
    filter(
      payload: { orderMessageAdded: OrderMessageType },
      variables: { orderId: number },
    ) {
      return payload.orderMessageAdded.orderId === variables.orderId;
    },
  })
  @UseGuards(JwtAuthGuard)
  async orderMessageAdded(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<AsyncIterator<unknown>> {
    // أمن: امنع IDOR — لا يشترك الراكب إلا في محادثة طلب يملكه.
    await this.chatService.assertOwnership(user.riderId, orderId);
    return this.pubSub.asyncIterator(ORDER_MESSAGE_ADDED);
  }
}
