import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from '@hancr/database';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AuthResolver, AdminAuthService } from './auth.resolver';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret:
          cfg.get<string>('ADMIN_JWT_SECRET') ??
          'hancr_admin_jwt_secret_change_in_production',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    TypeOrmModule.forFeature([AdminUserEntity]),
  ],
  providers: [AdminJwtStrategy, AuthResolver, AdminAuthService],
  exports: [JwtModule, PassportModule, AdminJwtStrategy],
})
export class AuthModule {}
