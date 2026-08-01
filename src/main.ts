import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('VetCare Management API')
    .setDescription('API base for the VetCare Management platform.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port, '0.0.0.0');

  logger.log(`Port: ${port}`);
  logger.log(`Swagger: http://localhost:${port}/docs`);
  logger.log(`API base path: http://localhost:${port}/api`);
}

void bootstrap();
