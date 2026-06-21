import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SupportConversationEntity,
  SupportMessageEntity,
} from '@hancr/database';
import {
  SupportConversationType,
  SupportMessageType,
} from './dto/support-chat.type';

@Injectable()
export class SupportChatService {
  constructor(
    @InjectRepository(SupportConversationEntity)
    private readonly convRepo: Repository<SupportConversationEntity>,
    @InjectRepository(SupportMessageEntity)
    private readonly msgRepo: Repository<SupportMessageEntity>,
  ) {}

  private toConv(c: SupportConversationEntity): SupportConversationType {
    return {
      id: c.id,
      status: c.status,
      assignedAgentId: c.assignedAgentId,
      lastMessageAt: c.lastMessageAt,
      createdAt: c.createdAt,
    };
  }

  private toMsg(m: SupportMessageEntity): SupportMessageType {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderType: m.senderType,
      senderId: m.senderId,
      body: m.body,
      imageUrl: m.imageUrl,
      isRead: m.isRead,
      createdAt: m.createdAt,
    };
  }

  /** يجلب محادثة الراكب المفتوحة أو يُنشئ واحدة. */
  async getOrCreate(riderId: number): Promise<SupportConversationType> {
    let conv = await this.convRepo.findOne({
      where: [
        { riderId, status: 'open' },
        { riderId, status: 'assigned' },
      ],
      order: { id: 'DESC' },
    });
    conv ??= await this.convRepo.save(
      this.convRepo.create({ riderId, status: 'open' }),
    );
    return this.toConv(conv);
  }

  private async assertOwnership(
    riderId: number,
    conversationId: number,
  ): Promise<SupportConversationEntity> {
    const conv = await this.convRepo.findOne({
      where: { id: conversationId },
    });
    if (!conv || conv.riderId !== riderId) {
      throw new ForbiddenException('Conversation not yours');
    }
    return conv;
  }

  async messages(
    riderId: number,
    conversationId: number,
  ): Promise<SupportMessageType[]> {
    await this.assertOwnership(riderId, conversationId);
    await this.msgRepo.update(
      { conversationId, senderType: 'agent', isRead: false },
      { isRead: true },
    );
    const rows = await this.msgRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((m) => this.toMsg(m));
  }

  async send(
    riderId: number,
    conversationId: number,
    body: string,
    imageUrl?: string,
  ): Promise<SupportMessageType> {
    const conv = await this.assertOwnership(riderId, conversationId);
    const saved = await this.msgRepo.save(
      this.msgRepo.create({
        conversationId,
        senderType: 'rider',
        senderId: riderId,
        body: body.trim(),
        imageUrl: imageUrl?.trim() || undefined,
        isRead: false,
      }),
    );
    // أعِد فتح المحادثة المُغلقة عند رسالة جديدة من الراكب.
    await this.convRepo.update(conv.id, {
      lastMessageAt: new Date(),
      ...(conv.status === 'closed' ? { status: 'open' } : {}),
    });
    return this.toMsg(saved);
  }
}
