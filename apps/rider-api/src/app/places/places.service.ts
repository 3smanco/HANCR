import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlacePredictionType, PlaceLocationType } from './place.type';

/**
 * PlacesService — بحث الأماكن عبر **Places API (legacy)** (المفتاح يبقى في الخادم).
 *
 * نستخدم Autocomplete (يُعيد placeId + الوصف) ثم Place Details عند الاختيار
 * لجلب الإحداثيات. السبب: "Places API (New)" كانت معطَّلة على المشروع
 * (SERVICE_DISABLED / PERMISSION_DENIED) بينما الـ legacy مفعَّلة وتعمل —
 * فكان البحث يعود فارغاً دائماً. العميل (rider-app) يدعم أصلاً غياب الإحداثيات
 * في التوقّعات ويجلبها عبر placeDetails عند اختيار النتيجة.
 *
 * تشغيلي: يلزم تفعيل "Places API" (legacy) على المفتاح. للترقية مستقبلاً إلى
 * Places API (New) فعِّلها من Google Cloud Console ثم بدِّل الـ endpoints.
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
  }

  /** بحث (Autocomplete) عن مكان مع انحياز للموقع. الإحداثيات تُجلب عند الاختيار. */
  async search(
    input: string,
    lat?: number,
    lng?: number,
  ): Promise<PlacePredictionType[]> {
    const q = input.trim();
    if (!this.apiKey || q.length < 2) return [];
    try {
      const params = new URLSearchParams({
        input: q,
        language: 'ar',
        key: this.apiKey,
      });
      // انحياز للموقع الحالي لإظهار النتائج الأقرب أولاً.
      if (lat != null && lng != null) {
        params.set('location', `${lat},${lng}`);
        params.set('radius', '50000');
      }
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
        { signal: AbortSignal.timeout(5000) },
      );
      const data = (await res.json()) as {
        status: string;
        error_message?: string;
        predictions?: Array<{
          place_id: string;
          description?: string;
          structured_formatting?: {
            main_text?: string;
            secondary_text?: string;
          };
        }>;
      };
      // ZERO_RESULTS حالة طبيعية (لا نتائج) — لا تُسجَّل كخطأ.
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        this.logger.warn(
          `Places autocomplete status=${data.status}` +
            (data.error_message ? ` — ${data.error_message}` : ''),
        );
        return [];
      }
      return (data.predictions ?? []).slice(0, 8).map(
        (p) =>
          ({
            placeId: p.place_id,
            title: p.structured_formatting?.main_text ?? p.description ?? '',
            subtitle: p.structured_formatting?.secondary_text,
            // الإحداثيات تُجلب عند الاختيار عبر details() — Autocomplete لا يعيدها.
            lat: undefined,
            lng: undefined,
            distanceMeters: undefined,
          }) as PlacePredictionType,
      );
    } catch (e) {
      this.logger.warn(`Places autocomplete failed: ${(e as Error).message}`);
      return [];
    }
  }

  /** إحداثيات مكان من placeId عبر Place Details (legacy). */
  async details(placeId: string): Promise<PlaceLocationType | null> {
    if (!this.apiKey || !placeId) return null;
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'geometry,formatted_address',
        language: 'ar',
        key: this.apiKey,
      });
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
        { signal: AbortSignal.timeout(5000) },
      );
      const data = (await res.json()) as {
        status: string;
        error_message?: string;
        result?: {
          geometry?: { location?: { lat?: number; lng?: number } };
          formatted_address?: string;
        };
      };
      const lat = data.result?.geometry?.location?.lat;
      const lng = data.result?.geometry?.location?.lng;
      if (data.status !== 'OK' || lat == null || lng == null) {
        if (data.status !== 'OK') {
          this.logger.warn(
            `Place details status=${data.status}` +
              (data.error_message ? ` — ${data.error_message}` : ''),
          );
        }
        return null;
      }
      return { lat, lng, address: data.result?.formatted_address };
    } catch (e) {
      this.logger.warn(`Place details failed: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Reverse geocoding — اسم الشارع/العنوان المختصر من إحداثيات.
   *
   * يُستخدم في شاشة «ضبط الالتقاط الدقيق»: عند توقّف الراكب عن تحريك الخريطة
   * نعرض اسم الشارع الحالي تحت الدبوس. نُفضّل مكوّن `route` (اسم الشارع) ثم
   * `neighborhood`/`sublocality`، وإلا نسقط على `formatted_address` المختصر.
   * يعتمد على Geocoding API (legacy) المُفعَّل على المفتاح.
   */
  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<PlaceLocationType | null> {
    if (!this.apiKey) return null;
    try {
      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        language: 'ar',
        key: this.apiKey,
      });
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
        { signal: AbortSignal.timeout(5000) },
      );
      const data = (await res.json()) as {
        status: string;
        error_message?: string;
        results?: Array<{
          formatted_address?: string;
          address_components?: Array<{
            long_name?: string;
            types?: string[];
          }>;
        }>;
      };
      if (data.status !== 'OK' || !data.results?.length) {
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          this.logger.warn(
            `Reverse geocode status=${data.status}` +
              (data.error_message ? ` — ${data.error_message}` : ''),
          );
        }
        return null;
      }
      // نبحث عن أدقّ تسمية مكانية عبر كل النتائج: شارع ثم حي.
      const pick = (type: string): string | undefined => {
        for (const r of data.results ?? []) {
          const comp = r.address_components?.find((c) =>
            c.types?.includes(type),
          );
          if (comp?.long_name) return comp.long_name;
        }
        return undefined;
      };
      const street =
        pick('route') ??
        pick('neighborhood') ??
        pick('sublocality') ??
        // أوّل عنوان مختصر (نأخذ أول جزأين قبل الفاصلة).
        data.results[0].formatted_address?.split(',').slice(0, 2).join('،');
      return { lat, lng, address: street };
    } catch (e) {
      this.logger.warn(`Reverse geocode failed: ${(e as Error).message}`);
      return null;
    }
  }
}
