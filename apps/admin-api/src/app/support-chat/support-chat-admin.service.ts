import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  RiderEntity,
  SupportConversationEntity,
  SupportMessageEntity,
} from '@hancr/database';
import {
  AdminSupportConversationType,
  AdminSupportConversationDetailType,
  AdminSupportMessageType,
} from './dto/support-chat.type';

@Injectable()
export class SupportChatAdminService {
  constructor(
    @InjectRepository(SupportConversationEntity)
    private readonly convRepo: Repository<SupportConversationEntity>,
    @InjectRepository(SupportMessageEntity)
    private readonly msgRepo: Repository<SupportMessageEntity>,
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
  ) {}

  private toMsg(m: SupportMessageEntity): AdminSupportMessageType {
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

  /** قائمة المحادثات (الطابور) — المفتوحة أولاً، ثم الأحدث. */
  async list(status?: string): Promise<AdminSupportConversationType[]> {
    const convs = await this.convRepo.find({
      where: status ? { status } : {},
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      take: 100,
    });
    if (convs.length === 0) return [];
    const riderIds = [...new Set(convs.map((c) => c.riderId))];
    const riders = await this.riderRepo.find({
      where: { id: In(riderIds) },
    });
    const byId = new Map(riders.map((r) => [r.id, r]));

    return Promise.all(
      convs.map(async (c) => {
        const r = byId.get(c.riderId);
        const last = await this.msgRepo.findOne({
          where: { conversationId: c.id },
          order: { createdAt: 'DESC' },
        });
        const unread = await this.msgRepo.count({
          where: { conversationId: c.id, senderType: 'rider', isRead: false },
        });
        return {
          id: c.id,
          riderId: c.riderId,
          riderName: r
            ? [r.firstName, r.lastName].filter(Boolean).join(' ') || r.phoneNumber
            : undefined,
          riderPhone: r?.phoneNumber,
          status: c.status,
          assignedAgentId: c.assignedAgentId,
          lastMessageAt: c.lastMessageAt,
          lastMessage: last?.body,
          unreadCount: unread,
          createdAt: c.createdAt,
        };
      }),
    );
  }

  async detail(id: number): Promise<AdminSupportConversationDetailType> {
    const c = await this.convRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Conversation not found');
    // علّم رسائل الراكب كمقروءة عند فتح الموظف لها
    await this.msgRepo.update(
      { conversationId: id, senderType: 'rider', isRead: false },
      { isRead: true },
    );
    const r = await this.riderRepo.findOne({ where: { id: c.riderId } });
    const messages = await this.msgRepo.find({
      where: { conversationId: id },
      order: { createdAt: 'ASC' },
    });
    return {
      id: c.id,
      riderId: c.riderId,
      riderName: r
        ? [r.firstName, r.lastName].filter(Boolean).join(' ') || r.phoneNumber
        : undefined,
      riderPhone: r?.phoneNumber,
      status: c.status,
      assignedAgentId: c.assignedAgentId,
      lastMessageAt: c.lastMessageAt,
      unreadCount: 0,
      createdAt: c.createdAt,
      messages: messages.map((m) => this.toMsg(m)),
    };
  }

  async sendAgentMessage(
    conversationId: number,
    agentId: number,
    body: string,
    imageUrl?: string,
  ): Promise<AdminSupportMessageType> {
    const c = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!c) throw new NotFoundException('Conversation not found');
    const saved = await this.msgRepo.save(
      this.msgRepo.create({
        conversationId,
        senderType: 'agent',
        senderId: agentId,
        body: body.trim(),
        imageUrl: imageUrl?.trim() || undefined,
        isRead: false,
      }),
    );
    // إسناد تلقائي للموظف الذي يردّ أولاً + حالة assigned.
    await this.convRepo.update(c.id, {
      lastMessageAt: new Date(),
      status: 'assigned',
      ...(c.assignedAgentId ? {} : { assignedAgentId: agentId }),
    });
    return this.toMsg(saved);
  }

  async assign(conversationId: number, agentId: number): Promise<boolean> {
    await this.convRepo.update(
      { id: conversationId },
      { assignedAgentId: agentId, status: 'assigned' },
    );
    return true;
  }

  async close(conversationId: number): Promise<boolean> {
    await this.convRepo.update({ id: conversationId }, { status: 'closed' });
    return true;
  }
}
