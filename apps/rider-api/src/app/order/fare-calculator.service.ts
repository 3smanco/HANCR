import { Injectable } from '@nestjs/common';

/** مضاعفات الخدمة الديناميكية (من ServiceEntity) — ذروة وقت/يوم/موسم. */
export interface ServiceMultipliers {
  time?: Array<{ startHour: number; endHour: number; multiplier: number }>;
  weekday?: Array<{ weekdays: number[]; multiplier: number }>;
  dateRange?: Array<{ from: string; to: string; multiplier: number; label?: string }>;
}

export interface FareInput {
  distanceMeters: number;
  durationSeconds: number;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFee: number;
  /** سعر دقيقة الانتظار (اختياري). */
  perMinuteWait?: number;
  waitSeconds?: number;
  /** مضاعف المنطقة الثابت (PostGIS pricing zone). */
  zoneMultiplier?: number;
  /** مضاعفات الذروة من الخدمة (وقت/يوم/موسم). */
  serviceMultipliers?: ServiceMultipliers;
  /** مضاعف الطلب الديناميكي (surge). */
  surgeMultiplier?: number;
  /** اللحظة المرجعية لحساب الذروة (افتراضي: الآن). */
  now?: Date;
}

export interface FareBreakdown {
  base: number;
  distance: number;
  time: number;
  wait: number;
  subtotal: number;
  zoneMultiplier: number;
  peakMultiplier: number;
  peakLabel?: string;
  surgeMultiplier: number;
  combinedMultiplier: number;
  beforeMinimum: number;
  minimumFee: number;
  minimumApplied: boolean;
  total: number;
}

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  FareCalculator — مصدر واحد لحساب الأجرة                       ║
 * ║                                                               ║
 * ║  يستدعيه previewRoute (السعر المعروض) و createOrder (المفروض)  ║
 * ║  بنفس المدخلات → السعر المعروض = المفروض دائماً.               ║
 * ║                                                               ║
 * ║  الصيغة: total = max(minimumFee,                              ║
 * ║    (base + distance·perKm + time·perMin + wait·perMinWait)    ║
 * ║      × zoneMult × peakMult × surge)                           ║
 * ║                                                               ║
 * ║  - الحد الأدنى مفروض دائماً (كان مُهمَلاً).                     ║
 * ║  - مضاعفات الذروة: يؤخذ الأعلى المنطبق (لا تُكدَّس) لتفادي       ║
 * ║    الانفجار (1.5×1.5×1.5).                                     ║
 * ║  - المنطقة والـ surge مضاعفان متعامدان (يُضربان).              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
@Injectable()
export class FareCalculator {
  /** المضاعف الأعلى المنطبق من مضاعفات الخدمة في اللحظة `now`. */
  peakMultiplier(
    m: ServiceMultipliers | undefined,
    now: Date,
  ): { value: number; label?: string } {
    if (!m) return { value: 1 };
    let best = 1;
    let label: string | undefined;
    const hour = now.getHours();
    const day = now.getDay(); // 0=الأحد

    // حراسة نوع صارمة: أعمدة jsonb قد تحوي قيمة ليست مصفوفة ({} مثلاً) فيرمي
    // `for...of` خطأ "object is not iterable". Array.isArray يحمي لكل المناطق.
    const times = Array.isArray(m.time) ? m.time : [];
    const weekdays = Array.isArray(m.weekday) ? m.weekday : [];
    const ranges = Array.isArray(m.dateRange) ? m.dateRange : [];

    for (const t of times) {
      const inRange =
        t.startHour <= t.endHour
          ? hour >= t.startHour && hour < t.endHour
          : hour >= t.startHour || hour < t.endHour; // يلتفّ بعد منتصف الليل
      if (inRange && t.multiplier > best) {
        best = t.multiplier;
        label = 'peak_time';
      }
    }
    for (const w of weekdays) {
      if (w.weekdays?.includes(day) && w.multiplier > best) {
        best = w.multiplier;
        label = 'peak_weekday';
      }
    }
    const today = now.toISOString().slice(0, 10);
    for (const d of ranges) {
      if (today >= d.from && today <= d.to && d.multiplier > best) {
        best = d.multiplier;
        label = d.label ?? 'season';
      }
    }
    return { value: best, label };
  }

  calculate(input: FareInput): FareBreakdown {
    const now = input.now ?? new Date();
    const r2 = (n: number) => Math.round(n * 100) / 100;

    const distanceKm = input.distanceMeters / 1000;
    const durationMin = input.durationSeconds / 60;
    const waitMin = (input.waitSeconds ?? 0) / 60;

    const base = r2(input.baseFare);
    const distance = r2(distanceKm * input.perKm);
    const time = r2(durationMin * input.perMinute);
    const wait = r2(waitMin * (input.perMinuteWait ?? 0));
    const subtotal = r2(base + distance + time + wait);

    const zoneMultiplier = input.zoneMultiplier ?? 1;
    const peak = this.peakMultiplier(input.serviceMultipliers, now);
    const surgeMultiplier = input.surgeMultiplier ?? 1;
    const combinedMultiplier = r2(
      zoneMultiplier * peak.value * surgeMultiplier,
    );

    const beforeMinimum = r2(subtotal * combinedMultiplier);
    const minimumApplied = beforeMinimum < input.minimumFee;
    const total = r2(Math.max(beforeMinimum, input.minimumFee));

    return {
      base,
      distance,
      time,
      wait,
      subtotal,
      zoneMultiplier,
      peakMultiplier: peak.value,
      peakLabel: peak.label,
      surgeMultiplier,
      combinedMultiplier,
      beforeMinimum,
      minimumFee: input.minimumFee,
      minimumApplied,
      total,
    };
  }
}
