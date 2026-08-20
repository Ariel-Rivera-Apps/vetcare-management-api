import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from './database.constants';

@Injectable()
export class DatabaseMigrationService
  implements OnModuleInit, OnApplicationShutdown
{
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool | null) {}

  async onModuleInit(): Promise<void> {
    if (!this.pool) {
      return;
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS owners (
        id UUID PRIMARY KEY,
        first_name VARCHAR(120) NOT NULL,
        last_name VARCHAR(120) NOT NULL,
        email VARCHAR(320) NOT NULL,
        phone VARCHAR(40) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT owners_email_unique UNIQUE (email)
      );

      CREATE INDEX IF NOT EXISTS owners_created_at_idx ON owners (created_at DESC);
    `);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool?.end();
  }
}
