import type { AuthenticatedUser } from './authenticated-user.interface';

export interface AuthResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthenticatedUser;
}
