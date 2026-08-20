import { randomUUID } from 'node:crypto';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.constants';
import type { CreateOwnerDto } from '../dto/create-owner.dto';
import type { Owner } from '../entities/owner.entity';
import type { OwnerRepository } from './owner-repository.interface';

interface OwnerRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: Date;
  updated_at: Date;
}

export class PgOwnerRepository implements OwnerRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(owner: CreateOwnerDto): Promise<Owner> {
    const result = await this.pool.query<OwnerRow>(
      `
        INSERT INTO owners (id, first_name, last_name, email, phone)
        VALUES ($1, $2, $3, lower($4), $5)
        RETURNING id, first_name, last_name, email, phone, created_at, updated_at
      `,
      [randomUUID(), owner.firstName, owner.lastName, owner.email, owner.phone],
    );

    return this.toOwner(result.rows[0]);
  }

  async findAll(): Promise<Owner[]> {
    const result = await this.pool.query<OwnerRow>(`
      SELECT id, first_name, last_name, email, phone, created_at, updated_at
      FROM owners
      ORDER BY created_at DESC
    `);

    return result.rows.map((row) => this.toOwner(row));
  }

  async findById(id: string): Promise<Owner | null> {
    const result = await this.pool.query<OwnerRow>(
      `
        SELECT id, first_name, last_name, email, phone, created_at, updated_at
        FROM owners
        WHERE id = $1
      `,
      [id],
    );

    const row = result.rows[0];
    return row ? this.toOwner(row) : null;
  }

  private toOwner(row: OwnerRow): Owner {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
