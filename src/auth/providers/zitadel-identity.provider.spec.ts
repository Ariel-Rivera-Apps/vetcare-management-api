import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyJwtWithRemoteJwks } from './jwt-verifier';
import { ZitadelIdentityProvider } from './zitadel-identity.provider';

jest.mock('./jwt-verifier', () => ({
  verifyJwtWithRemoteJwks: jest.fn(),
}));

describe('ZitadelIdentityProvider', () => {
  const env: Record<string, string | undefined> = {
    AUTH_PROVIDER: 'zitadel',
    ZITADEL_ISSUER: 'https://issuer.zitadel.cloud/',
    ZITADEL_PROJECT_ID: 'project-id',
    ZITADEL_AUDIENCE: 'api-audience',
  };

  function createProvider(
    overrides: Record<string, string | undefined> = {},
  ): ZitadelIdentityProvider {
    const config = {
      ...env,
      ...overrides,
    };

    return new ZitadelIdentityProvider({
      get: jest.fn((key: string) => config[key]),
    } as unknown as ConfigService);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates access tokens with ZITADEL issuer, audience and JWKS', async () => {
    jest.mocked(verifyJwtWithRemoteJwks).mockResolvedValue({
      payload: {
        sub: 'user-123',
        email: 'user@example.com',
        name: 'User Example',
        'urn:zitadel:iam:org:project:roles': {
          RECEPTIONIST: {
            org1: 'vetcare.local',
          },
        },
        'urn:zitadel:iam:org:project:project-id:roles': {
          ADMIN: {
            org1: 'vetcare.local',
          },
        },
        permissions: ['owners:read'],
      },
    });

    const provider = createProvider();
    const user = await provider.verifyAccessToken('access-token');

    expect(verifyJwtWithRemoteJwks).toHaveBeenCalledWith(
      'access-token',
      new URL('https://issuer.zitadel.cloud/oauth/v2/keys'),
      {
        issuer: 'https://issuer.zitadel.cloud',
        audience: 'api-audience',
        algorithms: ['RS256', 'ES256'],
      },
    );
    expect(user).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      displayName: 'User Example',
      roles: ['ADMIN', 'RECEPTIONIST'],
      permissions: ['owners:read'],
    });
  });

  it('rejects invalid or expired ZITADEL access tokens', async () => {
    jest
      .mocked(verifyJwtWithRemoteJwks)
      .mockRejectedValue(new Error('signature failed'));

    await expect(
      createProvider().verifyAccessToken('invalid-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not offer password login for ZITADEL', async () => {
    await expect(
      createProvider().login({
        email: 'user@example.com',
        password: 'password',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('reports missing ZITADEL configuration as a controlled error', async () => {
    await expect(
      createProvider({ ZITADEL_AUDIENCE: undefined }).verifyAccessToken(
        'access-token',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
