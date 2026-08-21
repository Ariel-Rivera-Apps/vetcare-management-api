import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JWTPayload } from 'jose';
import type { AuthResult } from '../interfaces/auth-result.interface';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import type { IdentityProvider } from '../interfaces/identity-provider.interface';
import { verifyJwtWithRemoteJwks } from './jwt-verifier';

interface ZitadelAuthConfig {
  issuer: string;
  audience: string;
  projectId?: string;
}

const PROJECT_ROLES_CLAIM = 'urn:zitadel:iam:org:project:roles';

@Injectable()
export class ZitadelIdentityProvider implements IdentityProvider, OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    if (this.isEnabled()) {
      this.getConfig();
    }
  }

  login(): Promise<AuthResult> {
    return Promise.reject(
      new ServiceUnavailableException(
        'Password login is not available for ZITADEL authentication.',
      ),
    );
  }

  async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    const config = this.getConfig();

    try {
      const { payload } = await verifyJwtWithRemoteJwks(
        accessToken,
        new URL(`${config.issuer}/oauth/v2/keys`),
        {
          issuer: config.issuer,
          audience: config.audience,
          algorithms: ['RS256', 'ES256'],
        },
      );

      return this.mapIdentity(payload);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  mapIdentity(tokenPayload: unknown): AuthenticatedUser {
    const payload = this.assertPayload(tokenPayload);
    const roles = this.extractRoles(payload);
    const permissions = this.extractPermissions(payload);
    const email = this.getStringClaim(payload, 'email') ?? '';
    const displayName =
      (this.getStringClaim(payload, 'name') ??
        this.getStringClaim(payload, 'preferred_username') ??
        email) ||
      payload.sub;

    return {
      id: payload.sub,
      email,
      displayName,
      roles,
      permissions,
    };
  }

  isEnabled(): boolean {
    return this.configService.get<string>('AUTH_PROVIDER') === 'zitadel';
  }

  private getConfig(): ZitadelAuthConfig {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'Authentication provider is not available.',
      );
    }

    const issuer = this.normalizeIssuer(
      this.configService.get<string>('ZITADEL_ISSUER'),
    );
    const audience = this.configService.get<string>('ZITADEL_AUDIENCE');
    const projectId = this.configService.get<string>('ZITADEL_PROJECT_ID');

    if (!issuer || !audience) {
      throw new ServiceUnavailableException(
        'ZITADEL authentication is not configured.',
      );
    }

    return {
      issuer,
      audience,
      projectId,
    };
  }

  private assertPayload(tokenPayload: unknown): JWTPayload & { sub: string } {
    if (
      !tokenPayload ||
      typeof tokenPayload !== 'object' ||
      typeof (tokenPayload as JWTPayload).sub !== 'string'
    ) {
      throw new UnauthorizedException('Invalid access token.');
    }

    return tokenPayload as JWTPayload & { sub: string };
  }

  private extractRoles(payload: JWTPayload): string[] {
    const config = this.getConfig();
    const claims = [
      PROJECT_ROLES_CLAIM,
      config.projectId
        ? `urn:zitadel:iam:org:project:${config.projectId}:roles`
        : undefined,
    ].filter((claim): claim is string => Boolean(claim));
    const roles = new Set<string>();

    for (const claim of claims) {
      this.addRolesFromClaim(payload[claim], roles);
    }

    return [...roles].sort();
  }

  private extractPermissions(payload: JWTPayload): string[] {
    const permissions = payload.permissions;

    if (Array.isArray(permissions)) {
      return permissions.filter(
        (permission): permission is string => typeof permission === 'string',
      );
    }

    if (typeof permissions === 'string') {
      return permissions.split(' ').filter(Boolean);
    }

    return [];
  }

  private addRolesFromClaim(claim: unknown, roles: Set<string>): void {
    if (!claim || typeof claim !== 'object') {
      return;
    }

    for (const role of Object.keys(claim)) {
      roles.add(role);
    }
  }

  private getStringClaim(
    payload: JWTPayload,
    claimName: string,
  ): string | undefined {
    const value = payload[claimName];
    return typeof value === 'string' ? value : undefined;
  }

  private normalizeIssuer(issuer?: string): string | undefined {
    return issuer?.replace(/\/+$/, '');
  }
}
