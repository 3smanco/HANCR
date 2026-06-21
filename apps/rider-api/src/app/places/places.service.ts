import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlacePredictionType, PlaceLocationType } from './place.type';

/**
 * PlacesService — بحث الأماكن عبر **Places API (New)** (المفتاح يبقى في الخادم).
 * searchText يُعيد الاسم + العنوان + الإحداثيات في نداء واحد، فنحسب المسافة
 * من موقع المستخدم ونرتّب النتائج (تظهر الفروع الأقرب أولاً).
 *
 * تشغيلي: يلزم تفعيل "Places API (New)" على المشروع + السماح بها في قيود مفتاح
 * GOOGLE_MAPS_API_KEY. وإلا تعود النتائج فارغة (PERMISSION_DENIED).
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
  }

  /** بحث نصّي عن مكان مع انحياز للموقع + حساب المسافة + ترتيب بالأقرب. */
  async search(
    input: string,
    lat?: number,
    lng?: number,
  ): Promise<PlacePredictionType[]> {
    const q = input.trim();
    if (!this.apiKey || q.length < 2) return [];
    try {
      const body: Record<string, unknown> = {
        textQuery: q,
        languageCode: 'ar',
        maxResultCount: 8,
      };
      if (lat != null && lng != null) {
        body.locationBias = {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 50000.0,
          },
        };
      }
      const res = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.location',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        },
      );
      const data = (await res.json()) as {
        error?: { message?: string };
        places?: Array<{
          id: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          location?: { latitude?: number; longitude?: number };
        }>;
      };
      if (data.error) {
        this.logger.warn(`Places(New) searchText error: ${data.error.message}`);
        return [];
      }
      const out = (data.places ?? []).map((p) => {
        const plat = p.location?.latitude;
        const plng = p.location?.longitude;
        return {
          placeId: p.id,
          title: p.displayName?.text ?? p.formattedAddress ?? '',
          subtitle: p.formattedAddress,
          lat: plat,
          lng: plng,
          distanceMeters:
            lat != null && lng != null && plat != null && plng != null
              ? this.haversine(lat, lng, plat, plng)
              : undefined,
        } as PlacePredictionType;
      });
      // ترتيب بالأقرب عند توفّر موقع المستخدم
      if (lat != null && lng != null) {
        out.sort(
          (a, b) =>
            (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
        );
      }
      return out;
    } catch (e) {
      this.logger.warn(`Places(New) searchText failed: ${(e as Error).message}`);
      return [];
    }
  }

  /** احتياطي: إحداثيات مكان من placeId عبر Place Details (New). */
  async details(placeId: string): Promise<PlaceLocationType | null> {
    if (!this.apiKey || !placeId) return null;
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ar`,
        {
          headers: {
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'location,formattedAddress',
          },
          signal: AbortSignal.timeout(5000),
        },
      );
      const data = (await res.json()) as {
        error?: { message?: string };
        location?: { latitude?: number; longitude?: number };
        formattedAddress?: string;
      };
      const lat = data.location?.latitude;
      const lng = data.location?.longitude;
      if (data.error || lat == null || lng == null) {
        if (data.error) this.logger.warn(`Place details(New): ${data.error.message}`);
        return null;
      }
      return { lat, lng, address: data.formattedAddress };
    } catch (e) {
      this.logger.warn(`Place details(New) failed: ${(e as Error).message}`);
      return null;
    }
  }

  /** مسافة هافرسين بالأمتار. */
  private haversine(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
}
