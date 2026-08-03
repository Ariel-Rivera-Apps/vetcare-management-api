import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { AuthResult } from '../interfaces/auth-result.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { IdentityProvider } from '../interfaces/identity-provider.interface';

interface DevelopmentTokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface DevelopmentAuthConfig {
  email: string;
  password: string;
  jwtSecret: string;
  tokenTtlSeconds: number;
}

const DEVELOPMENT_USER: AuthenticatedUser = {
  id: 'development-user',
  email: 'receptionist@vetcare.local',
  displayName: 'VetCare Receptionist',
  roles: ['RECEPTIONIST'],
  permissions: [
    'owners:read',
    'owners:create',
    'patients:read',
    'visits:create',
    'queue:read',
  ],
};

@Injectable()
export class DevelopmentIdentityProvider
  implements IdentityProvider, OnModuleInit
{
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit(): void {
    if (this.isEnabled()) {
      this.getConfig();
    }
  }

  async login(credentials: LoginDto): Promise<AuthResult> {
    const config = this.getConfig();

    if (
      credentials.email !== config.email ||
      credentials.password !== config.password
    ) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const user: AuthenticatedUser = {
      ...DEVELOPMENT_USER,
      email: config.email,
    };
    const payload: DevelopmentTokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: config.jwtSecret,
      expiresIn: config.tokenTtlSeconds,
      algorithm: 'HS256',
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: config.tokenTtlSeconds,
      user,
    };
  }

  async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    const config = this.getConfig();

    try {
      const payload =
        await this.jwtService.verifyAsync<DevelopmentTokenPayload>(
          accessToken,
          {
            secret: config.jwtSecret,
            algorithms: ['HS256'],
          },
        );

      return this.mapIdentity(payload);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  mapIdentity(tokenPayload: unknown): AuthenticatedUser {
    const config = this.getConfig();

    if (
      !this.isDevelopmentTokenPayload(tokenPayload) ||
      tokenPayload.sub !== DEVELOPMENT_USER.id ||
      tokenPayload.email !== config.email ||
      !this.arraysEqual(tokenPayload.roles, DEVELOPMENT_USER.roles) ||
      !this.arraysEqual(tokenPayload.permissions, DEVELOPMENT_USER.permissions)
    ) {
      throw new UnauthorizedException('Invalid access token.');
    }

    return {
      ...DEVELOPMENT_USER,
      email: config.email,
    };
  }

  isEnabled(): boolean {
    return (
      this.configService.get<string>('AUTH_PROVIDER') === 'development' &&
      ['development', 'test'].includes(
        this.configService.get<string>('NODE_ENV') ?? '',
      )
    );
  }

  private getConfig(): DevelopmentAuthConfig {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'Authentication provider is not available.',
      );
    }

    const email = this.configService.get<string>('DEVELOPMENT_AUTH_EMAIL');
    const password = this.configService.get<string>(
      'DEVELOPMENT_AUTH_PASSWORD',
    );
    const jwtSecret = this.configService.get<string>(
      'DEVELOPMENT_AUTH_JWT_SECRET',
    );
    const tokenTtlRaw = this.configService.get<string>(
      'DEVELOPMENT_AUTH_TOKEN_TTL_SECONDS',
      '3600',
    );
    const tokenTtlSeconds = Number(tokenTtlRaw);

    if (!email || !password || !jwtSecret) {
      throw new ServiceUnavailableException(
        'Development authentication is not configured.',
      );
    }

    if (jwtSecret.length < 32) {
      throw new ServiceUnavailableException(
        'Development authentication JWT secret is too weak.',
      );
    }

    if (
      !Number.isInteger(tokenTtlSeconds) ||
      tokenTtlSeconds < 60 ||
      tokenTtlSeconds > 86400
    ) {
      throw new ServiceUnavailableException(
        'Development authentication token TTL is invalid.',
      );
    }

    return {
      email,
      password,
      jwtSecret,
      tokenTtlSeconds,
    };
  }

  private arraysEqual(first: string[], second: string[]): boolean {
    return (
      first.length === second.length &&
      first.every((value, index) => value === second[index])
    );
  }

  private isDevelopmentTokenPayload(
    tokenPayload: unknown,
  ): tokenPayload is DevelopmentTokenPayload {
    if (!tokenPayload || typeof tokenPayload !== 'object') {
      return false;
    }

    const payload = tokenPayload as Partial<DevelopmentTokenPayload>;

    return (
      typeof payload.sub === 'string' &&
      typeof payload.email === 'string' &&
      Array.isArray(payload.roles) &&
      payload.roles.every((role) => typeof role === 'string') &&
      Array.isArray(payload.permissions) &&
      payload.permissions.every((permission) => typeof permission === 'string')
    );
  }
}
