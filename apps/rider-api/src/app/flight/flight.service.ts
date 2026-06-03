import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { FlightTrackingEntity } from '@hancr/database';
import { OrderService } from '../order/order.service';
import {
  FlightTrackingInput,
  FlightTrackingType,
} from './dto/flight-tracking.types';

/**
 * تتبّع رحلات الطيران لاستقبال الراكب من المطار.
 *
 * كرون كل 10 دقائق:
 *  - لكل تتبع status='tracking'، نستعلم AviationStack عن ETA الفعلي.
 *  - عند `actualArrival - 30min`، نُنشئ طلب pickup مجدول (Booked) ونحدّث الحالة إلى 'scheduled'.
 *  - إن لم يتوفر مفتاح AviationStack: نستخدم وقت `flightDate 12:00 UTC` كـ ETA افتراضي.
 */
@Injectable()
export class FlightService {
  private readonly logger = new Logger(FlightService.name);

  constructor(
    @InjectRepository(FlightTrackingEntity)
    private readonly repo: Repository<FlightTrackingEntity>,
    private readonly orderService: OrderService,
    private readonly config: ConfigService,
  ) {}

  async list(riderId: number): Promise<FlightTrackingType[]> {
    const rows = await this.repo.find({
      where: { riderId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toType(r));
  }

  async create(
    riderId: number,
    input: FlightTrackingInput,
  ): Promise<FlightTrackingType> {
    // ETA افتراضي حتى يجلبه الكرون من AviationStack
    const fallbackEta = new Date(`${input.flightDate}T12:00:00Z`);
    const saved = await this.repo.save(
      this.repo.create({
        riderId,
        flightNumber: input.flightNumber.trim().toUpperCase(),
        flightDate: input.flightDate,
        pickupAddress: input.pickupAddress,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        scheduledArrival: fallbackEta,
        serviceId: input.serviceId,
        regionId: input.regionId,
        status: 'tracking',
      }),
    );
    return this.toType(saved);
  }

  async cancel(riderId: number, id: number): Promise<boolean> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException();
    if (row.riderId !== riderId) throw new ForbiddenException();
    row.status = 'cancelled';
    await this.repo.save(row);
    return true;
  }

  @Cron('0 */10 * * * *')
  async pollFlights(): Promise<void> {
    try {
      const tracking = await this.repo.find({
        where: { status: 'tracking' },
      });
      if (tracking.length === 0) return;
      const key = this.config.get<string>('AVIATIONSTACK_KEY');
      const now = Date.now();
      for (const t of tracking) {
        // تحديث ETA إن توفّر مفتاح
        if (key) {
          try {
            const eta = await this.fetchEta(key, t.flightNumber, t.flightDate);
            if (eta) t.scheduledArrival = eta;
          } catch (_) {
            // تجاهل فشل API هذه الدورة
          }
        }
        t.lastPolledAt = new Date();

        const eta = t.scheduledArrival?.getTime();
        if (!eta) {
          await this.repo.save(t);
          continue;
        }
        // قبل 30 دقيقة من الوصول → احجز
        if (now >= eta - 30 * 60_000 && !t.pickupTriggered) {
          try {
            const order = await this.orderService.createOrder(t.riderId, {
              points: [
                { lat: t.pickupLat, lng: t.pickupLng },
                { lat: t.pickupLat, lng: t.pickupLng },
              ],
              addresses: [t.pickupAddress, t.pickupAddress],
              serviceId: t.serviceId,
              regionId: t.regionId,
              // نحجزه فوراً (Booked يفعّله كرون ScheduledRide)
              scheduledAt: new Date(eta),
            } as never);
            t.pickupTriggered = true;
            t.status = 'scheduled';
            // OrderType يحتوي id رقم
            const oid = (order as unknown as { id: number }).id;
            if (oid) t.orderId = oid;
            this.logger.log(
              `Flight ${t.flightNumber} on ${t.flightDate}: pickup auto-booked`,
            );
          } catch (e) {
            this.logger.error(
              `Pickup auto-book failed for flight ${t.flightNumber}: ${(e as Error).message}`,
            );
          }
        }
        await this.repo.save(t);
      }

      // تنظيف تتبّعات قديمة (>3 أيام)
      const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000);
      await this.repo.update(
        { status: 'tracking', createdAt: LessThan(threeDaysAgo) },
        { status: 'cancelled' },
      );
    } catch (e) {
      this.logger.error(`pollFlights failed: ${(e as Error).message}`);
    }
  }

  /** يستعلم AviationStack عن ETA. يُرجع null إن لم يجد بيانات. */
  private async fetchEta(
    key: string,
    flightNumber: string,
    flightDate: string,
  ): Promise<Date | null> {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${flightNumber}&flight_date=${flightDate}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: Array<{
        arrival?: {
          estimated?: string;
          scheduled?: string;
        };
      }>;
    };
    const f = json.data?.[0];
    const iso = f?.arrival?.estimated ?? f?.arrival?.scheduled;
    return iso ? new Date(iso) : null;
  }

  private toType(r: FlightTrackingEntity): FlightTrackingType {
    return {
      id: r.id,
      flightNumber: r.flightNumber,
      flightDate: r.flightDate,
      pickupAddress: r.pickupAddress,
      pickupLat: Number(r.pickupLat),
      pickupLng: Number(r.pickupLng),
      scheduledArrival: r.scheduledArrival,
      serviceId: r.serviceId,
      regionId: r.regionId,
      pickupTriggered: r.pickupTriggered,
      orderId: r.orderId,
      status: r.status,
      createdAt: r.createdAt,
    };
  }
}
