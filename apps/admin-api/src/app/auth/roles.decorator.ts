import { SetMetadata } from '@nestjs/common';

export const ADMIN_ROLES_KEY = 'admin_roles';

/**
 * I5 — قيد الصلاحية على resolver/mutation.
 *
 * @example
 *   \@UseGuards(AdminJwtGuard, AdminRolesGuard)
 *   \@RequireRole('super', 'finance')
 *   adminAdjustWallet(...) { ... }
 */
export const RequireRole = (...roles: string[]) =>
  SetMetadata(ADMIN_ROLES_KEY, roles);
