import { ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { SentryExceptionFilter } from '@hancr/observability';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

function createHttpFilter() {
  const response = {};
  const httpAdapter = {
    isHeadersSent: jest.fn(() => false),
    reply: jest.fn(),
    end: jest.fn(),
  };
  const httpAdapterHost = { httpAdapter } as unknown as HttpAdapterHost;
  const filter = new SentryExceptionFilter(httpAdapterHost);
  const host = {
    getType: jest.fn(() => 'http'),
    getArgByIndex: jest.fn((index: number) => (index === 1 ? response : {})),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({})),
      getResponse: jest.fn(() => response),
      getNext: jest.fn(() => undefined),
    })),
  } as unknown as ArgumentsHost;

  return { filter, host, httpAdapter };
}

describe('SentryExceptionFilter', () => {
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('lets Nest render HTTP client errors without reporting to Sentry', () => {
    const { filter, host, httpAdapter } = createHttpFilter();

    expect(() => filter.catch(new NotFoundException('missing'), host)).not.toThrow();

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(httpAdapter.reply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ statusCode: 404 }),
      404,
    );
  });

  it('reports HTTP server errors to Sentry and lets Nest render the response', () => {
    const { filter, host, httpAdapter } = createHttpFilter();
    const error = new Error('boom');

    expect(() => filter.catch(error, host)).not.toThrow();

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(httpAdapter.reply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ statusCode: 500 }),
      500,
    );
  });

  it('rethrows GraphQL errors after reporting them to Sentry', () => {
    const { filter } = createHttpFilter();
    const error = new Error('graphql boom');
    const host = {
      getType: jest.fn(() => 'graphql'),
    } as unknown as ArgumentsHost;

    expect(() => filter.catch(error, host)).toThrow(error);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
