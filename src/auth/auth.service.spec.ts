import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { IDENTITY_PROVIDER } from './interfaces/identity-provider.interface';
import { DevelopmentIdentityProvider } from './providers/development-identity.provider';
import { UnavailableIdentityProvider } from './providers/unavailable-identity.provider';

describe('AuthService', () => {
  const credentials: LoginDto = {
    email: 'receptionist@vetcare.local',
    password: 'local-password',
  };
  let service: AuthService;
  let jwtService: JwtService;

  async function createTestingModule(
    overrides: Record<string, string | undefined> = {},
  ): Promise<TestingModule> {
    const env: Record<string, string | undefined> = {
      NODE_ENV: 'test',
      AUTH_PROVIDER: 'development',
      DEVELOPMENT_AUTH_EMAIL: credentials.email,
      DEVELOPMENT_AUTH_PASSWORD: credentials.password,
      DEVELOPMENT_AUTH_JWT_SECRET: 'unit-test-secret-with-sufficient-length',
      DEVELOPMENT_AUTH_TOKEN_TTL_SECONDS: '3600',
      ...overrides,
    };

    return Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              return env[key] ?? defaultValue;
            }),
          },
        },
        DevelopmentIdentityProvider,
        {
          provide: IDENTITY_PROVIDER,
          useExisting: DevelopmentIdentityProvider,
        },
      ],
    }).compile();
  }

  beforeEach(async () => {
    const moduleRef = await createTestingModule();
    service = moduleRef.get(AuthService);
    jwtService = moduleRef.get(JwtService);
  });

  it('returns an access token and user for valid development credentials', async () => {
    const result = await service.login(credentials);

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(3600);
    expect(result.user).toEqual({
      id: 'development-user',
      email: credentials.email,
      displayName: 'VetCare Receptionist',
      roles: ['RECEPTIONIST'],
      permissions: [
        'owners:read',
        'owners:create',
        'patients:read',
        'visits:create',
        'queue:read',
      ],
    });
    expect(result).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('password');
  });

  it('includes minimal identity claims and expiration in the token', async () => {
    const result = await service.login(credentials);
    const payload = await jwtService.verifyAsync<{
      sub: string;
      email: string;
      roles: string[];
      permissions: string[];
      exp: number;
      iat: number;
    }>(result.accessToken, {
      secret: 'unit-test-secret-with-sufficient-length',
      algorithms: ['HS256'],
    });

    expect(payload.sub).toBe('development-user');
    expect(payload.roles).toEqual(['RECEPTIONIST']);
    expect(payload.permissions).toContain('owners:read');
    expect(payload.exp).toEqual(expect.any(Number));
    expect(payload).not.toHaveProperty('password');
  });

  it('rejects incorrect credentials without revealing which field failed', async () => {
    await expect(
      service.login({ ...credentials, password: 'wrong-password' }),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid credentials.',
    });
  });

  it('rejects unknown emails with the same generic credential error', async () => {
    await expect(
      service.login({ ...credentials, email: 'unknown@vetcare.local' }),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid credentials.',
    });
  });
  it('rejects manipulated tokens instead of trusting decoded claims', async () => {
    const forgedToken = await jwtService.signAsync(
      {
        sub: 'development-user',
        email: credentials.email,
        roles: ['ADMIN'],
        permissions: ['*'],
      },
      {
        secret: 'attacker-secret',
        expiresIn: 3600,
        algorithm: 'HS256',
      },
    );

    await expect(service.verifyAccessToken(forgedToken)).rejects.toMatchObject({
      status: 401,
    });
  });

  it('rejects tokens with altered claims even when signed with the configured secret', async () => {
    const alteredClaimsToken = await jwtService.signAsync(
      {
        sub: 'development-user',
        email: credentials.email,
        roles: ['ADMIN'],
        permissions: ['*'],
      },
      {
        secret: 'unit-test-secret-with-sufficient-length',
        expiresIn: 3600,
        algorithm: 'HS256',
      },
    );

    await expect(
      service.verifyAccessToken(alteredClaimsToken),
    ).rejects.toMatchObject({
      status: 401,
    });
  });
  it('rejects expired tokens', async () => {
    const expiredToken = await jwtService.signAsync(
      {
        sub: 'development-user',
        email: credentials.email,
        roles: ['RECEPTIONIST'],
        permissions: ['owners:read'],
      },
      {
        secret: 'unit-test-secret-with-sufficient-length',
        expiresIn: -1,
        algorithm: 'HS256',
      },
    );

    await expect(service.verifyAccessToken(expiredToken)).rejects.toMatchObject(
      {
        status: 401,
      },
    );
  });

  it('rejects tokens signed with disallowed algorithms', async () => {
    const tokenWithNoneAlgorithm = [
      Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
        'base64url',
      ),
      Buffer.from(
        JSON.stringify({
          sub: 'development-user',
          email: credentials.email,
          roles: ['ADMIN'],
          permissions: ['*'],
        }),
      ).toString('base64url'),
      '',
    ].join('.');

    await expect(
      service.verifyAccessToken(tokenWithNoneAlgorithm),
    ).rejects.toMatchObject({
      status: 401,
    });
  });

  it('disables development authentication in production', async () => {
    const moduleRef = await createTestingModule({ NODE_ENV: 'production' });
    const productionService = moduleRef.get(AuthService);

    await expect(productionService.login(credentials)).rejects.toMatchObject({
      status: 503,
    });
  });

  it.each([undefined, 'staging'])(
    'keeps development authentication disabled when NODE_ENV is %s',
    async (nodeEnv) => {
      const moduleRef = await createTestingModule({ NODE_ENV: nodeEnv });
      const disabledService = moduleRef.get(AuthService);

      await expect(disabledService.login(credentials)).rejects.toMatchObject({
        status: 503,
      });
    },
  );

  it('reports weak development JWT secret as controlled configuration error', async () => {
    const moduleRef = await createTestingModule({
      DEVELOPMENT_AUTH_JWT_SECRET: 'short',
    });
    const misconfiguredService = moduleRef.get(AuthService);

    await expect(misconfiguredService.login(credentials)).rejects.toMatchObject(
      {
        status: 503,
      },
    );
  });
  it('reports missing development JWT secret as controlled configuration error', async () => {
    const moduleRef = await createTestingModule({
      DEVELOPMENT_AUTH_JWT_SECRET: undefined,
    });
    const misconfiguredService = moduleRef.get(AuthService);

    await expect(
      misconfiguredService.login(credentials),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('fails application initialization when development auth is enabled without a secret', async () => {
    const moduleRef = await createTestingModule({
      DEVELOPMENT_AUTH_JWT_SECRET: undefined,
    });

    await expect(moduleRef.init()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it.each(['0', '59', '86401', '1.5', 'not-a-number', ''])(
    'reports invalid development token TTL %s as controlled configuration error',
    async (ttl) => {
      const moduleRef = await createTestingModule({
        DEVELOPMENT_AUTH_TOKEN_TTL_SECONDS: ttl,
      });
      const misconfiguredService = moduleRef.get(AuthService);

      await expect(
        misconfiguredService.login(credentials),
      ).rejects.toMatchObject({
        status: 503,
      });
    },
  );

  it('keeps unknown authentication providers unavailable', async () => {
    const unavailableService = new AuthService(
      new UnavailableIdentityProvider(),
    );

    await expect(unavailableService.login(credentials)).rejects.toMatchObject({
      status: 503,
    });
  });
});
