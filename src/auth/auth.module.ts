import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IDENTITY_PROVIDER } from './interfaces/identity-provider.interface';
import { DevelopmentIdentityProvider } from './providers/development-identity.provider';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    DevelopmentIdentityProvider,
    {
      provide: IDENTITY_PROVIDER,
      useExisting: DevelopmentIdentityProvider,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
