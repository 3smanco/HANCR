import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * أمن: يجبر وجود سرّ أدمن قوي (≥32 محرفاً) ويرفض الإقلاع بقيمة ضعيفة/افتراضية.
 */
export function requireSecret(cfg: ConfigService, key: string): string {
  const v = cfg.get<string>(key);
  if (!v || v.trim().length < 32) {
    throw new Error(
      `[SECURITY] ${key} مفقود أو ضعيف (يجب ≥32 محرفاً عشوائياً). ` +
        `ولّد واحداً عبر: openssl rand -base64 48. رفض الإقلاع.`,
    );
  }
  return v;
}

export interface AdminJwtPayload {
  sub: number;
  email: string;
  /** super | ops | finance | marketing | support — also accepts legacy 'superadmin'|'admin' */
  role: string;
  type: 'admin';
}

export interface AdminUser {
  adminId: number;
  email: string;
  role: string;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireSecret(cfg, 'ADMIN_JWT_SECRET'),
    });
  }

  validate(payload: AdminJwtPayload): AdminUser {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid token type');
    }
    return { adminId: payload.sub, email: payload.email, role: payload.role };
  }
}
