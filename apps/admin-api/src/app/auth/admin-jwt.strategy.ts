import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

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
      secretOrKey: cfg.get<string>('ADMIN_JWT_SECRET') ?? 'hancr_admin_jwt_secret_change_in_production',
    });
  }

  validate(payload: AdminJwtPayload): AdminUser {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid token type');
    }
    return { adminId: payload.sub, email: payload.email, role: payload.role };
  }
}
