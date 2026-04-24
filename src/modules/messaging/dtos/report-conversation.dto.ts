import { ApiProperty } from '@nestjs/swagger';
import { ConversationReportReason } from '../entities';

export class ReportConversationDto {
  @ApiProperty({
    enum: ConversationReportReason,
    example: ConversationReportReason.HARASSMENT,
    description: 'Reason for reporting the conversation',
  })
  reason: ConversationReportReason;

  @ApiProperty({
    required: false,
    example: 'The other user has been sending threatening messages.',
    description: 'Additional context from the reporter',
  })
  description?: string;

  @ApiProperty({
    required: false,
    example: '6b0f3a4e-1c2d-4e5f-8a9b-0c1d2e3f4a5b',
    description: 'Optional ID of a specific message the report is about',
  })
  message_id?: string;
}
