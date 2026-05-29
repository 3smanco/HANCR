import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminJwtPayload } from './admin-jwt.strategy';

@ObjectType()
class AdminLoginResponse {
  @Field() accessToken!: string;
  @Field() email!: string;
  @Field() role!: string;
}

@Injectable()
class AdminAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  login(email: string, password: string): AdminLoginResponse {
    // Development: accept configured admin credentials
    const adminEmail = this.cfg.get<string>('ADMIN_DEFAULT_EMAIL') ?? 'admin@hancr.com';
    const adminPassword = this.cfg.get<string>('ADMIN_DEFAULT_PASSWORD') ?? 'change_me_in_production';

    if (email !== adminEmail || password !== adminPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AdminJwtPayload = {
      sub: 1,
      email,
      role: 'superadmin',
      type: 'admin',
    };

    const secret = this.cfg.get<string>('ADMIN_JWT_SECRET') ?? 'hancr_admin_jwt_secret_change_in_production';
    const accessToken = this.jwtService.sign(payload, { secret });

    return { accessToken, email, role: 'superadmin' };
  }
}

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AdminAuthService) {}

  @Mutation(() => AdminLoginResponse, { description: 'تسجيل دخول المشرف' })
  adminLogin(
    @Args('email') email: string,
    @Args('password') password: string,
  ): AdminLoginResponse {
    return this.authService.login(email, password);
  }
}

export { AdminAuthService };
