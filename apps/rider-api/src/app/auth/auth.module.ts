import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RiderEntity, RiderDeviceEntity } from '@hancr/database';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy, requireSecret } from './jwt.strategy';

type JwtExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

@Module({
  imports: [
    TypeOrmModule.forFeature([RiderEntity, RiderDeviceEntity]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: requireSecret(cfg, 'JWT_SECRET'),
        signOptions: {
          expiresIn: cfg.get<JwtExpiresIn>('JWT_EXPIRES_IN') ?? '7d',
        },
      }),
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy],
  exports: [JwtModule, PassportModule, JwtStrategy],
})
export class AuthModule {}
