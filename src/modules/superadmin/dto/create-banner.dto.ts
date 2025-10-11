import { ApiProperty } from '@nestjs/swagger';

export class CreateBannerDto {
  @ApiProperty({ example: 'Main Page Banner', required: false })
  title?: string;

  @ApiProperty({ example: 'This banner is shown on the main page', required: false })
  description?: string;

  @ApiProperty({ example: 'http://res.cloudinary.com/dqaui3vaf/image/upload/v1760195782/cyxlpcga3amnxy6nhknw.png', required: false })
  image?: string;
}
