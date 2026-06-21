import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderMessageEntity, OrderEntity } from '@hancr/database';
import { OrderMessageType } from './dto/order-message.type';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(OrderMessageEntity)
    private readonly msgRepo: Repository<OrderMessageEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  /** يتحقق أن الطلب مُسنَد لهذا السائق */
  async assertAssigned(driverId: number, orderId: number): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      select: ['id', 'driverId'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.driverId !== driverId) {
      throw new ForbiddenException('This order is not assigned to you');
    }
  }

  async list(driverId: number, orderId: number): Promise<OrderMessageType[]> {
    await this.assertAssigned(driverId, orderId);
    await this.msgRepo.update(
      { orderId, senderType: 'rider', isRead: false },
      { isRead: true },
    );
    const messages = await this.msgRepo.find({
      where: { orderId },
      order: { sentAt: 'ASC' },
    });
    return messages.map((m) => this.toType(m));
  }

  async send(
    driverId: number,
    orderId: number,
    text: string,
    imageUrl?: string,
  ): Promise<OrderMessageType> {
    await this.assertAssigned(driverId, orderId);
    const saved = await this.msgRepo.save(
      this.msgRepo.create({
        orderId,
        message: text.trim(),
        imageUrl: imageUrl?.trim() || undefined,
        senderType: 'driver',
        senderId: driverId,
        isRead: false,
      }),
    );
    return this.toType(saved);
  }

  /** يعلّم رسائل الراكب كمقروءة (عند فتح/قراءة السائق للمحادثة). */
  async markRead(driverId: number, orderId: number): Promise<void> {
    await this.assertAssigned(driverId, orderId);
    await this.msgRepo.update(
      { orderId, senderType: 'rider', isRead: false },
      { isRead: true },
    );
  }

  private toType(m: OrderMessageEntity): OrderMessageType {
    return {
      id: m.id,
      orderId: m.orderId,
      message: m.message,
      imageUrl: m.imageUrl,
      senderType: m.senderType,
      senderId: m.senderId,
      isRead: m.isRead,
      sentAt: m.sentAt,
    };
  }
}
