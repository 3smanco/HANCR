import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthService } from './auth.service';
import { captureException } from '@hancr/observability';

jest.mock('@hancr/observability', () => ({
  captureException: jest.fn(),
}));

describe('Driver AuthService OTP delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function serviceWithSmsFailure() {
    const redis = {
      incr: jest.fn(async () => 1),
      expire: jest.fn(async () => 1),
      setex: jest.fn(async () => 'OK'),
    };
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'ALLOW_TEST_PHONES') return 'false';
        return fallback;
      }),
    };
    const sms = {
      enabled: true,
      sendOtp: jest.fn(async () => ({ success: false, error: '21608' })),
    };

    const service = new AuthService(
      {} as never,
      {} as never,
      config as never,
      sms as never,
      {} as never,
      redis as never,
    );

    return { service, redis, sms };
  }

  it('does not expose OTP or report success when production SMS delivery fails', async () => {
    const { service, redis, sms } = serviceWithSmsFailure();

    const result = await service.sendOtp('+97455555555');

    expect(result).toMatchObject({
      success: false,
      devOtp: undefined,
    });
    expect(result.message).not.toContain('OTP sent');
    expect(redis.setex).toHaveBeenCalled();
    expect(sms.sendOtp).toHaveBeenCalledWith('+97455555555', expect.any(String), 'ar');
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      phone: '+97455555555',
      gateway: 'twilio',
    });
  });
});
