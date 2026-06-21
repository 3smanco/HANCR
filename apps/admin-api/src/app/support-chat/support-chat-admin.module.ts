import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  RiderEntity,
  SupportConversationEntity,
  SupportMessageEntity,
} from '@hancr/database';
import { SupportChatAdminService } from './support-chat-admin.service';
import { SupportChatAdminResolver } from './support-chat-admin.resolver';
import { pubSubProvider } from '../pubsub.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportConversationEntity,
      SupportMessageEntity,
      RiderEntity,
    ]),
  ],
  providers: [
    SupportChatAdminService,
    SupportChatAdminResolver,
    pubSubProvider,
  ],
})
export class SupportChatAdminModule {}
