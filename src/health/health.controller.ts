import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'UP',
      service: 'VetCare Management API',
      version: '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
