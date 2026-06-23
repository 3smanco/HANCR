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
import { Throttle } from '@nestjs/throttler';
import * as bcrypt from 'bcryptjs';
import { AdminUserEntity } from '@hancr/database';
import { AdminJwtPayload, requireSecret } from './admin-jwt.strategy';

const ADMIN_DEFAULT_PASSWORD_MIN_LENGTH = 16;
const BLOCKED_ADMIN_DEFAULT_PASSWORDS = new Set([
  'change_me_in_production',
  'admin123456',
  'password',
  'password123',
]);
const PLACEHOLDER_ADMIN_PASSWORD_PATTERN =
  /^(change_me|your_|your-|your\b|admin\b)/i;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const { email, password } = this.bootstrapCredentials();
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

  private bootstrapCredentials(): { email: string; password: string } {
    const rawEmail =
      this.cfg.get<string>('ADMIN_DEFAULT_EMAIL') ?? 'admin@hancr.com';
    const rawPassword =
      this.cfg.get<string>('ADMIN_DEFAULT_PASSWORD') ??
      'change_me_in_production';
    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();

    if (this.cfg.get<string>('NODE_ENV') !== 'production') {
      return { email, password };
    }

    if (!this.cfg.get<string>('ADMIN_DEFAULT_EMAIL')?.trim()) {
      throw new Error(
        '[SECURITY] ADMIN_DEFAULT_EMAIL must be set before seeding the first production admin.',
      );
    }
    if (!BASIC_EMAIL_PATTERN.test(email)) {
      throw new Error(
        '[SECURITY] ADMIN_DEFAULT_EMAIL must be a valid email before seeding the first production admin.',
      );
    }

    const normalizedPassword = password.toLowerCase();
    if (
      password.length < ADMIN_DEFAULT_PASSWORD_MIN_LENGTH ||
      BLOCKED_ADMIN_DEFAULT_PASSWORDS.has(normalizedPassword) ||
      PLACEHOLDER_ADMIN_PASSWORD_PATTERN.test(normalizedPassword)
    ) {
      throw new Error(
        `[SECURITY] ADMIN_DEFAULT_PASSWORD must be a non-placeholder value with at least ${ADMIN_DEFAULT_PASSWORD_MIN_LENGTH} characters before seeding the first production admin.`,
      );
    }

    return { email, password };
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

    const secret = requireSecret(this.cfg, 'ADMIN_JWT_SECRET');
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
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  adminLogin(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AdminLoginResponse> {
    return this.authService.login(email, password);
  }
}

export { AdminAuthService };
