import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { RiderEntity } from '@hancr/database';

/** مفتاح Redis لإبطال جلسات الراكب (طابع زمني آخر تسجيل خروج، ms) */
export const revokedKey = (riderId: number): string =>
  `hancr:revoked:rider:${riderId}`;

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
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRedis() private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireSecret(configService, 'JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type !== 'rider') {
      throw new UnauthorizedException('Invalid token type');
    }

    // إبطال الجلسة عند تسجيل الخروج: أي توكن صدر قبل آخر logout يُرفض.
    const revokedAt = await this.redis.get(revokedKey(payload.sub));
    if (revokedAt && payload.iat && payload.iat * 1000 < Number(revokedAt)) {
      throw new UnauthorizedException('Session revoked. Please sign in again.');
    }

    // إعادة فحص الحظر: حساب محظور يتوقف توكنه فوراً (لا ينتظر انتهاء الصلاحية).
    const rider = await this.riderRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'banned'],
    });
    if (!rider) throw new UnauthorizedException('Account not found');
    if (rider.banned) throw new UnauthorizedException('Account is banned');

    return { riderId: payload.sub, phone: payload.phone };
  }
}
