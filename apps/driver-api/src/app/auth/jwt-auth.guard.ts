import {
  Injectable,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthDriver } from './jwt.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override getRequest(context: ExecutionContext): unknown {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: unknown }>().req;
  }
}

export const CurrentDriver = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthDriver => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: { user: AuthDriver } }>().req.user;
  },
);
