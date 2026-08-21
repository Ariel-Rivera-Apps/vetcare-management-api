import { ApiProperty } from '@nestjs/swagger';

export class OwnerResponseDto {
  @ApiProperty({ example: '3f9ff5a1-99b8-49fd-9c6f-4c7b6e9af1de' })
  id!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: '8888-8888' })
  phone!: string;

  @ApiProperty({ example: '2026-08-20T16:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T16:00:00.000Z' })
  updatedAt!: string;
}
