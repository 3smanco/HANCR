import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SupportConversationEntity,
  SupportMessageEntity,
} from '@hancr/database';
import { SupportChatService } from './support-chat.service';
import { SupportChatResolver } from './support-chat.resolver';
import { pubSubProvider } from '../pubsub.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportConversationEntity,
      SupportMessageEntity,
    ]),
  ],
  providers: [SupportChatService, SupportChatResolver, pubSubProvider],
})
export class SupportChatModule {}
