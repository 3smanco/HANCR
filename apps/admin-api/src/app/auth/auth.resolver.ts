import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AdminUserEntity } from '@hancr/database';
import { AdminJwtPayload } from './admin-jwt.strategy';

@ObjectType()
class AdminLoginResponse {
  @Field() accessToken!: string;
  @Field() email!: string;
  @Field() role!: string;
  @Field({ nullable: true }) fullName?: string;
}

/**
 * I5 — DB-backed admin authentication with bcrypt.
 *
 * Bootstrap: on first start, if the DB has no admin users, we seed
 * one from ADMIN_DEFAULT_EMAIL/PASSWORD env vars as a 'super'.
 * After that, only DB credentials are accepted.
 */
@Injectable()
class AdminAuthService implements OnModuleInit {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly cfg: ConfigService,
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.adminRepo.count();
    if (count > 0) return;
    const email =
      this.cfg.get<string>('ADMIN_DEFAULT_EMAIL') ?? 'admin@hancr.com';
    const password =
      this.cfg.get<string>('ADMIN_DEFAULT_PASSWORD') ??
      'change_me_in_production';
    const passwordHash = await bcrypt.hash(password, 10);
    await this.adminRepo.save(
      this.adminRepo.create({
        email,
        passwordHash,
        fullName: 'Super Admin',
        role: 'super',
        active: true,
      }),
    );
    this.logger.warn(
      `Seeded initial super admin: ${email}. CHANGE THE PASSWORD on first login.`,
    );
  }

  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const user = await this.adminRepo.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    user.lastLoginAt = new Date();
    await this.adminRepo.save(user);

    const payload: AdminJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as AdminJwtPayload['role'],
      type: 'admin',
    };

    const secret =
      this.cfg.get<string>('ADMIN_JWT_SECRET') ??
      'hancr_admin_jwt_secret_change_in_production';
    const accessToken = this.jwtService.sign(payload, { secret });

    return {
      accessToken,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
  }
}

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AdminAuthService) {}

  @Mutation(() => AdminLoginResponse, { description: 'تسجيل دخول المشرف' })
  adminLogin(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AdminLoginResponse> {
    return this.authService.login(email, password);
  }
}

export { AdminAuthService };
