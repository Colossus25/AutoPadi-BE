import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (starts from 1)' })
  page?: number = 1;

  @ApiPropertyOptional({ example: 100, description: 'Number of items per page' })
  limit?: number = 100;
}
