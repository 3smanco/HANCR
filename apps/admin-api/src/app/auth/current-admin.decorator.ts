import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AdminUser } from './admin-jwt.strategy';

/**
 * Extracts the authenticated admin user from the GraphQL request context.
 * Must be used on resolvers guarded by `AdminJwtGuard`.
 *
 * Usage:
 * ```ts
 * @UseGuards(AdminJwtGuard)
 * @Mutation(...)
 * doSomething(@CurrentAdmin() admin: AdminUser, @Args(...) input: ...) { ... }
 * ```
 */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminUser => {
    const gql = GqlExecutionContext.create(ctx);
    return gql.getContext<{ req: { user: AdminUser } }>().req.user;
  },
);
