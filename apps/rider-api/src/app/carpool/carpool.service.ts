import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  CarpoolRequestEntity,
  CarpoolMatchEntity,
  RiderEntity,
} from '@hancr/database';
import { CarpoolRequestInput, CarpoolRequestType } from './dto/carpool.types';

/**
 * منطق Carpool — مطابقة الركاب ذوي المسارات المتقاطعة والأوقات المتقاربة،
 * مع احترام trustMode (open / women_only / family) وجنس الراكب.
 *
 * MVP:
 *  - عند طلب جديد: ابحث عن طلبات pending في نفس المنطقة، الوقت ±15 دقيقة،
 *    صناديق إحداثية متقاطعة (origin ضمن 2 كم، destination ضمن 2 كم).
 *  - إن وُجد ≥1 شريك متوافق: أنشئ CarpoolMatchEntity، وحدّث الطلبات matched.
 *  - الخصم 30% للمجموعة من 2، 40% من 3+.
 */
@Injectable()
export class CarpoolService {
  private readonly logger = new Logger(CarpoolService.name);

  // نصف القطر بالكيلومتر للمطابقة
  private static readonly ORIGIN_RADIUS_KM = 2;
  private static readonly DEST_RADIUS_KM = 2;
  // النافذة الزمنية بالدقائق
  private static readonly TIME_WINDOW_MIN = 15;

  constructor(
    @InjectRepository(CarpoolRequestEntity)
    private readonly reqRepo: Repository<CarpoolRequestEntity>,
    @InjectRepository(CarpoolMatchEntity)
    private readonly matchRepo: Repository<CarpoolMatchEntity>,
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
  ) {}

  async list(riderId: number): Promise<CarpoolRequestType[]> {
    const rows = await this.reqRepo.find({
      where: { riderId },
      order: { createdAt: 'DESC' },
      take: 30,
    });
    return rows.map((r) => this.toType(r));
  }

  async cancel(riderId: number, id: number): Promise<boolean> {
    const r = await this.reqRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException();
    if (r.riderId !== riderId) throw new ForbiddenException();
    if (r.status === 'booked' || r.status === 'completed') {
      throw new BadRequestException('cannot cancel — already booked');
    }
    r.status = 'cancelled';
    await this.reqRepo.save(r);
    return true;
  }

  /**
   * يستقبل طلب Carpool ويحاول المطابقة الفورية.
   * يُرجع الطلب بحالته (pending أو matched).
   */
  async request(
    riderId: number,
    input: CarpoolRequestInput,
  ): Promise<CarpoolRequestType> {
    // تحقق trustMode + جنس الراكب
    const rider = await this.riderRepo.findOne({
      where: { id: riderId },
      select: ['id', 'gender'],
    });
    if (!rider) throw new NotFoundException('Rider not found');
    if (input.trustMode === 'women_only' && (rider.gender ?? '') !== 'F') {
      throw new BadRequestException(
        'women_only يتاح فقط للراكبات (بيانات الجنس على ملفك)',
      );
    }

    const scheduledAt = new Date(input.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt');
    }
    if (scheduledAt.getTime() < Date.now() + 5 * 60_000) {
      throw new BadRequestException('scheduledAt must be ≥5 minutes from now');
    }

    const saved = await this.reqRepo.save(
      this.reqRepo.create({
        riderId,
        originAddress: input.originAddress,
        originLat: input.originLat,
        originLng: input.originLng,
        destinationAddress: input.destinationAddress,
        destinationLat: input.destinationLat,
        destinationLng: input.destinationLng,
        scheduledAt,
        maxRiders: input.maxRiders,
        trustMode: input.trustMode,
        serviceId: input.serviceId,
        regionId: input.regionId,
        status: 'pending',
      }),
    );

    // حاول المطابقة فوراً
    await this.tryMatch(saved);
    const refreshed = await this.reqRepo.findOne({ where: { id: saved.id } });
    return this.toType(refreshed ?? saved);
  }

  /**
   * يحاول مطابقة طلب جديد مع طلبات pending أخرى.
   * عند توفر شريك واحد كافٍ → ينشئ CarpoolMatch ويعلّم الطلبات matched.
   */
  private async tryMatch(req: CarpoolRequestEntity): Promise<void> {
    const tMin = new Date(
      req.scheduledAt.getTime() -
        CarpoolService.TIME_WINDOW_MIN * 60_000,
    );
    const tMax = new Date(
      req.scheduledAt.getTime() +
        CarpoolService.TIME_WINDOW_MIN * 60_000,
    );

    const candidates = await this.reqRepo.find({
      where: {
        status: 'pending',
        regionId: req.regionId,
        scheduledAt: Between(tMin, tMax),
      },
      take: 20,
    });

    const compat: CarpoolRequestEntity[] = [];
    for (const c of candidates) {
      if (c.id === req.id) continue;
      if (c.riderId === req.riderId) continue;
      if (c.serviceId !== req.serviceId) continue;
      if (!this.trustCompatible(req.trustMode, c.trustMode)) continue;
      // تحقق Trust-mode على مستوى الجنس
      if (req.trustMode === 'women_only' || c.trustMode === 'women_only') {
        const otherRider = await this.riderRepo.findOne({
          where: { id: c.riderId },
          select: ['gender'],
        });
        if ((otherRider?.gender ?? '') !== 'F') continue;
      }
      if (
        this.kmDistance(req.originLat, req.originLng, c.originLat, c.originLng) >
        CarpoolService.ORIGIN_RADIUS_KM
      )
        continue;
      if (
        this.kmDistance(
          req.destinationLat,
          req.destinationLng,
          c.destinationLat,
          c.destinationLng,
        ) > CarpoolService.DEST_RADIUS_KM
      )
        continue;
      compat.push(c);
      if (compat.length >= req.maxRiders - 1) break;
    }

    if (compat.length === 0) return;

    const group = [req, ...compat];
    const discount = group.length >= 3 ? 0.4 : 0.3;
    const avgTime =
      group.reduce((s, r) => s + r.scheduledAt.getTime(), 0) / group.length;

    const match = await this.matchRepo.save(
      this.matchRepo.create({
        riderIds: group.map((r) => r.riderId),
        requestIds: group.map((r) => r.id),
        scheduledAt: new Date(avgTime),
        discountPercent: discount,
        status: 'forming',
        serviceId: req.serviceId,
        regionId: req.regionId,
      }),
    );

    for (const r of group) {
      await this.reqRepo.update(r.id, {
        status: 'matched',
        matchId: match.id,
        discountPercent: discount,
      });
    }
    this.logger.log(
      `Carpool match #${match.id} formed: ${group.length} riders, ${discount * 100}% off`,
    );
  }

  /** هل وضعَي ثقة متوافقان للمطابقة في مجموعة واحدة */
  private trustCompatible(a: string, b: string): boolean {
    if (a === b) return true;
    if (a === 'open' && b !== 'women_only') return true;
    if (b === 'open' && a !== 'women_only') return true;
    return false;
  }

  /** مسافة Haversine بالكيلومتر */
  private kmDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toType(r: CarpoolRequestEntity): CarpoolRequestType {
    return {
      id: r.id,
      originAddress: r.originAddress,
      originLat: Number(r.originLat),
      originLng: Number(r.originLng),
      destinationAddress: r.destinationAddress,
      destinationLat: Number(r.destinationLat),
      destinationLng: Number(r.destinationLng),
      scheduledAt: r.scheduledAt,
      maxRiders: r.maxRiders,
      trustMode: r.trustMode,
      status: r.status,
      discountPercent: Number(r.discountPercent),
      matchId: r.matchId,
      orderId: r.orderId,
      serviceId: r.serviceId,
      regionId: r.regionId,
      createdAt: r.createdAt,
    };
  }
}
