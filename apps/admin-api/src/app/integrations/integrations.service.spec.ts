import { describe, it, expect } from '@jest/globals';
import { providerStatus, recommendProvider } from './integrations.service';

describe('recommendProvider', () => {
  it('دفع الخليج → Checkout.com', () => {
    expect(recommendProvider('payment', 'SA').provider).toBe('Checkout.com');
    expect(recommendProvider('payment', 'QA').provider).toBe('Checkout.com');
  });

  it('دفع الغرب → Stripe', () => {
    expect(recommendProvider('payment', 'GB').provider).toBe('Stripe');
    expect(recommendProvider('payment', 'US').provider).toBe('Stripe');
  });

  it('رسائل الخليج → Unifonic', () => {
    expect(recommendProvider('sms', 'AE').provider).toBe('Unifonic');
  });

  it('رسائل الغرب → Twilio', () => {
    expect(recommendProvider('sms', 'FR').provider).toBe('Twilio');
  });

  it('خرائط موحَّدة عبر الأسواق', () => {
    expect(recommendProvider('maps', 'SA').provider).toBe('Google Maps');
    expect(recommendProvider('maps', 'US').provider).toBe('Google Maps');
  });

  it('كل قناة تُرجع envKey إرشادياً', () => {
    expect(recommendProvider('payment', 'SA').envKey).toBe('CHECKOUT_SECRET_KEY');
    expect(recommendProvider('sms', 'GB').envKey).toBe('TWILIO_AUTH_TOKEN');
  });
});

describe('providerStatus', () => {
  it('live عند وجود المفتاح', () => {
    expect(providerStatus('STRIPE_SECRET_KEY', { STRIPE_SECRET_KEY: 'sk_x' })).toBe(
      'live',
    );
  });

  it('pending عند غياب المفتاح', () => {
    expect(providerStatus('STRIPE_SECRET_KEY', {})).toBe('pending');
  });

  it('pending عند مفتاح فارغ أو فراغات', () => {
    expect(providerStatus('X', { X: '' })).toBe('pending');
    expect(providerStatus('X', { X: '   ' })).toBe('pending');
  });
});
