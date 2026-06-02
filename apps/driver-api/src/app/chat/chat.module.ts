import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderMessageEntity, OrderEntity } from '@hancr/database';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { pubSubProvider } from '../pubsub.provider';

@Module({
  imports: [TypeOrmModule.forFeature([OrderMessageEntity, OrderEntity])],
  providers: [ChatService, ChatResolver, pubSubProvider],
})
export class ChatModule {}
