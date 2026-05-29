import {
  Injectable,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUser } from './jwt.strategy';

/**
 * JwtAuthGuard — يحمي GraphQL resolvers بـ JWT
 * يستخرج الـ request من GraphQL context بدلاً من HTTP context
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override getRequest(context: ExecutionContext): unknown {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: unknown }>().req;
  }
}

/**
 * @CurrentUser() — Decorator لاستخراج بيانات الراكب المسجّل من الـ JWT
 *
 * @example
 * \@Query(() => RiderType)
 * \@UseGuards(JwtAuthGuard)
 * me(\@CurrentUser() user: AuthUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: { user: AuthUser } }>().req.user;
  },
);
