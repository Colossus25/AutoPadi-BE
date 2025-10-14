import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchDto {
  @ApiPropertyOptional({ description: 'Keyword to search in name, title, description, etc.' })
  q?: string;

  @ApiPropertyOptional({ description: 'Category (Automobiles, etc.)' })
  category?: string;

  @ApiPropertyOptional({ description: 'Listing type (Sale, Swap, etc.)' })
  listing_type?: string;

  @ApiPropertyOptional({ description: 'Make (supports multiple values)', isArray: true, type: String })
  make?: string[];

  @ApiPropertyOptional({ description: 'Colour (supports multiple values)', isArray: true, type: String })
  colour?: string[];

  @ApiPropertyOptional({ description: 'Fuel type (supports multiple values)', isArray: true, type: String })
  fuel?: string[];

  @ApiPropertyOptional({ description: 'Min price' })
  price_min?: number;

  @ApiPropertyOptional({ description: 'Max price' })
  price_max?: number;

  @ApiPropertyOptional({ description: 'Min year' })
  year_min?: number;

  @ApiPropertyOptional({ description: 'Max year' })
  year_max?: number;

  @ApiPropertyOptional({ description: 'Type (product, store, all)' })
  type?: 'product' | 'store'  | 'all';
}
