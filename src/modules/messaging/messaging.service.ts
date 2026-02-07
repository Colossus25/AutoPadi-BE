import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Conversation,
  ConversationParticipant,
  Message,
  ConversationContextType,
  ConversationStatus,
} from './entities';
import { User } from '@/modules/auth/entities/user.entity';
import {
  CreateConversationDto,
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
  ) {}

  /**
   * Get all conversations for a user with pagination
   */
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

    const [conversations, total] = await this.conversationRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participants', 'p')
      .leftJoinAndSelect('p.user', 'u')
      .leftJoinAndSelect('c.messages', 'm', 'm.created_at = (SELECT MAX(m2.created_at) FROM messages m2 WHERE m2.conversation_id = c.id)')
      .where('p.user_id = :userId', { userId: user.id })
      .orderBy('c.updated_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: conversations,
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
      messages: messages.reverse(), // Return in chronological order
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
      return existingConversation;
    }

    // Create new conversation
    const conversation = this.conversationRepository.create({
      context_type: context_type || ConversationContextType.GENERAL,
      context_id: context_id || null,
    });

    const savedConversation = await this.conversationRepository.save(
      conversation,
    );

    // Add both participants
    await this.participantRepository.save([
      {
        conversation_id: savedConversation.id,
        user_id: user.id,
        joined_at: new Date(),
      } as ConversationParticipant,
      {
        conversation_id: savedConversation.id,
        user_id: other_user_id,
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
      text: dto.text,
      attachments: dto.attachments || null,
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
   * Get unread message count for user across all conversations
   */
  async getUnreadCount(user: User): Promise<number> {
    const count = await this.messageRepository
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .innerJoin('c.participants', 'p')
      .where('p.user_id = :userId', { userId: user.id })
      .andWhere('m.sender_id != :userId', { userId: user.id })
      .andWhere('m.is_read = false')
      .getCount();

    return count;
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
