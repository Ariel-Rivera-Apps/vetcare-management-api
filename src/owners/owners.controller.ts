import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { OwnerResponseDto } from './dto/owner-response.dto';
import { OwnersService } from './owners.service';

@ApiTags('owners')
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an owner' })
  @ApiCreatedResponse({
    description: 'Owner created.',
    type: OwnerResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid owner payload.' })
  @ApiConflictResponse({ description: 'Owner email already exists.' })
  @ApiServiceUnavailableResponse({ description: 'Database is not configured.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  create(@Body() owner: CreateOwnerDto): Promise<OwnerResponseDto> {
    return this.ownersService.create(owner);
  }

  @Get()
  @ApiOperation({ summary: 'List owners' })
  @ApiOkResponse({
    description: 'Owners list.',
    type: OwnerResponseDto,
    isArray: true,
  })
  @ApiServiceUnavailableResponse({ description: 'Database is not configured.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  findAll(): Promise<OwnerResponseDto[]> {
    return this.ownersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an owner by id' })
  @ApiParam({
    name: 'id',
    example: '3f9ff5a1-99b8-49fd-9c6f-4c7b6e9af1de',
  })
  @ApiOkResponse({ description: 'Owner found.', type: OwnerResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid owner id.' })
  @ApiNotFoundResponse({ description: 'Owner not found.' })
  @ApiServiceUnavailableResponse({ description: 'Database is not configured.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
  findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<OwnerResponseDto> {
    return this.ownersService.findById(id);
  }
}
