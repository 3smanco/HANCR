import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  Args,
  Int,
} from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { SupportChatAdminService } from './support-chat-admin.service';
import {
  AdminSupportConversationType,
  AdminSupportConversationDetailType,
  AdminSupportMessageType,
} from './dto/support-chat.type';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';

// نفس الاسم في rider-api ليصل عبر Redis المشترك
export const SUPPORT_MESSAGE_ADDED = 'SUPPORT_MESSAGE_ADDED';

@Resolver(() => AdminSupportConversationType)
export class SupportChatAdminResolver {
  constructor(
    private readonly service: SupportChatAdminService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  @Query(() => [AdminSupportConversationType], {
    description: 'طابور محادثات الدعم',
  })
  @UseGuards(AdminJwtGuard)
  supportConversations(
    @Args('status', { nullable: true }) status?: string,
  ): Promise<AdminSupportConversationType[]> {
    return this.service.list(status);
  }

  @Query(() => AdminSupportConversationDetailType, {
    description: 'تفاصيل محادثة دعم + الرسائل',
  })
  @UseGuards(AdminJwtGuard)
  supportConversationDetail(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminSupportConversationDetailType> {
    return this.service.detail(id);
  }

  @Mutation(() => AdminSupportMessageType, { description: 'ردّ الموظف' })
  @UseGuards(AdminJwtGuard)
  async sendAgentSupportMessage(
    @CurrentAdmin() admin: AdminUser,
    @Args('conversationId', { type: () => Int }) conversationId: number,
    @Args('body') body: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
  ): Promise<AdminSupportMessageType> {
    const msg = await this.service.sendAgentMessage(
      conversationId,
      admin.adminId,
      body,
      imageUrl,
    );
    // يصل للراكب عبر اشتراكه (نفس القناة/الشكل).
    await this.pubSub.publish(SUPPORT_MESSAGE_ADDED, {
      supportMessageAdded: msg,
    });
    return msg;
  }

  @Mutation(() => Boolean, { description: 'إسناد محادثة للموظف الحالي' })
  @UseGuards(AdminJwtGuard)
  assignSupportConversation(
    @CurrentAdmin() admin: AdminUser,
    @Args('conversationId', { type: () => Int }) conversationId: number,
  ): Promise<boolean> {
    return this.service.assign(conversationId, admin.adminId);
  }

  @Mutation(() => Boolean, { description: 'إغلاق محادثة دعم' })
  @UseGuards(AdminJwtGuard)
  closeSupportConversation(
    @Args('conversationId', { type: () => Int }) conversationId: number,
  ): Promise<boolean> {
    return this.service.close(conversationId);
  }

  @Subscription(() => AdminSupportMessageType, {
    description: 'رسائل الدعم الواردة (live)',
    name: 'supportMessageAdded',
    filter(
      payload: { supportMessageAdded: AdminSupportMessageType },
      variables: { conversationId: number },
    ) {
      return (
        payload.supportMessageAdded.conversationId === variables.conversationId
      );
    },
  })
  @UseGuards(AdminJwtGuard)
  supportMessageAdded(
    @Args('conversationId', { type: () => Int }) _conversationId: number,
  ): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(SUPPORT_MESSAGE_ADDED);
  }
}
