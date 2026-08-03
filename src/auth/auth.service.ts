import { Inject, Injectable } from '@nestjs/common';
import type { LoginDto } from './dto/login.dto';
import type { AuthResult } from './interfaces/auth-result.interface';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { IDENTITY_PROVIDER } from './interfaces/identity-provider.interface';
import type { IdentityProvider } from './interfaces/identity-provider.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IdentityProvider,
  ) {}

  login(credentials: LoginDto): Promise<AuthResult> {
    return this.identityProvider.login(credentials);
  }

  verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    return this.identityProvider.verifyAccessToken(accessToken);
  }
}
