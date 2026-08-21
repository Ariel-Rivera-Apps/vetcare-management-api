import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.constants';
import { DatabaseModule } from '../database/database.module';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';
import { InMemoryOwnerRepository } from './repositories/in-memory-owner.repository';
import { OWNER_REPOSITORY } from './repositories/owner-repository.interface';
import { PgOwnerRepository } from './repositories/pg-owner.repository';
import { UnavailableOwnerRepository } from './repositories/unavailable-owner.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [OwnersController],
  providers: [
    OwnersService,
    {
      provide: OWNER_REPOSITORY,
      inject: [DATABASE_POOL, ConfigService],
      useFactory: (pool: Pool | null, configService: ConfigService) => {
        if (pool) {
          return new PgOwnerRepository(pool);
        }

        if (configService.get<string>('NODE_ENV') === 'test') {
          return new InMemoryOwnerRepository();
        }

        return new UnavailableOwnerRepository();
      },
    },
  ],
})
export class OwnersModule {}
