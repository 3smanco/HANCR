import { Injectable, Logger } from '@nestjs/common';

const TRANSLATION_ENV_KEY = 'TRANSLATION_API_KEY';
const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

export interface TranslateOutcome {
  configured: boolean;
  translatedText?: string;
  detectedSourceLanguage?: string;
  provider: string;
  error?: string;
}

/**
 * يبني طلب Google Translate v2 (REST). دالة نقيّة قابلة للاختبار.
 */
export function buildTranslateRequest(
  text: string,
  target: string,
  key: string,
): { url: string; body: Record<string, string> } {
  return {
    url: `${ENDPOINT}?key=${encodeURIComponent(key)}`,
    body: { q: text, target, format: 'text' },
  };
}

interface GoogleTranslateResponse {
  data?: {
    translations?: Array<{
      translatedText?: string;
      detectedSourceLanguage?: string;
    }>;
  };
  error?: { message?: string };
}

/**
 * يحلّل ردّ Google Translate v2 إلى نتيجة موحَّدة. دالة نقيّة قابلة للاختبار.
 */
export function parseTranslateResponse(json: GoogleTranslateResponse): {
  translatedText?: string;
  detectedSourceLanguage?: string;
  error?: string;
} {
  if (json.error?.message) return { error: json.error.message };
  const t = json.data?.translations?.[0];
  if (!t?.translatedText) return { error: 'empty_translation' };
  return {
    translatedText: t.translatedText,
    detectedSourceLanguage: t.detectedSourceLanguage,
  };
}

/**
 * TranslationProvider — مُحوِّل الترجمة الفعلي (Google Translate v2).
 * يُفعَّل فور وجود `TRANSLATION_API_KEY` في البيئة (نفس نمط Twilio/Stripe):
 * بلا مفتاح → `configured:false` دون كسر. لا يكشف المفتاح أبداً.
 */
@Injectable()
export class TranslationProvider {
  private readonly logger = new Logger(TranslationProvider.name);

  isConfigured(): boolean {
    const k = process.env[TRANSLATION_ENV_KEY];
    return !!k && k.trim().length > 0;
  }

  get envKey(): string {
    return TRANSLATION_ENV_KEY;
  }

  async translate(text: string, target = 'ar'): Promise<TranslateOutcome> {
    const key = process.env[TRANSLATION_ENV_KEY];
    if (!key || key.trim().length === 0) {
      return { configured: false, provider: 'Google Translate' };
    }
    if (!text || text.trim().length === 0) {
      return { configured: true, translatedText: '', provider: 'Google Translate' };
    }
    try {
      const { url, body } = buildTranslateRequest(text, target, key);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as GoogleTranslateResponse;
      const parsed = parseTranslateResponse(json);
      if (parsed.error) {
        this.logger.warn(`Translation failed: ${parsed.error}`);
        return { configured: true, provider: 'Google Translate', error: parsed.error };
      }
      return {
        configured: true,
        translatedText: parsed.translatedText,
        detectedSourceLanguage: parsed.detectedSourceLanguage,
        provider: 'Google Translate',
      };
    } catch (e) {
      const msg = (e as Error).message;
      this.logger.warn(`Translation request error: ${msg}`);
      return { configured: true, provider: 'Google Translate', error: msg };
    }
  }
}
