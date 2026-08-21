import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';
import { InMemoryOwnerRepository } from './repositories/in-memory-owner.repository';
import { OWNER_REPOSITORY } from './repositories/owner-repository.interface';
import { PrismaOwnerRepository } from './repositories/prisma-owner.repository';
import { UnavailableOwnerRepository } from './repositories/unavailable-owner.repository';

@Module({
  imports: [PrismaModule],
  controllers: [OwnersController],
  providers: [
    OwnersService,
    {
      provide: OWNER_REPOSITORY,
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, configService: ConfigService) => {
        if (configService.get<string>('DATABASE_URL')) {
          return new PrismaOwnerRepository(prisma);
        }

        if (configService.get<string>('NODE_ENV') === 'test') {
          return new InMemoryOwnerRepository();
        }

        return new UnavailableOwnerRepository();
      },
    },
  ],
})
export class OwnersModule {}
