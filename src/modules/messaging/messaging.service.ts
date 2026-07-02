import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IsNull, Not, Repository } from 'typeorm';
import { NotificationEvent } from '@/modules/notifications/notification-events';
import {
  Conversation,
  ConversationParticipant,
  ConversationReport,
  Message,
  ConversationContextType,
  ConversationStatus,
} from './entities';
import { User } from '@/modules/auth/entities/user.entity';
import {
  CreateConversationDto,
  ReportConversationDto,
  SendMessageDto,
  UpdateConversationDto,
} from './dtos';

interface PaginationDto {
  page: number;
  limit: number;
}

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participantRepository: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ConversationReport)
    private readonly conversationReportRepository: Repository<ConversationReport>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get all conversations for a user with pagination
   */
  private sanitizeDeleted(message: Message): Message {
    if (!message.deleted_at) return message;
    return { ...message, text: null, attachments: null } as Message;
  }

  async getUserConversations(
    user: User,
    pagination: PaginationDto,
  ): Promise<{
    data: Conversation[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Get all conversations for this user. Note: we deliberately do NOT
    // leftJoinAndSelect('c.messages') here. Joining the one-to-many messages
    // collection both breaks skip/take pagination (rows get multiplied) and
    // returns the messages in a non-deterministic order, so picking the
    // "last" element of conv.messages would give an arbitrary message that
    // differs between requests/users. The latest message is fetched per
    // conversation below with an explicit ORDER BY.
    const [conversations, total] = await this.conversationRepository
      .createQueryBuilder('c')
      // Scope to the viewer's active role: conversations where they participate
      // as that role, plus unscoped (role IS NULL) ones which show in any mode.
      .innerJoin(
        'c.participants',
        'p',
        'p.user_id = :userId AND (p.role = :activeRole OR p.role IS NULL)',
        { userId: user.id, activeRole: user.user_type ?? '' },
      )
      .leftJoinAndSelect('c.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.user', 'u')
      .orderBy('c.updated_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // For each conversation, add receiver and unread_count
    const data = await Promise.all(conversations.map(async (conv) => {
      // Find the receiver participant (not the current user)
      const receiverParticipant = conv.participants.find(p => p.user_id !== user.id);
      const receiver = receiverParticipant ? receiverParticipant.user : null;

      // Count unread messages for this conversation for the current user
      // (messages sent by the other person that current user hasn't read)
      const unread_count = await this.messageRepository.count({
        where: {
          conversation_id: conv.id,
          is_read: false,
          sender_id: receiver?.id,
          deleted_at: IsNull(),
        },
      });

      // Get the last message (excluding soft-deleted ones for preview purposes).
      // Fetched per conversation with an explicit ORDER BY so every caller sees
      // the same, genuinely-latest message regardless of row return order.
      const lastMessage = await this.messageRepository.findOne({
        where: { conversation_id: conv.id, deleted_at: IsNull() },
        order: { created_at: 'DESC' },
      });

      // Only include the receiver in participants for clarity
      return {
        id: conv.id,
        context_type: conv.context_type,
        context_id: conv.context_id,
        status: conv.status,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        receiver,
        unread_count,
        messages: lastMessage ? [this.sanitizeDeleted(lastMessage)] : [],
        participants: receiverParticipant ? [receiverParticipant] : [],
      };
    }));

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a specific conversation with message history
   */
  async getConversationDetail(
    conversationId: string,
    user: User,
    pagination: PaginationDto,
  ): Promise<{
    conversation: Conversation;
    messages: Message[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: {
        conversation_id: conversationId,
        user_id: user.id,
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants', 'participants.user'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversation_id: conversationId },
      relations: ['sender'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    // Update last_read_at for participant
    await this.participantRepository.update(
      { id: participant.id },
      { last_read_at: new Date() },
    );

    return {
      conversation,
      messages: messages.reverse().map((m) => this.sanitizeDeleted(m)), // chronological + mask deleted
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new conversation between two users
   */
  async createConversation(
    dto: CreateConversationDto,
    user: User,
  ): Promise<Conversation> {
    const { other_user_id, context_type, context_id } = dto;

    // Prevent self-conversation
    if (user.id === other_user_id) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Check if conversation already exists between these two users
    const existingConversation = await this.conversationRepository
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.participants', 'p1')
      .innerJoinAndSelect('c.participants', 'p2')
      .where('p1.user_id = :userId1', { userId1: user.id })
      .andWhere('p2.user_id = :userId2', { userId2: other_user_id })
      .getOne();

    if (existingConversation) {
      // Always reload with participants.user relation
      const fullConversation = await this.conversationRepository.findOne({
        where: { id: existingConversation.id },
        relations: ['participants', 'participants.user'],
      });
      if (!fullConversation) {
        throw new NotFoundException('Conversation not found');
      }
      return fullConversation;
    }

    // Create new conversation
    const conversation = this.conversationRepository.create({
      context_type: context_type || ConversationContextType.GENERAL,
      context_id: context_id || null,
    });

    const savedConversation = await this.conversationRepository.save(
      conversation,
    );

    // Record the role each side is acting in so inboxes can be scoped to the
    // viewer's active role.
    const { creatorRole, otherRole } = this.participantRolesForContext(
      context_type || ConversationContextType.GENERAL,
      user.user_type,
    );

    // Add both participants
    await this.participantRepository.save([
      {
        conversation_id: savedConversation.id,
        user_id: user.id,
        role: creatorRole,
        joined_at: new Date(),
      } as ConversationParticipant,
      {
        conversation_id: savedConversation.id,
        user_id: other_user_id,
        role: otherRole,
        joined_at: new Date(),
      } as ConversationParticipant,
    ]);

    const result = await this.conversationRepository.findOne({
      where: { id: savedConversation.id },
      relations: ['participants', 'participants.user'],
    });

    if (!result) {
      throw new NotFoundException('Conversation not created');
    }

    return result;
  }

  // Maps a conversation context to the role each side is acting in, based on the
  // creator's active role. Returns nulls for general/unknown contexts (or when
  // the creator's role isn't part of the context pair) — those stay unscoped and
  // show in every mode.
  private participantRolesForContext(
    contextType: ConversationContextType,
    creatorActiveRole?: string,
  ): { creatorRole: string | null; otherRole: string | null } {
    const pairs: Partial<Record<ConversationContextType, [string, string]>> = {
      [ConversationContextType.PRODUCT_INQUIRY]: ['buyer', 'auto dealer'],
      [ConversationContextType.BOOKING]: ['buyer', 'service provider'],
      [ConversationContextType.DRIVER_JOB]: ['driver', 'driver employer'],
    };
    const pair = pairs[contextType];
    if (pair && creatorActiveRole && pair.includes(creatorActiveRole)) {
      const otherRole = pair[0] === creatorActiveRole ? pair[1] : pair[0];
      return { creatorRole: creatorActiveRole, otherRole };
    }
    return { creatorRole: null, otherRole: null };
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    user: User,
  ): Promise<Message> {
    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: {
        conversation_id: conversationId,
        user_id: user.id,
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = this.messageRepository.create({
      conversation_id: conversationId,
      sender_id: user.id,
      text: dto.text?.trim() ? dto.text : null,
      attachments: dto.attachments?.length ? dto.attachments : null,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation updated_at timestamp
    await this.conversationRepository.update(
      { id: conversationId },
      { updated_at: new Date() },
    );

    const result = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });

    if (!result) {
      throw new NotFoundException('Message not found');
    }

    // Notify the other participants (push only; the subscriber skips anyone
    // currently online since they receive the message live over the socket).
    const others = await this.participantRepository.find({
      where: { conversation_id: conversationId, user_id: Not(user.id) },
    });
    if (others.length) {
      this.eventEmitter.emit(NotificationEvent.MESSAGE_SENT, {
        recipientIds: others.map((p) => p.user_id),
        senderId: user.id,
        senderName: [user.first_name, user.last_name].filter(Boolean).join(' ') || undefined,
        conversationId,
        preview: result.text ?? (result.attachments?.length ? 'Sent an attachment' : undefined),
      });
    }

    return result;
  }

  /**
   * Update conversation (archive, block, etc.)
   */
  async updateConversation(
    conversationId: string,
    dto: UpdateConversationDto,
    user: User,
  ): Promise<Conversation> {
    const participant = await this.participantRepository.findOne({
      where: {
        conversation_id: conversationId,
        user_id: user.id,
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    await this.conversationRepository.update(
      { id: conversationId },
      { ...dto, updated_at: new Date() },
    );

    const result = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants', 'participants.user', 'messages'],
    });

    if (!result) {
      throw new NotFoundException('Conversation not found');
    }

    return result;
  }

  /**
   * Mark a specific message as read
   */
  async markMessageAsRead(
    messageId: string,
    user: User,
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const participant = await this.participantRepository.findOne({
      where: {
        conversation_id: message.conversation_id,
        user_id: user.id,
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    await this.messageRepository.update(
      { id: messageId },
      { is_read: true, read_at: new Date() },
    );

    const result = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!result) {
      throw new NotFoundException('Message not found');
    }

    return result;
  }

  /**
   * Soft-delete a message. Only the sender can delete their own message.
   * The row is kept so the thread stays coherent; text/attachments are cleared
   * on reads via sanitizeDeleted, and clients render a placeholder from deleted_at.
   */
  async deleteMessage(messageId: string, user: User): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender_id !== user.id) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (!message.deleted_at) {
      await this.messageRepository.update(
        { id: messageId },
        { deleted_at: new Date() },
      );
    }

    const updated = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!updated) {
      throw new NotFoundException('Message not found');
    }

    return this.sanitizeDeleted(updated);
  }

  /**
   * Get unread message count for user across all conversations
   */
  async getUnreadCount(user: User): Promise<number> {
    const count = await this.messageRepository
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .innerJoin('c.participants', 'p')
      .where('p.user_id = :userId', { userId: user.id })
      // Only count unread in conversations belonging to the active role (or
      // unscoped ones), so the badge matches the scoped inbox.
      .andWhere('(p.role = :activeRole OR p.role IS NULL)', {
        activeRole: user.user_type ?? '',
      })
      .andWhere('m.sender_id != :userId', { userId: user.id })
      .andWhere('m.is_read = false')
      .andWhere('m.deleted_at IS NULL')
      .getCount();

    return count;
  }

  /**
   * Report a conversation for abuse. The reporter must be a participant; the
   * reported user is the other participant. An optional message_id can pin
   * the report to a specific message for context.
   */
  async reportConversation(
    conversationId: string,
    dto: ReportConversationDto,
    user: User,
  ): Promise<ConversationReport> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const reporter = conversation.participants.find(
      (p) => p.user_id === user.id,
    );
    if (!reporter) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const other = conversation.participants.find(
      (p) => p.user_id !== user.id,
    );
    if (!other) {
      throw new BadRequestException(
        'Conversation has no other participant to report',
      );
    }

    if (dto.message_id) {
      const message = await this.messageRepository.findOne({
        where: { id: dto.message_id, conversation_id: conversationId },
      });
      if (!message) {
        throw new NotFoundException(
          'Message not found in this conversation',
        );
      }
    }

    const report = this.conversationReportRepository.create({
      conversation_id: conversationId,
      reporter_id: user.id,
      reported_user_id: other.user_id,
      message_id: dto.message_id || null,
      reason: dto.reason,
      description: dto.description?.trim() ? dto.description : null,
    });

    const saved = await this.conversationReportRepository.save(report);

    const result = await this.conversationReportRepository.findOne({
      where: { id: saved.id },
    });

    if (!result) {
      throw new NotFoundException('Report not found');
    }

    return result;
  }

  /**
   * Delete a conversation (soft delete via status change)
   */
  async deleteConversation(
    conversationId: string,
    user: User,
  ): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: {
        conversation_id: conversationId,
        user_id: user.id,
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Archive conversation instead of deleting
    await this.conversationRepository.update(
      { id: conversationId },
      { status: ConversationStatus.ARCHIVED, updated_at: new Date() },
    );
  }
}
