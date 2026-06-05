import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ADMIN_ROLES_KEY } from './roles.decorator';
import { AdminUser } from './admin-jwt.strategy';

/**
 * يُطبَّق بعد AdminJwtGuard في نفس @UseGuards.
 * 'super' دائماً مسموح.
 */
@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext<{ req: { user?: AdminUser } }>().req.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    if (user.role === 'super') return true;
    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `Role '${user.role}' is not authorized (need: ${required.join(', ')})`,
      );
    }
    return true;
  }
}
