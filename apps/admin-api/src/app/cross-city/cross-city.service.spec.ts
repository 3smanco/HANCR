import { describe, it, expect } from '@jest/globals';
import { bookingUrgency } from './cross-city.service';

describe('bookingUrgency', () => {
  it('imminent عند ≤ ساعتين', () => {
    expect(bookingUrgency(0)).toBe('imminent');
    expect(bookingUrgency(120)).toBe('imminent');
    expect(bookingUrgency(-10)).toBe('imminent'); // فات قليلاً = ملحّ
  });

  it('soon بين ساعتين و24 ساعة', () => {
    expect(bookingUrgency(121)).toBe('soon');
    expect(bookingUrgency(1440)).toBe('soon');
  });

  it('scheduled لما بعد 24 ساعة', () => {
    expect(bookingUrgency(1441)).toBe('scheduled');
    expect(bookingUrgency(10080)).toBe('scheduled'); // أسبوع
  });
});
