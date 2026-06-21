import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlacePredictionType, PlaceLocationType } from './place.type';

/**
 * PlacesService — وكيل بحث الأماكن عبر Google Places API (المفتاح يبقى
 * في الخادم). يُستخدم في شاشة الحجز للبحث عن وجهة بالاسم.
 *
 * ملاحظة تشغيلية: يجب تفعيل "Places API" على مفتاح GOOGLE_MAPS_API_KEY في
 * Google Cloud (Directions مفعّل أصلاً). إن لم يُفعَّل تعود النتائج فارغة.
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
  }

  /** اقتراحات بحث عن مكان (مع انحياز للموقع إن توفّر). */
  async autocomplete(
    input: string,
    lat?: number,
    lng?: number,
  ): Promise<PlacePredictionType[]> {
    const q = input.trim();
    if (!this.apiKey || q.length < 2) return [];
    try {
      const bias =
        lat != null && lng != null
          ? `&location=${lat},${lng}&radius=50000`
          : '';
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(q)}&language=ar${bias}&key=${this.apiKey}`;
      const data = (await this.fetchJson(url)) as {
        status: string;
        predictions?: Array<{
          place_id: string;
          structured_formatting?: {
            main_text?: string;
            secondary_text?: string;
          };
          description?: string;
        }>;
      };
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        this.logger.warn(`Places autocomplete status=${data.status}`);
        return [];
      }
      return (data.predictions ?? []).slice(0, 6).map((p) => ({
        placeId: p.place_id,
        title: p.structured_formatting?.main_text ?? p.description ?? '',
        subtitle: p.structured_formatting?.secondary_text,
      }));
    } catch (e) {
      this.logger.warn(`Places autocomplete failed: ${(e as Error).message}`);
      return [];
    }
  }

  /** إحداثيات + عنوان مكان من placeId. */
  async details(placeId: string): Promise<PlaceLocationType | null> {
    if (!this.apiKey || !placeId) return null;
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${encodeURIComponent(placeId)}` +
        `&fields=geometry,formatted_address&language=ar&key=${this.apiKey}`;
      const data = (await this.fetchJson(url)) as {
        status: string;
        result?: {
          geometry?: { location?: { lat: number; lng: number } };
          formatted_address?: string;
        };
      };
      const loc = data.result?.geometry?.location;
      if (data.status !== 'OK' || !loc) {
        this.logger.warn(`Place details status=${data.status}`);
        return null;
      }
      return {
        lat: loc.lat,
        lng: loc.lng,
        address: data.result?.formatted_address,
      };
    } catch (e) {
      this.logger.warn(`Place details failed: ${(e as Error).message}`);
      return null;
    }
  }

  private async fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}
