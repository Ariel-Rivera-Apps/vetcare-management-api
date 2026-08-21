import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { CreateOwnerDto } from './dto/create-owner.dto';
import { OwnersService } from './owners.service';
import { InMemoryOwnerRepository } from './repositories/in-memory-owner.repository';
import { OWNER_REPOSITORY } from './repositories/owner-repository.interface';

describe('OwnersService', () => {
  let service: OwnersService;

  const owner: CreateOwnerDto = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '8888-8888',
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OwnersService,
        {
          provide: OWNER_REPOSITORY,
          useClass: InMemoryOwnerRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(OwnersService);
  });

  it('creates an owner', async () => {
    const created = await service.create(owner);

    expect(created).toMatchObject(owner);
    expect(created.id).toEqual(expect.any(String));
    expect(created.createdAt).toEqual(expect.any(String));
    expect(created.updatedAt).toEqual(expect.any(String));
  });

  it('maps duplicate email errors to 409', async () => {
    await service.create(owner);

    await expect(
      service.create({ ...owner, firstName: 'Jane' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not expose unexpected repository errors as conflicts', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OwnersService,
        {
          provide: OWNER_REPOSITORY,
          useValue: {
            create: jest.fn().mockRejectedValue(new Error('database failed')),
          },
        },
      ],
    }).compile();
    const serviceWithFailingRepository = moduleRef.get(OwnersService);

    await expect(serviceWithFailingRepository.create(owner)).rejects.toThrow(
      'database failed',
    );
  });

  it('lists owners', async () => {
    const created = await service.create(owner);

    await expect(service.findAll()).resolves.toEqual([created]);
  });

  it('returns an existing owner by id', async () => {
    const created = await service.create(owner);

    await expect(service.findById(created.id)).resolves.toEqual(created);
  });

  it('returns 404 for a missing owner', async () => {
    await expect(
      service.findById('3f9ff5a1-99b8-49fd-9c6f-4c7b6e9af1de'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
