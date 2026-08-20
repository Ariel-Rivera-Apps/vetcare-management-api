import type { CreateOwnerDto } from '../dto/create-owner.dto';
import type { Owner } from '../entities/owner.entity';

export const OWNER_REPOSITORY = Symbol('OWNER_REPOSITORY');

export interface OwnerRepository {
  create(owner: CreateOwnerDto): Promise<Owner>;
  findAll(): Promise<Owner[]>;
  findById(id: string): Promise<Owner | null>;
}
