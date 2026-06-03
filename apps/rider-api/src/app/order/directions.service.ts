import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RouteResult {
  /** مسافة الطريق الفعلية بالأمتار */
  distanceMeters: number;
  /** مدة القيادة المتوقعة بالثواني */
  durationSeconds: number;
  /** Polyline المشفّر لرسم المسار على الخريطة */
  polyline?: string;
  /** هل القيمة من Google (true) أم تقدير haversine احتياطي (false) */
  fromApi: boolean;
}

/**
 * DirectionsService — يحسب مسافة الطريق الفعلية عبر Google Directions API.
 * إذا فشل الاتصال أو لم يُضبط المفتاح، يعود لتقدير المسافة المباشرة (haversine)
 * مضروبة في معامل التواء الطرق (~1.3) كاحتياط.
 */
@Injectable()
export class DirectionsService {
  private readonly logger = new Logger(DirectionsService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
  }

  async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints: Array<{ lat: number; lng: number }> = [],
  ): Promise<RouteResult> {
    if (this.apiKey) {
      try {
        const wp =
          waypoints.length > 0
            ? `&waypoints=${waypoints.map((p) => `${p.lat},${p.lng}`).join('|')}`
            : '';
        const url =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${origin.lat},${origin.lng}` +
          `&destination=${destination.lat},${destination.lng}` +
          wp +
          `&mode=driving&key=${this.apiKey}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        const data = (await res.json()) as {
          status: string;
          routes?: Array<{
            legs?: Array<{
              distance?: { value: number };
              duration?: { value: number };
            }>;
            overview_polyline?: { points: string };
          }>;
        };

        if (data.status === 'OK' && data.routes && data.routes.length > 0) {
          const legs = data.routes[0].legs ?? [];
          if (legs.length > 0 && legs.every((l) => l.distance && l.duration)) {
            const distanceMeters = legs.reduce(
              (s, l) => s + (l.distance?.value ?? 0),
              0,
            );
            const durationSeconds = legs.reduce(
              (s, l) => s + (l.duration?.value ?? 0),
              0,
            );
            return {
              distanceMeters,
              durationSeconds,
              polyline: data.routes[0].overview_polyline?.points,
              fromApi: true,
            };
          }
        }
        this.logger.warn(
          `Directions API returned status=${data.status} — falling back to haversine`,
        );
      } catch (e) {
        this.logger.warn(
          `Directions API call failed: ${(e as Error).message} — falling back to haversine`,
        );
      }
    }

    // ── Fallback: haversine × معامل التواء الطرق على المراحل ──
    const seq = [origin, ...waypoints, destination];
    let distanceMeters = 0;
    for (let i = 0; i < seq.length - 1; i++) {
      distanceMeters += Math.round(this.haversine(seq[i], seq[i + 1]) * 1.3);
    }
    const durationSeconds = Math.ceil(distanceMeters / 8); // ~30 كم/س
    return { distanceMeters, durationSeconds, fromApi: false };
  }

  private haversine(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
  ): number {
    const R = 6371000;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const ha =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(ha), Math.sqrt(1 - ha)));
  }
}
