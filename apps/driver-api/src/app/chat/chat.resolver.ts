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
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';

// نفس الأسماء في rider-api لتصل عبر Redis المشترك
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
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<OrderMessageType[]> {
    return this.chatService.list(driver.driverId, orderId);
  }

  @Mutation(() => OrderMessageType, { description: 'إرسال رسالة للراكب' })
  @UseGuards(JwtAuthGuard)
  async sendOrderMessage(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('message') message: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
  ): Promise<OrderMessageType> {
    if (!message.trim() && !imageUrl) {
      throw new BadRequestException('الرسالة فارغة');
    }
    const msg = await this.chatService.send(
      driver.driverId,
      orderId,
      message,
      imageUrl,
    );
    await this.pubSub.publish(ORDER_MESSAGE_ADDED, { orderMessageAdded: msg });
    return msg;
  }

  @Mutation(() => Boolean, { description: 'إشعار "يكتب الآن" للراكب' })
  @UseGuards(JwtAuthGuard)
  async setOrderTyping(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<boolean> {
    await this.chatService.assertAssigned(driver.driverId, orderId);
    await this.pubSub.publish(ORDER_TYPING, {
      orderTyping: { orderId, actorType: 'driver' },
    });
    return true;
  }

  @Mutation(() => Boolean, { description: 'تعليم رسائل الراكب كمقروءة' })
  @UseGuards(JwtAuthGuard)
  async markOrderMessagesRead(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<boolean> {
    await this.chatService.markRead(driver.driverId, orderId);
    await this.pubSub.publish(ORDER_READ, {
      orderMessagesRead: { orderId, actorType: 'driver' },
    });
    return true;
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
  orderMessageAdded(
    @Args('orderId', { type: () => Int }) _orderId: number,
  ): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(ORDER_MESSAGE_ADDED);
  }

  @Subscription(() => ChatEventType, {
    description: '"يكتب الآن"',
    filter(p: { orderTyping: ChatEventType }, v: { orderId: number }) {
      return p.orderTyping.orderId === v.orderId &&
        p.orderTyping.actorType !== 'driver';
    },
  })
  @UseGuards(JwtAuthGuard)
  orderTyping(
    @Args('orderId', { type: () => Int }) _orderId: number,
  ): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(ORDER_TYPING);
  }

  @Subscription(() => ChatEventType, {
    description: 'تمّت قراءة الرسائل',
    filter(p: { orderMessagesRead: ChatEventType }, v: { orderId: number }) {
      return p.orderMessagesRead.orderId === v.orderId &&
        p.orderMessagesRead.actorType !== 'driver';
    },
  })
  @UseGuards(JwtAuthGuard)
  orderMessagesRead(
    @Args('orderId', { type: () => Int }) _orderId: number,
  ): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(ORDER_READ);
  }
}
