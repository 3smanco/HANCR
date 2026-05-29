import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentGateway } from '@hancr/database';

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentGatewayService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => undefined) },
        },
      ],
    }).compile();

    service = module.get<PaymentGatewayService>(PaymentGatewayService);
  });

  describe('createCheckout', () => {
    it('HyperPay يُرجع redirectUrl', async () => {
      const result = await service.createCheckout(PaymentGateway.HyperPay, {
        amount: 100,
        currency: 'SAR',
        internalRef: '42',
      });

      expect(result.gateway).toBe(PaymentGateway.HyperPay);
      expect(result.gatewayRef).toMatch(/^hpay_/);
      expect(result.redirectUrl).toBeDefined();
    });

    it('Moyasar يُرجع redirectUrl', async () => {
      const result = await service.createCheckout(PaymentGateway.Moyasar, {
        amount: 100,
        currency: 'SAR',
        internalRef: '42',
      });

      expect(result.gateway).toBe(PaymentGateway.Moyasar);
      expect(result.gatewayRef).toMatch(/^moy_/);
      expect(result.redirectUrl).toBeDefined();
    });

    it('Stripe يُرجع clientSecret', async () => {
      const result = await service.createCheckout(PaymentGateway.Stripe, {
        amount: 100,
        currency: 'USD',
        internalRef: '42',
      });

      expect(result.gateway).toBe(PaymentGateway.Stripe);
      expect(result.gatewayRef).toMatch(/^pi_/);
      expect(result.clientSecret).toBeDefined();
      expect(result.redirectUrl).toBeUndefined();
    });

    it('ApplePay يُرجع clientSecret', async () => {
      const result = await service.createCheckout(PaymentGateway.ApplePay, {
        amount: 100,
        currency: 'AED',
        internalRef: '42',
      });

      expect(result.gateway).toBe(PaymentGateway.ApplePay);
      expect(result.clientSecret).toBeDefined();
    });

    it('GooglePay يُرجع clientSecret', async () => {
      const result = await service.createCheckout(PaymentGateway.GooglePay, {
        amount: 100,
        currency: 'AED',
        internalRef: '42',
      });

      expect(result.gateway).toBe(PaymentGateway.GooglePay);
      expect(result.clientSecret).toBeDefined();
    });

    it('Internal gateway غير مدعوم', async () => {
      await expect(
        service.createCheckout(PaymentGateway.Internal, {
          amount: 100,
          currency: 'SAR',
          internalRef: '42',
        }),
      ).rejects.toThrow('Unsupported gateway');
    });
  });

  describe('parseWebhook', () => {
    it('يُحوِّل status="paid" إلى success', () => {
      const event = service.parseWebhook(
        PaymentGateway.HyperPay,
        {},
        {
          id: 'hpay_xyz',
          status: 'paid',
          amount: 100,
          currency: 'SAR',
          internal_ref: '42',
        },
      );

      expect(event.status).toBe('success');
      expect(event.gatewayRef).toBe('hpay_xyz');
      expect(event.internalRef).toBe('42');
      expect(event.amount).toBe(100);
    });

    it('يُحوِّل status="succeeded" إلى success', () => {
      const event = service.parseWebhook(
        PaymentGateway.Stripe,
        {},
        { id: 'pi_x', status: 'succeeded', internal_ref: '1' },
      );
      expect(event.status).toBe('success');
    });

    it('يُحوِّل status="failed" إلى failure', () => {
      const event = service.parseWebhook(
        PaymentGateway.Moyasar,
        {},
        { id: 'moy_x', status: 'failed', internal_ref: '1' },
      );
      expect(event.status).toBe('failure');
    });

    it('يُحوِّل status="declined" إلى failure', () => {
      const event = service.parseWebhook(
        PaymentGateway.HyperPay,
        {},
        { id: 'h_x', status: 'declined', internal_ref: '1' },
      );
      expect(event.status).toBe('failure');
    });

    it('default إلى pending عند حالة غير معروفة', () => {
      const event = service.parseWebhook(
        PaymentGateway.HyperPay,
        {},
        { id: 'h_x', status: 'processing', internal_ref: '1' },
      );
      expect(event.status).toBe('pending');
    });

    it('يستخرج currency من payload', () => {
      const event = service.parseWebhook(
        PaymentGateway.Moyasar,
        {},
        { id: 'm_x', status: 'paid', currency: 'AED', internal_ref: '1' },
      );
      expect(event.currency).toBe('AED');
    });

    it('default currency = SAR لو غير موجود', () => {
      const event = service.parseWebhook(
        PaymentGateway.Moyasar,
        {},
        { id: 'm_x', status: 'paid', internal_ref: '1' },
      );
      expect(event.currency).toBe('SAR');
    });

    it('rawPayload يحفظ الـ body كاملاً', () => {
      const body = {
        id: 'h_x',
        status: 'paid',
        amount: 50,
        internal_ref: '1',
        extra: 'data',
      };
      const event = service.parseWebhook(PaymentGateway.HyperPay, {}, body);
      expect(event.rawPayload).toEqual(body);
    });
  });
});
