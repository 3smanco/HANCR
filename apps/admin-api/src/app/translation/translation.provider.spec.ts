import { describe, it, expect } from '@jest/globals';
import {
  buildTranslateRequest,
  parseTranslateResponse,
} from './translation.provider';

describe('buildTranslateRequest', () => {
  it('يبني url+body صحيحين ويُرمِّز المفتاح', () => {
    const r = buildTranslateRequest('hello', 'ar', 'k e/y');
    expect(r.url).toContain('translation.googleapis.com');
    expect(r.url).toContain('key=k%20e%2Fy');
    expect(r.body).toEqual({ q: 'hello', target: 'ar', format: 'text' });
  });
});

describe('parseTranslateResponse', () => {
  it('يستخرج النصّ المُترجَم واللغة المصدر', () => {
    const r = parseTranslateResponse({
      data: {
        translations: [
          { translatedText: 'مرحبا', detectedSourceLanguage: 'en' },
        ],
      },
    });
    expect(r.translatedText).toBe('مرحبا');
    expect(r.detectedSourceLanguage).toBe('en');
    expect(r.error).toBeUndefined();
  });

  it('يُرجع الخطأ من ردّ المزوّد', () => {
    const r = parseTranslateResponse({ error: { message: 'API key invalid' } });
    expect(r.error).toBe('API key invalid');
  });

  it('empty_translation عند غياب الترجمة', () => {
    const r = parseTranslateResponse({ data: { translations: [] } });
    expect(r.error).toBe('empty_translation');
  });
});
