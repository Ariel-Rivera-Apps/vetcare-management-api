import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthenticatedRequest } from '../decorators/current-user.decorator';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = this.extractBearerToken(request);

    request.user = await this.authService.verifyAccessToken(accessToken);
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedException('Bearer token is required.');
    }

    const [scheme, token, extra] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token || extra) {
      throw new UnauthorizedException('Bearer token is required.');
    }

    return token;
  }
}
