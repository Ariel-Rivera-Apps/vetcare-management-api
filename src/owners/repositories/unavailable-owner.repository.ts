import { ServiceUnavailableException } from '@nestjs/common';
import type { Owner } from '../entities/owner.entity';
import type { OwnerRepository } from './owner-repository.interface';

export class UnavailableOwnerRepository implements OwnerRepository {
  create(): Promise<Owner> {
    return Promise.reject(this.databaseUnavailable());
  }

  findAll(): Promise<Owner[]> {
    return Promise.reject(this.databaseUnavailable());
  }

  findById(): Promise<Owner | null> {
    return Promise.reject(this.databaseUnavailable());
  }

  private databaseUnavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException('DATABASE_URL is not configured.');
  }
}
