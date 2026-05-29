import {
  Injectable,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AdminUser } from './admin-jwt.strategy';

@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {
  override getRequest(context: ExecutionContext): unknown {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: unknown }>().req;
  }
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminUser => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: { user: AdminUser } }>().req.user;
  },
);
