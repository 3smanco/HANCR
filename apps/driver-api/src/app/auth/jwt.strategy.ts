import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

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
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ??
        'hancr_jwt_secret_change_in_production_min_32_chars',
    });
  }

  validate(payload: JwtPayload): AuthDriver {
    if (payload.type !== 'driver') {
      throw new UnauthorizedException('Invalid token type');
    }
    return { driverId: payload.sub, phone: payload.phone };
  }
}
