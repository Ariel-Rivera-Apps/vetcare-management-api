import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { BearerAuthGuard } from './guards/bearer-auth.guard';
import type { AuthResult } from './interfaces/auth-result.interface';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Development-only login for local testing',
    description:
      'Enabled only when AUTH_PROVIDER=development and NODE_ENV is development or test.',
  })
  @ApiOkResponse({
    description: 'Development login succeeded.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
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
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid login request.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiServiceUnavailableResponse({
    description: 'Authentication provider is not available or configured.',
  })
  login(@Body() credentials: LoginDto): Promise<AuthResult> {
    return this.authService.login(credentials);
  }

  @Get('me')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the authenticated user identity' })
  @ApiOkResponse({
    description: 'Authenticated user identity.',
    schema: {
      example: {
        id: 'development-user',
        email: 'receptionist@vetcare.local',
        displayName: 'VetCare Receptionist',
        roles: ['RECEPTIONIST'],
        permissions: ['owners:read', 'owners:create'],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token.',
  })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Get('permissions')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the authenticated user roles and permissions' })
  @ApiOkResponse({
    description: 'Authenticated user authorization data.',
    schema: {
      example: {
        roles: ['RECEPTIONIST'],
        permissions: ['owners:read', 'owners:create'],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token.',
  })
  permissions(@CurrentUser() user: AuthenticatedUser): {
    roles: string[];
    permissions: string[];
  } {
    return {
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}
