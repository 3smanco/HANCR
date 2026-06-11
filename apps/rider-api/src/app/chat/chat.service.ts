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

  /** يتحقق أن الطلب يخصّ هذا الراكب (عام — يُستخدم أيضاً لحراسة الاشتراك الفوري) */
  async assertOwnership(riderId: number, orderId: number): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      select: ['id', 'riderId'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.riderId !== riderId) {
      throw new ForbiddenException('This order is not yours');
    }
  }

  async list(riderId: number, orderId: number): Promise<OrderMessageType[]> {
    await this.assertOwnership(riderId, orderId);
    // علّم رسائل السائق كمقروءة
    await this.msgRepo.update(
      { orderId, senderType: 'driver', isRead: false },
      { isRead: true },
    );
    const messages = await this.msgRepo.find({
      where: { orderId },
      order: { sentAt: 'ASC' },
    });
    return messages.map((m) => this.toType(m));
  }

  async send(
    riderId: number,
    orderId: number,
    text: string,
  ): Promise<OrderMessageType> {
    await this.assertOwnership(riderId, orderId);
    const saved = await this.msgRepo.save(
      this.msgRepo.create({
        orderId,
        message: text.trim(),
        senderType: 'rider',
        senderId: riderId,
        isRead: false,
      }),
    );
    return this.toType(saved);
  }

  private toType(m: OrderMessageEntity): OrderMessageType {
    return {
      id: m.id,
      orderId: m.orderId,
      message: m.message,
      senderType: m.senderType,
      senderId: m.senderId,
      isRead: m.isRead,
      sentAt: m.sentAt,
    };
  }
}
