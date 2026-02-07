import { ApiProperty } from '@nestjs/swagger';
import { ConversationStatus } from '../entities';

export class UpdateConversationDto {
  @ApiProperty({
    example: 'archived',
    required: false,
    enum: Object.values(ConversationStatus),
    description: 'New status for the conversation',
  })
  status?: ConversationStatus;
}
