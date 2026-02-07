import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
  Req,
  
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import {
  CreateConversationDto,
  SendMessageDto,
  UpdateConversationDto,
} from './dtos';
import {
  createConversationValidation,
  sendMessageValidation,
  updateConversationValidation,
} from './validations';
import { AuthGuard } from '@/guards/auth.guard';
import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import type { UserRequest } from '@/definitions';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@ApiTags('Messaging')
@Controller('messaging')
@UseGuards(AuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Get all conversations for authenticated user
   * GET /messaging/conversations?page=1&limit=20
   */
  @Get('conversations')
  async getConversations(
    @Req() req: UserRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const conversations = await this.messagingService.getUserConversations(
      req.user,
      { page: +page, limit: +limit },
    );

    return {
      status_code: 200,
      message: 'Conversations retrieved successfully',
      data: conversations.data,
      meta: {
        page: conversations.page,
        limit: conversations.limit,
        total: conversations.total,
        totalPages: conversations.totalPages,
      },
    };
  }

  /**
   * Get specific conversation with message history
   * GET /messaging/conversations/:conversationId?page=1&limit=50
   */
  @Get('conversations/:conversationId')
  async getConversation(
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
    @Req() req: UserRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const result = await this.messagingService.getConversationDetail(
      conversationId,
      req.user,
      { page: +page, limit: +limit },
    );

    return {
      status_code: 200,
      message: 'Conversation retrieved successfully',
      data: result.conversation,
      messages: result.messages,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Create a new conversation
   * POST /messaging/conversations
   * Body: { other_user_id: string, context_type?: string, context_id?: string }
   */
  @Post('conversations')
  async createConversation(
    @Body(new JoiValidationPipe(createConversationValidation))
    dto: CreateConversationDto,
    @Req() req: UserRequest,
  ) {
    const conversation = await this.messagingService.createConversation(
      dto,
      req.user,
    );

    return {
      status_code: 201,
      message: 'Conversation created successfully',
      data: conversation,
    };
  }

  /**
   * Send a message in a conversation
   * POST /messaging/conversations/:conversationId/messages
   * Body: { text: string, attachments?: Array<{type: string, url: string}> }
   */
  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
    @Body(new JoiValidationPipe(sendMessageValidation))
    dto: SendMessageDto,
    @Req() req: UserRequest,
  ) {
    const message = await this.messagingService.sendMessage(
      conversationId,
      dto,
      req.user,
    );

    return {
      status_code: 201,
      message: 'Message sent successfully',
      data: message,
    };
  }

  /**
   * Update conversation (archive, block, etc.)
   * PATCH /messaging/conversations/:conversationId
   * Body: { status?: string }
   */
  @Patch('conversations/:conversationId')
  async updateConversation(
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
    @Body(new JoiValidationPipe(updateConversationValidation))
    dto: UpdateConversationDto,
    @Req() req: UserRequest,
  ) {
    const conversation = await this.messagingService.updateConversation(
      conversationId,
      dto,
      req.user,
    );

    return {
      status_code: 200,
      message: 'Conversation updated successfully',
      data: conversation,
    };
  }

  /**
   * Mark a message as read
   * PATCH /messaging/messages/:messageId/read
   */
  @Patch('messages/:messageId/read')
  async markAsRead(
    @Param('messageId', new ParseUUIDPipe()) messageId: string,
    @Req() req: UserRequest,
  ) {
    const message = await this.messagingService.markMessageAsRead(
      messageId,
      req.user,
    );

    return {
      status_code: 200,
      message: 'Message marked as read',
      data: message,
    };
  }

  /**
   * Get unread message count
   * GET /messaging/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Req() req: UserRequest) {
    const count = await this.messagingService.getUnreadCount(req.user);

    return {
      status_code: 200,
      message: 'Unread count retrieved',
      data: { unread_count: count },
    };
  }

  /**
   * Archive/delete a conversation
   * DELETE /messaging/conversations/:conversationId
   */
  @Delete('conversations/:conversationId')
  async deleteConversation(
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
    @Req() req: UserRequest,
  ) {
    await this.messagingService.deleteConversation(conversationId, req.user);

    return {
      status_code: 200,
      message: 'Conversation archived successfully',
    };
  }
}
