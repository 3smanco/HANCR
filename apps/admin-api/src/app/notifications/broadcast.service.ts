import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { RiderEntity, DriverEntity } from '@hancr/database';
import {
  PushNotificationService,
  type NotificationTemplate,
} from '@hancr/notifications';
import { BroadcastResultType, BroadcastTarget } from './dto/broadcast.types';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly push: PushNotificationService,
  ) {}

  /**
   * إرسال إشعار جماعي عبر FCM إلى الركاب/السائقين/الكل.
   * يجمع الـ fcmTokens من القاعدة، يُرسل، ثم يحذف التوكنات المنتهية.
   */
  async broadcast(
    title: string,
    body: string,
    target: BroadcastTarget,
  ): Promise<BroadcastResultType> {
    const tokens: string[] = [];

    if (target === BroadcastTarget.Riders || target === BroadcastTarget.All) {
      const riders = await this.riderRepo.find({
        where: { fcmToken: Not(IsNull()), banned: false },
        select: ['fcmToken'],
      });
      tokens.push(...riders.map((r) => r.fcmToken).filter((t): t is string => !!t));
    }
    if (target === BroadcastTarget.Drivers || target === BroadcastTarget.All) {
      const drivers = await this.driverRepo.find({
        where: { fcmToken: Not(IsNull()) },
        select: ['fcmToken'],
      });
      tokens.push(...drivers.map((d) => d.fcmToken).filter((t): t is string => !!t));
    }

    const uniqueTokens = [...new Set(tokens)];

    const template: NotificationTemplate = {
      type: 'custom',
      titleAr: title,
      titleEn: title,
      bodyAr: body,
      bodyEn: body,
    };

    const result = await this.push.sendToTokens(uniqueTokens, template, 'ar');

    // تنظيف التوكنات المنتهية الصلاحية من القاعدة
    if (result.invalidTokens.length > 0) {
      await this.pruneInvalidTokens(result.invalidTokens);
    }

    this.logger.log(
      `Broadcast to ${target}: ${result.successCount}/${uniqueTokens.length} sent, ` +
        `${result.failureCount} failed, ${result.invalidTokens.length} pruned`,
    );

    return {
      totalTokens: uniqueTokens.length,
      sent: result.successCount,
      failed: result.failureCount,
    };
  }

  private async pruneInvalidTokens(invalid: string[]): Promise<void> {
    try {
      await this.riderRepo.update(
        { fcmToken: In(invalid) },
        { fcmToken: undefined },
      );
      await this.driverRepo.update(
        { fcmToken: In(invalid) },
        { fcmToken: undefined },
      );
    } catch (e) {
      this.logger.warn(`Failed to prune invalid tokens: ${(e as Error).message}`);
    }
  }
}
