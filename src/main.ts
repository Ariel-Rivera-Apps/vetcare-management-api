import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { configureApp } from './app/configure-app';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);

  configureApp(app);

  await app.listen(port, '0.0.0.0');

  logger.log(`Port: ${port}`);
  logger.log(`Swagger: http://localhost:${port}/docs`);
  logger.log(`API base path: http://localhost:${port}/api`);
}

void bootstrap();
