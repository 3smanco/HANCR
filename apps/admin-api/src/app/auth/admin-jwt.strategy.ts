import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUserEntity } from '@hancr/database';

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
  constructor(
    cfg: ConfigService,
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireSecret(cfg, 'ADMIN_JWT_SECRET'),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminUser> {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid token type');
    }

    const admin = await this.adminRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'role', 'active'],
    });
    if (!admin || !admin.active) {
      throw new UnauthorizedException('Admin account is inactive');
    }

    return { adminId: admin.id, email: admin.email, role: admin.role };
  }
}
