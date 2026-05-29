import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

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
      secretOrKey:
        configService.get<string>('JWT_SECRET') ??
        'hancr_jwt_secret_change_in_production_min_32_chars',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (payload.type !== 'rider') {
      throw new UnauthorizedException('Invalid token type');
    }
    return { riderId: payload.sub, phone: payload.phone };
  }
}
