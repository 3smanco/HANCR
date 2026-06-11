import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * أمن: يجبر وجود سرّ قوي (≥32 محرفاً) ويرفض الإقلاع بقيمة ضعيفة/افتراضية.
 * لا قيم احتياطية مزروعة في الكود إطلاقاً.
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

export interface JwtPayload {
  sub: number;       // rider ID
  phone: string;
  type: 'rider';
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  riderId: number;
  phone: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireSecret(configService, 'JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (payload.type !== 'rider') {
      throw new UnauthorizedException('Invalid token type');
    }
    return { riderId: payload.sub, phone: payload.phone };
  }
}
