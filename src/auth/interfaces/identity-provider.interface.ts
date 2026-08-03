import type { LoginDto } from '../dto/login.dto';
import type { AuthResult } from './auth-result.interface';
import type { AuthenticatedUser } from './authenticated-user.interface';

export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');

export interface IdentityProvider {
  login(credentials: LoginDto): Promise<AuthResult>;
  verifyAccessToken(accessToken: string): Promise<AuthenticatedUser>;
  mapIdentity(tokenPayload: unknown): AuthenticatedUser;
}
