import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

interface HealthResponse {
  status: 'UP';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  @ApiOkResponse({
    description: 'The API is available and responding.',
    schema: {
      example: {
        status: 'UP',
        service: 'VetCare Management API',
        version: '1.0.0',
        environment: 'development',
        timestamp: '2026-08-01T14:35:00.000Z',
      },
    },
  })
  getHealth(): HealthResponse {
    return {
      status: 'UP',
      service: 'VetCare Management API',
      version: '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
