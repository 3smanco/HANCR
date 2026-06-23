import { buildGraphqlContext } from '@hancr/observability';

describe('buildGraphqlContext', () => {
  it('normalizes HTTP Authorization headers for guards', () => {
    const req = {
      headers: {
        Authorization: 'Bearer http-token',
      },
    };

    const context = buildGraphqlContext({ req });

    expect(context.req).toBe(req);
    expect(context.req.headers?.['authorization']).toBe('Bearer http-token');
  });

  it('maps WebSocket connection params to request headers', () => {
    const context = buildGraphqlContext({
      connectionParams: {
        Authorization: 'Bearer ws-token',
      },
    });

    expect(context.req.headers?.['authorization']).toBe('Bearer ws-token');
  });

  it('keeps existing lowercase HTTP authorization over connection params', () => {
    const context = buildGraphqlContext({
      req: {
        headers: {
          authorization: 'Bearer http-token',
        },
      },
      connectionParams: {
        Authorization: 'Bearer ws-token',
      },
    });

    expect(context.req.headers?.['authorization']).toBe('Bearer http-token');
  });
});
