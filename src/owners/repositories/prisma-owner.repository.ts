import { randomUUID } from 'node:crypto';
import { Prisma, Owner as PrismaOwner } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateOwnerDto } from '../dto/create-owner.dto';
import type { Owner } from '../entities/owner.entity';
import type { OwnerRepository } from './owner-repository.interface';

export class PrismaOwnerRepository implements OwnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(owner: CreateOwnerDto): Promise<Owner> {
    try {
      const created = await this.prisma.owner.create({
        data: {
          id: randomUUID(),
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email.toLowerCase(),
          phone: owner.phone,
        },
      });

      return this.toOwner(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const duplicateEmailError = new Error('Duplicate owner email.');
        duplicateEmailError.name = 'OwnerEmailAlreadyExists';
        throw duplicateEmailError;
      }

      throw error;
    }
  }

  async findAll(): Promise<Owner[]> {
    const owners = await this.prisma.owner.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return owners.map((owner) => this.toOwner(owner));
  }

  async findById(id: string): Promise<Owner | null> {
    const owner = await this.prisma.owner.findUnique({
      where: {
        id,
      },
    });

    return owner ? this.toOwner(owner) : null;
  }

  private toOwner(owner: PrismaOwner): Owner {
    return {
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    };
  }
}
