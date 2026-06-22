import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverEntity } from '@hancr/database';

/**
 * أمن: يجبر وجود سرّ قوي (≥32 محرفاً) ويرفض الإقلاع بقيمة ضعيفة/افتراضية.
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
  sub: number;
  phone: string;
  type: 'driver';
  iat?: number;
  exp?: number;
}

export interface AuthDriver {
  driverId: number;
  phone: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // أمن: سرّ مستقل للسائق — لا يُشارَك مع الراكب/الأدمن (يمنع تزوير الأدوار).
      secretOrKey: requireSecret(configService, 'JWT_DRIVER_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthDriver> {
    if (payload.type !== 'driver') {
      throw new UnauthorizedException('Invalid token type');
    }

    const driver = await this.driverRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'banned'],
    });
    if (!driver) throw new UnauthorizedException('Account not found');
    if (driver.banned) throw new UnauthorizedException('Account is banned');

    return { driverId: payload.sub, phone: payload.phone };
  }
}
