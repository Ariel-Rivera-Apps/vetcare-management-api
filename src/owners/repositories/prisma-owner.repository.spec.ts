import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaOwnerRepository } from './prisma-owner.repository';

describe('PrismaOwnerRepository', () => {
  const now = new Date('2026-08-21T10:00:00.000Z');
  const createOwner = jest.fn();
  const findManyOwners = jest.fn();
  const findUniqueOwner = jest.fn();
  const prisma = {
    owner: {
      create: createOwner,
      findMany: findManyOwners,
      findUnique: findUniqueOwner,
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps Prisma owner fields to the domain owner shape', async () => {
    createOwner.mockResolvedValue({
      id: '3f9ff5a1-99b8-49fd-9c6f-4c7b6e9af1de',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '8888-8888',
      createdAt: now,
      updatedAt: now,
    });

    const repository = new PrismaOwnerRepository(prisma);
    const owner = await repository.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'Jane.Doe@Example.com',
      phone: '8888-8888',
    });

    const createCall = createOwner.mock.calls[0] as [
      {
        data: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
        };
      },
    ];

    expect(createCall[0]).toEqual({
      data: {
        id: createCall[0].data.id,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '8888-8888',
      },
    });
    expect(createCall[0].data.id).toEqual(expect.any(String));
    expect(owner).toEqual({
      id: '3f9ff5a1-99b8-49fd-9c6f-4c7b6e9af1de',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '8888-8888',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('maps Prisma unique constraint errors to duplicate owner email errors', async () => {
    createOwner.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    const repository = new PrismaOwnerRepository(prisma);

    await expect(
      repository.create({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '8888-8888',
      }),
    ).rejects.toMatchObject({
      name: 'OwnerEmailAlreadyExists',
    });
  });
});
