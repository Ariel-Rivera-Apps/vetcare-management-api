import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateOwnerDto } from './dto/create-owner.dto';
import { OwnerResponseDto } from './dto/owner-response.dto';
import type { Owner } from './entities/owner.entity';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from './repositories/owner-repository.interface';

@Injectable()
export class OwnersService {
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepository: OwnerRepository,
  ) {}

  async create(owner: CreateOwnerDto): Promise<OwnerResponseDto> {
    try {
      return this.toResponseDto(await this.ownerRepository.create(owner));
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException('An owner with this email already exists.');
      }

      throw error;
    }
  }

  async findAll(): Promise<OwnerResponseDto[]> {
    const owners = await this.ownerRepository.findAll();
    return owners.map((owner) => this.toResponseDto(owner));
  }

  async findById(id: string): Promise<OwnerResponseDto> {
    const owner = await this.ownerRepository.findById(id);

    if (!owner) {
      throw new NotFoundException('Owner not found.');
    }

    return this.toResponseDto(owner);
  }

  private toResponseDto(owner: Owner): OwnerResponseDto {
    return {
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      createdAt: owner.createdAt.toISOString(),
      updatedAt: owner.updatedAt.toISOString(),
    };
  }

  private isDuplicateEmailError(error: unknown): boolean {
    return (
      (error instanceof Error && error.name === 'OwnerEmailAlreadyExists') ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505')
    );
  }
}
