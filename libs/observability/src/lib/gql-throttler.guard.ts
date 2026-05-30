import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * GqlThrottlerGuard — يدعم GraphQL + Fastify.
 * يوفر res.header() polyfill لتجنب crash مع Fastify.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  override getRequestResponse(context: ExecutionContext): {
    req: { ip?: string; ips?: string[]; headers?: Record<string, string> };
    res: { header: (key: string, value: string | number) => void };
  } {
    const noopHeader = () => {
      /* no-op for Fastify compatibility */
    };

    if (context.getType<'graphql' | string>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<{
        req?: { ip?: string; ips?: string[]; headers?: Record<string, string> };
      }>();
      const req = ctx.req ?? { ip: '0.0.0.0', ips: [], headers: {} };
      const headers = req.headers ?? {};
      if (!req.ip && headers['x-forwarded-for']) {
        req.ip = headers['x-forwarded-for'].split(',')[0].trim();
      }
      if (!req.ip) req.ip = '0.0.0.0';
      return { req, res: { header: noopHeader } };
    }

    const http = context.switchToHttp();
    const rawRes = http.getResponse<{
      header?: (k: string, v: string | number) => void;
      setHeader?: (k: string, v: string | number) => void;
    }>();
    const res = {
      header: (k: string, v: string | number) => {
        if (typeof rawRes.header === 'function') {
          rawRes.header(k, v);
        } else if (typeof rawRes.setHeader === 'function') {
          rawRes.setHeader(k, v);
        }
      },
    };
    return { req: http.getRequest(), res };
  }
}
