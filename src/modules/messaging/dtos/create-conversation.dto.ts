import { ApiProperty } from '@nestjs/swagger';
import { ConversationContextType } from '../entities';

export class CreateConversationDto {
  @ApiProperty({ example: 2, required: true, description: 'ID of the other user' })
  other_user_id: number;

  @ApiProperty({
    example: 'general',
    required: false,
    enum: Object.values(ConversationContextType),
    description: 'Type of conversation context',
  })
  context_type?: ConversationContextType;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
    description: 'ID of related entity (product, booking, driver job, etc)',
  })
  context_id?: string;
}
