import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommuterSubscriptionEntity } from '@hancr/database';
import { CronLockService } from '@hancr/redis';
import { OrderService } from '../order/order.service';
import {
  CommuterSubscriptionInput,
  CommuterSubscriptionType,
  CommuterUpdateInput,
} from './dto/commuter.types';

@Injectable()
export class CommuterService {
  private readonly logger = new Logger(CommuterService.name);

  constructor(
    @InjectRepository(CommuterSubscriptionEntity)
    private readonly repo: Repository<CommuterSubscriptionEntity>,
    private readonly orderService: OrderService,
    private readonly cronLock: CronLockService,
  ) {}

  async list(riderId: number): Promise<CommuterSubscriptionType[]> {
    const rows = await this.repo.find({
      where: { riderId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toType(r));
  }

  async create(
    riderId: number,
    input: CommuterSubscriptionInput,
  ): Promise<CommuterSubscriptionType> {
    if (!input.outboundTime && !input.returnTime) {
      throw new BadRequestException('حدّد ذهاباً أو عودةً (أو كلاهما)');
    }
    if (input.daysOfWeek.length === 0) {
      throw new BadRequestException('اختر يوماً واحداً على الأقل');
    }
    const saved = await this.repo.save(
      this.repo.create({
        riderId,
        homeAddress: input.homeAddress,
        homeLat: input.homeLat,
        homeLng: input.homeLng,
        workAddress: input.workAddress,
        workLat: input.workLat,
        workLng: input.workLng,
        outboundTime: input.outboundTime,
        returnTime: input.returnTime,
        daysOfWeek: input.daysOfWeek,
        planType: input.planType ?? 'daily',
        serviceId: input.serviceId,
        regionId: input.regionId,
        leadMinutes: input.leadMinutes ?? 10,
        active: true,
        subscriptionType: input.subscriptionType ?? 'commuter',
        childName: input.childName,
        parentPhone: input.parentPhone,
        medicalNotes: input.medicalNotes,
        wheelchairNeeded: input.wheelchairNeeded ?? false,
        recurrence: input.recurrence ?? 'daily',
        preferredDriverId: input.preferredDriverId,
        nightShift: input.nightShift ?? false,
      }),
    );
    return this.toType(saved);
  }

  async update(
    riderId: number,
    id: number,
    input: CommuterUpdateInput,
  ): Promise<CommuterSubscriptionType> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Subscription not found');
    if (row.riderId !== riderId) throw new ForbiddenException();
    if (input.active !== undefined) row.active = input.active;
    if (input.outboundTime !== undefined) row.outboundTime = input.outboundTime;
    if (input.returnTime !== undefined) row.returnTime = input.returnTime;
    if (input.daysOfWeek !== undefined) row.daysOfWeek = input.daysOfWeek;
    if (input.leadMinutes !== undefined) row.leadMinutes = input.leadMinutes;
    return this.toType(await this.repo.save(row));
  }

  async remove(riderId: number, id: number): Promise<boolean> {
    const res = await this.repo.delete({ id, riderId });
    return (res.affected ?? 0) > 0;
  }

  /**
   * كرون كل دقيقة: لكل اشتراك نشط، إن حان الموعد (الذهاب أو العودة)
   * ضمن نافذة leadMinutes، أنشئ طلباً واحداً لذلك اليوم.
   * نستخدم last_outbound_date / last_return_date لمنع التكرار.
   */
  @Cron('0 * * * * *')
  async autoBookDueSubscriptions(): Promise<void> {
    // قفل موزّع: instance واحد فقط ينفّذ (يمنع حجز نفس الاشتراك مراراً).
    if (!(await this.cronLock.acquire('commuter:autobook', 50))) return;
    try {
      const subs = await this.repo.find({ where: { active: true } });
      if (subs.length === 0) return;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const dow = now.getDay(); // 0..6 الأحد..السبت

      for (const sub of subs) {
        if (!sub.daysOfWeek.includes(dow)) continue;
        // فلتر التكرار (daily | weekly | biweekly | monthly)
        if (!this.shouldRunOnDate(sub, now)) continue;

        // ذهاب
        if (sub.outboundTime && sub.lastOutboundDate !== today) {
          const due = this.parseHHmm(sub.outboundTime);
          const diff = due - nowMinutes;
          if (diff <= sub.leadMinutes && diff >= 0) {
            await this.bookLeg(sub, 'outbound');
            await this.repo.update(sub.id, { lastOutboundDate: today });
          }
        }
        // عودة
        if (sub.returnTime && sub.lastReturnDate !== today) {
          const due = this.parseHHmm(sub.returnTime);
          const diff = due - nowMinutes;
          if (diff <= sub.leadMinutes && diff >= 0) {
            await this.bookLeg(sub, 'return');
            await this.repo.update(sub.id, { lastReturnDate: today });
          }
        }
      }
    } catch (e) {
      this.logger.error(
        `autoBookDueSubscriptions failed: ${(e as Error).message}`,
      );
    }
  }

  /**
   * يحدّد إن كان اليوم الحالي يطابق نمط التكرار.
   * daily: دائماً صحيح.
   * weekly/biweekly: نقيس الأيام منذ آخر تشغيل (outbound أو return أيهما أحدث) ونقارن بالفاصل المطلوب.
   * monthly: اشتغل آخر مرة في نفس يوم الشهر منذ ≥28 يوماً.
   */
  private shouldRunOnDate(
    sub: CommuterSubscriptionEntity,
    now: Date,
  ): boolean {
    const r = (sub.recurrence ?? 'daily').toLowerCase();
    if (r === 'daily' || !r) return true;
    const lastIso = sub.lastOutboundDate ?? sub.lastReturnDate;
    if (!lastIso) return true; // أول تشغيل دائماً مسموح
    const lastMs = Date.parse(lastIso);
    const daysSince = Math.floor((now.getTime() - lastMs) / 86_400_000);
    if (r === 'weekly') return daysSince >= 7;
    if (r === 'biweekly') return daysSince >= 14;
    if (r === 'monthly') return daysSince >= 28;
    return true;
  }

  private parseHHmm(s: string): number {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  }

  /** ينشئ الطلب للذهاب/العودة مع scheduledAt للموعد المحدد. */
  private async bookLeg(
    sub: CommuterSubscriptionEntity,
    leg: 'outbound' | 'return',
  ): Promise<void> {
    const time = leg === 'outbound' ? sub.outboundTime! : sub.returnTime!;
    const [h, m] = time.split(':').map(Number);
    const scheduledAt = new Date();
    scheduledAt.setHours(h, m, 0, 0);
    // إن مرّ الوقت قليلاً (فارق سلبي بسبب فاصل التنفيذ)، استخدم +1 دقيقة من الآن
    if (scheduledAt.getTime() < Date.now() + 60_000) {
      scheduledAt.setTime(Date.now() + 60_000);
    }

    const origin =
      leg === 'outbound'
        ? { lat: sub.homeLat, lng: sub.homeLng }
        : { lat: sub.workLat, lng: sub.workLng };
    const destination =
      leg === 'outbound'
        ? { lat: sub.workLat, lng: sub.workLng }
        : { lat: sub.homeLat, lng: sub.homeLng };
    const originAddress =
      leg === 'outbound' ? sub.homeAddress : sub.workAddress;
    const destinationAddress =
      leg === 'outbound' ? sub.workAddress : sub.homeAddress;

    try {
      // OrderService.createOrder يعرف "Booked" تلقائياً عند scheduledAt مستقبلي
      // ثم كرون الـ ScheduledRide ينشّطه عند حلول الوقت.
      await this.orderService.createOrder(sub.riderId, {
        points: [origin, destination],
        addresses: [originAddress, destinationAddress],
        serviceId: sub.serviceId,
        regionId: sub.regionId,
        scheduledAt,
      } as never);
      this.logger.log(
        `Commuter sub #${sub.id} (${leg}) auto-booked for ${scheduledAt.toISOString()}`,
      );
    } catch (e) {
      this.logger.error(
        `Commuter sub #${sub.id} (${leg}) auto-book failed: ${(e as Error).message}`,
      );
    }
  }

  private toType(r: CommuterSubscriptionEntity): CommuterSubscriptionType {
    return {
      id: r.id,
      homeAddress: r.homeAddress,
      homeLat: Number(r.homeLat),
      homeLng: Number(r.homeLng),
      workAddress: r.workAddress,
      workLat: Number(r.workLat),
      workLng: Number(r.workLng),
      outboundTime: r.outboundTime,
      returnTime: r.returnTime,
      daysOfWeek: r.daysOfWeek ?? [],
      planType: r.planType,
      active: r.active,
      serviceId: r.serviceId,
      regionId: r.regionId,
      leadMinutes: r.leadMinutes,
      createdAt: r.createdAt,
      subscriptionType: r.subscriptionType ?? 'commuter',
      childName: r.childName,
      parentPhone: r.parentPhone,
      medicalNotes: r.medicalNotes,
      wheelchairNeeded: r.wheelchairNeeded ?? false,
      recurrence: r.recurrence ?? 'daily',
      preferredDriverId: r.preferredDriverId,
      nightShift: r.nightShift ?? false,
    };
  }
}
