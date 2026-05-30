import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * GqlThrottlerGuard — يدعم GraphQL context.
 *
 * NestJS ThrottlerGuard الافتراضي يحاول قراءة req.ip لكن في GraphQL
 * الـ request متاح فقط داخل GqlExecutionContext.
 *
 * هذا الـ guard:
 * - يستخرج req من GraphQL context إذا كان type === 'graphql'
 * - يقع على HTTP context للـ REST endpoints
 * - يضمن إرجاع response object صحيح
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  override getRequestResponse(context: ExecutionContext): {
    req: { ip?: string; ips?: string[]; headers?: Record<string, string> };
    res: object;
  } {
    if (context.getType<'graphql' | string>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<{
        req?: { ip?: string; ips?: string[]; headers?: Record<string, string> };
        res?: object;
      }>();
      // ApolloServer 4 + Fastify: ctx.req قد يكون undefined — fallback
      const req = ctx.req ?? { ip: '0.0.0.0', ips: [], headers: {} };
      const res = ctx.res ?? {};
      return { req, res };
    }
    // HTTP fallback
    const http = context.switchToHttp();
    return { req: http.getRequest(), res: http.getResponse() };
  }
}
