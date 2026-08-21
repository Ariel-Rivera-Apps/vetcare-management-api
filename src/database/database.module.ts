import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DATABASE_POOL } from './database.constants';
import { DatabaseMigrationService } from './database-migration.service';

@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Pool | null => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        if (!databaseUrl) {
          return null;
        }

        return new Pool({
          connectionString: databaseUrl,
          ssl:
            configService.get<string>('DATABASE_SSL', 'true') === 'true'
              ? { rejectUnauthorized: false }
              : false,
        });
      },
    },
    DatabaseMigrationService,
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
