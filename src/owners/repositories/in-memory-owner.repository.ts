import { randomUUID } from 'node:crypto';
import type { CreateOwnerDto } from '../dto/create-owner.dto';
import type { Owner } from '../entities/owner.entity';
import type { OwnerRepository } from './owner-repository.interface';

export class InMemoryOwnerRepository implements OwnerRepository {
  private readonly owners = new Map<string, Owner>();

  create(owner: CreateOwnerDto): Promise<Owner> {
    const now = new Date();
    const created: Owner = {
      id: randomUUID(),
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email.toLowerCase(),
      phone: owner.phone,
      createdAt: now,
      updatedAt: now,
    };

    if (
      [...this.owners.values()].some(
        (existing) => existing.email.toLowerCase() === created.email,
      )
    ) {
      const error = new Error('Duplicate owner email.');
      error.name = 'OwnerEmailAlreadyExists';
      throw error;
    }

    this.owners.set(created.id, created);
    return Promise.resolve(created);
  }

  findAll(): Promise<Owner[]> {
    return Promise.resolve(
      [...this.owners.values()].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
    );
  }

  findById(id: string): Promise<Owner | null> {
    return Promise.resolve(this.owners.get(id) ?? null);
  }
}
