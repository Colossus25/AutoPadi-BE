import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'Hey, how are you?', required: true, description: 'Message text content' })
  text: string;

  @ApiProperty({
    example: [
      {
        type: 'image',
        url: 'https://res.cloudinary.com/demo/image/upload/message-image.png',
      },
    ],
    required: false,
    isArray: true,
    description: 'Optional attachments with type and URL',
  })
  attachments?: Array<{
    type: string;
    url: string;
  }>;
}
