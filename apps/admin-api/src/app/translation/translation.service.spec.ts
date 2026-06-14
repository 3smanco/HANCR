import { describe, it, expect } from '@jest/globals';
import {
  detectScript,
  dominantScript,
  needsTranslation,
} from './translation.service';

describe('detectScript', () => {
  it('arabic للنص العربي', () => {
    expect(detectScript('مرحبا أين أنت')).toBe('arabic');
  });
  it('latin للنص اللاتيني', () => {
    expect(detectScript('hello where are you')).toBe('latin');
  });
  it('unknown للأرقام/الرموز فقط', () => {
    expect(detectScript('123 !!! ...')).toBe('unknown');
  });
  it('يرجّح الأكثر في النص المختلط', () => {
    expect(detectScript('مرحبا مرحبا ok')).toBe('arabic');
    expect(detectScript('hi there مرحبا')).toBe('latin');
  });
});

describe('dominantScript', () => {
  it('يرجع الأكثر تكراراً متجاهلاً unknown', () => {
    expect(dominantScript(['arabic', 'arabic', 'latin', 'unknown'])).toBe(
      'arabic',
    );
  });
  it('undefined للقائمة الفارغة أو كلها unknown', () => {
    expect(dominantScript([])).toBeUndefined();
    expect(dominantScript(['unknown', 'unknown'])).toBeUndefined();
  });
});

describe('needsTranslation', () => {
  it('true لنظامين مختلفين معروفين', () => {
    expect(needsTranslation('arabic', 'latin')).toBe(true);
  });
  it('false لنفس النظام', () => {
    expect(needsTranslation('arabic', 'arabic')).toBe(false);
  });
  it('false إن غاب أحد الطرفين', () => {
    expect(needsTranslation('arabic', undefined)).toBe(false);
    expect(needsTranslation(undefined, undefined)).toBe(false);
  });
});
