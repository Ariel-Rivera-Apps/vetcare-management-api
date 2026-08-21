import { ServiceUnavailableException } from '@nestjs/common';
import type { AuthResult } from '../interfaces/auth-result.interface';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import type { IdentityProvider } from '../interfaces/identity-provider.interface';

export class UnavailableIdentityProvider implements IdentityProvider {
  login(): Promise<AuthResult> {
    return Promise.reject(this.unavailable());
  }

  verifyAccessToken(): Promise<AuthenticatedUser> {
    return Promise.reject(this.unavailable());
  }

  mapIdentity(): AuthenticatedUser {
    throw this.unavailable();
  }

  private unavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException(
      'Authentication provider is not available.',
    );
  }
}
