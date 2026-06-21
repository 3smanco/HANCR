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
import { OrderMessageType, ChatEventType } from './dto/order-message.type';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';

export const ORDER_MESSAGE_ADDED = 'ORDER_MESSAGE_ADDED';
export const ORDER_TYPING = 'ORDER_TYPING';
export const ORDER_READ = 'ORDER_READ';

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
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
  ): Promise<OrderMessageType> {
    if (!message.trim() && !imageUrl) {
      throw new BadRequestException('الرسالة فارغة');
    }
    const msg = await this.chatService.send(
      user.riderId,
      orderId,
      message,
      imageUrl,
    );
    await this.pubSub.publish(ORDER_MESSAGE_ADDED, { orderMessageAdded: msg });
    return msg;
  }

  @Mutation(() => Boolean, { description: 'إشعار "يكتب الآن" للسائق' })
  @UseGuards(JwtAuthGuard)
  async setOrderTyping(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<boolean> {
    await this.chatService.assertOwnership(user.riderId, orderId);
    await this.pubSub.publish(ORDER_TYPING, {
      orderTyping: { orderId, actorType: 'rider' },
    });
    return true;
  }

  @Mutation(() => Boolean, { description: 'تعليم رسائل السائق كمقروءة' })
  @UseGuards(JwtAuthGuard)
  async markOrderMessagesRead(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<boolean> {
    await this.chatService.markRead(user.riderId, orderId);
    await this.pubSub.publish(ORDER_READ, {
      orderMessagesRead: { orderId, actorType: 'rider' },
    });
    return true;
  }

  @Subscription(() => ChatEventType, {
    description: '"يكتب الآن"',
    filter(p: { orderTyping: ChatEventType }, v: { orderId: number }) {
      // أظهر فقط حدث الطرف الآخر لنفس الطلب
      return p.orderTyping.orderId === v.orderId &&
        p.orderTyping.actorType !== 'rider';
    },
  })
  @UseGuards(JwtAuthGuard)
  async orderTyping(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<AsyncIterator<unknown>> {
    await this.chatService.assertOwnership(user.riderId, orderId);
    return this.pubSub.asyncIterator(ORDER_TYPING);
  }

  @Subscription(() => ChatEventType, {
    description: 'تمّت قراءة الرسائل',
    filter(p: { orderMessagesRead: ChatEventType }, v: { orderId: number }) {
      return p.orderMessagesRead.orderId === v.orderId &&
        p.orderMessagesRead.actorType !== 'rider';
    },
  })
  @UseGuards(JwtAuthGuard)
  async orderMessagesRead(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<AsyncIterator<unknown>> {
    await this.chatService.assertOwnership(user.riderId, orderId);
    return this.pubSub.asyncIterator(ORDER_READ);
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
