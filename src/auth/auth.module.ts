import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { IdentityProvider } from './interfaces/identity-provider.interface';
import { IDENTITY_PROVIDER } from './interfaces/identity-provider.interface';
import { DevelopmentIdentityProvider } from './providers/development-identity.provider';
import { UnavailableIdentityProvider } from './providers/unavailable-identity.provider';
import { ZitadelIdentityProvider } from './providers/zitadel-identity.provider';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    DevelopmentIdentityProvider,
    ZitadelIdentityProvider,
    {
      provide: IDENTITY_PROVIDER,
      inject: [
        ConfigService,
        DevelopmentIdentityProvider,
        ZitadelIdentityProvider,
      ],
      useFactory: (
        configService: ConfigService,
        developmentIdentityProvider: DevelopmentIdentityProvider,
        zitadelIdentityProvider: ZitadelIdentityProvider,
      ): IdentityProvider => {
        const authProvider = configService.get<string>('AUTH_PROVIDER');

        if (authProvider === 'development') {
          return developmentIdentityProvider;
        }

        if (authProvider === 'zitadel') {
          return zitadelIdentityProvider;
        }

        return new UnavailableIdentityProvider();
      },
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
