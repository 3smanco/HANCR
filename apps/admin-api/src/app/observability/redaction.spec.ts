import { maskEmail, maskPhoneNumber } from '@hancr/observability';

describe('log redaction helpers', () => {
  it('masks phone numbers while keeping them useful for correlation', () => {
    expect(maskPhoneNumber('+97455551234')).toBe('+97***34');
    expect(maskPhoneNumber('5555')).toBe('****');
    expect(maskPhoneNumber('')).toBe('[missing-phone]');
  });

  it('masks email local and domain names', () => {
    expect(maskEmail('Owner@HANCR.COM')).toBe('o***r@h***r.com');
    expect(maskEmail('a@io')).toBe('a***@i***');
    expect(maskEmail('')).toBe('[missing-email]');
  });
});
