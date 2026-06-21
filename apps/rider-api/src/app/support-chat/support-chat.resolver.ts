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
import { SupportChatService } from './support-chat.service';
import {
  SupportConversationType,
  SupportMessageType,
} from './dto/support-chat.type';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';

// مشترك مع admin-api عبر Redis
export const SUPPORT_MESSAGE_ADDED = 'SUPPORT_MESSAGE_ADDED';

@Resolver(() => SupportMessageType)
export class SupportChatResolver {
  constructor(
    private readonly service: SupportChatService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  @Query(() => SupportConversationType, {
    description: 'محادثة الدعم المفتوحة للراكب (تُنشأ إن لم توجد)',
  })
  @UseGuards(JwtAuthGuard)
  mySupportConversation(
    @CurrentUser() user: AuthUser,
  ): Promise<SupportConversationType> {
    return this.service.getOrCreate(user.riderId);
  }

  @Query(() => [SupportMessageType], { description: 'رسائل محادثة الدعم' })
  @UseGuards(JwtAuthGuard)
  supportMessages(
    @CurrentUser() user: AuthUser,
    @Args('conversationId', { type: () => Int }) conversationId: number,
  ): Promise<SupportMessageType[]> {
    return this.service.messages(user.riderId, conversationId);
  }

  @Mutation(() => SupportMessageType, { description: 'إرسال رسالة للدعم' })
  @UseGuards(JwtAuthGuard)
  async sendSupportMessage(
    @CurrentUser() user: AuthUser,
    @Args('conversationId', { type: () => Int }) conversationId: number,
    @Args('body') body: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
  ): Promise<SupportMessageType> {
    if (!body.trim() && !imageUrl) {
      throw new BadRequestException('الرسالة فارغة');
    }
    const msg = await this.service.send(
      user.riderId,
      conversationId,
      body,
      imageUrl,
    );
    await this.pubSub.publish(SUPPORT_MESSAGE_ADDED, {
      supportMessageAdded: msg,
    });
    return msg;
  }

  @Subscription(() => SupportMessageType, {
    description: 'رسائل الدعم الفورية',
    filter(
      payload: { supportMessageAdded: SupportMessageType },
      variables: { conversationId: number },
    ) {
      return (
        payload.supportMessageAdded.conversationId === variables.conversationId
      );
    },
  })
  @UseGuards(JwtAuthGuard)
  supportMessageAdded(
    @Args('conversationId', { type: () => Int }) _conversationId: number,
  ): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(SUPPORT_MESSAGE_ADDED);
  }
}
