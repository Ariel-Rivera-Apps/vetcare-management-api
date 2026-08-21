import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { OwnersModule } from './owners/owners.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, OwnersModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
