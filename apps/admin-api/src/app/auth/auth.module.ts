import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from '@hancr/database';
import { AdminJwtStrategy, requireSecret } from './admin-jwt.strategy';
import { AuthResolver, AdminAuthService } from './auth.resolver';

type JwtExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: requireSecret(cfg, 'ADMIN_JWT_SECRET'),
        signOptions: { expiresIn: '24h' as JwtExpiresIn },
      }),
    }),
    TypeOrmModule.forFeature([AdminUserEntity]),
  ],
  providers: [AdminJwtStrategy, AuthResolver, AdminAuthService],
  exports: [JwtModule, PassportModule, AdminJwtStrategy],
})
export class AuthModule {}
