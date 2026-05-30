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
  ): Promise<RouteResult> {
    if (this.apiKey) {
      try {
        const url =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${origin.lat},${origin.lng}` +
          `&destination=${destination.lat},${destination.lng}` +
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
          const leg = data.routes[0].legs?.[0];
          if (leg?.distance && leg?.duration) {
            return {
              distanceMeters: leg.distance.value,
              durationSeconds: leg.duration.value,
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

    // ── Fallback: haversine × معامل التواء الطرق ──
    const straight = this.haversine(origin, destination);
    const distanceMeters = Math.round(straight * 1.3);
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
