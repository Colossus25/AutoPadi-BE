import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { appConfig } from '@/config';
import { User } from '@/modules/auth/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

@Injectable()
@WebSocketGateway({
  namespace: 'messaging',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Track online users: userId -> Set of socket IDs
  private onlineUsers: Map<number, Set<string>> = new Map();

  // Track user's current conversation: socket ID -> conversation ID
  private userConversations: Map<string, string> = new Map();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit() {
    console.log('✅ Messaging WebSocket Gateway initialized');
  }

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: appConfig.JWT_SECRET,
      });

      socket.user = payload;
      const userId = payload.id;

      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(socket.id);

      this.server.emit('user:online', { user_id: userId });
      console.log(`✅ User ${userId} connected with socket ${socket.id}`);
    } catch (err) {
      console.error('❌ WebSocket connection auth failed:', (err as Error).message);
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    if (!socket.user) return;

    const userId = socket.user.id;
    const userSockets = this.onlineUsers.get(userId);

    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.onlineUsers.delete(userId);
        this.server.emit('user:offline', { user_id: userId });
        console.log(`✅ User ${userId} disconnected (offline)`);
      } else {
        console.log(`✅ User ${userId} disconnected (still online on other devices)`);
      }
    }

    this.userConversations.delete(socket.id);
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    if (!socket.user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const { conversation_id } = data;
    const userId = socket.user.id;

    try {
      await this.messagingService.getConversationDetail(
        conversation_id,
        socket.user,
        { page: 1, limit: 1 },
      );

      socket.join(`conversation:${conversation_id}`);
      this.userConversations.set(socket.id, conversation_id);

      socket.broadcast.to(`conversation:${conversation_id}`).emit('user:viewing', {
        conversation_id,
        user_id: userId,
      });

      console.log(`✅ User ${userId} joined conversation ${conversation_id}`);
    } catch (err) {
      socket.emit('error', {
        message: 'Failed to join conversation',
        error: (err as Error).message,
      });
    }
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    if (!socket.user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const { conversation_id } = data;
    const userId = socket.user.id;

    socket.leave(`conversation:${conversation_id}`);
    this.userConversations.delete(socket.id);

    socket.broadcast.to(`conversation:${conversation_id}`).emit('user:left', {
      conversation_id,
      user_id: userId,
    });

    console.log(`✅ User ${userId} left conversation ${conversation_id}`);
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversation_id: string;
      text: string;
      attachments?: Array<{ type: string; url: string }>;
    },
  ) {
    if (!socket.user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const { conversation_id, text, attachments } = data;
    const userId = socket.user.id;

    try {
      const message = await this.messagingService.sendMessage(
        conversation_id,
        { text, attachments },
        socket.user,
      );

      this.server.to(`conversation:${conversation_id}`).emit('message:received', {
        id: message.id,
        conversation_id,
        sender_id: message.sender_id,
        sender: message.sender,
        text: message.text,
        attachments: message.attachments,
        is_read: message.is_read,
        created_at: message.created_at,
      });

      console.log(
        `✅ Message sent in conversation ${conversation_id} by user ${userId}`,
      );
    } catch (err) {
      socket.emit('error', {
        message: 'Failed to send message',
        error: (err as Error).message,
      });
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    if (!socket.user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const { conversation_id } = data;
    const userId = socket.user.id;

    socket.broadcast.to(`conversation:${conversation_id}`).emit('typing:start', {
      conversation_id,
      user_id: userId,
      user_name: socket.user.first_name || 'User',
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    if (!socket.user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const { conversation_id } = data;
    const userId = socket.user.id;

    socket.broadcast.to(`conversation:${conversation_id}`).emit('typing:stop', {
      conversation_id,
      user_id: userId,
    });
  }

  @SubscribeMessage('message:read')
  async handleMarkAsRead(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversation_id: string; message_id: string },
  ) {
    if (!socket.user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    const { conversation_id, message_id } = data;
    const userId = socket.user.id;

    try {
      await this.messagingService.markMessageAsRead(message_id, socket.user);

      socket.broadcast.to(`conversation:${conversation_id}`).emit('message:read', {
        message_id,
        conversation_id,
        read_by: userId,
        read_at: new Date(),
      });

      console.log(`✅ Message ${message_id} marked as read by user ${userId}`);
    } catch (err) {
      socket.emit('error', {
        message: 'Failed to mark message as read',
        error: (err as Error).message,
      });
    }
  }

  @SubscribeMessage('users:status')
  handleGetUsersStatus(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { user_ids: number[] },
  ) {
    const { user_ids } = data;

    const statuses = user_ids.map((userId) => ({
      user_id: userId,
      is_online: this.onlineUsers.has(userId),
    }));

    socket.emit('users:status', statuses);
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineCountInConversation(conversationId: string): number {
    return (
      this.server.sockets.adapter.rooms.get(`conversation:${conversationId}`)
        ?.size || 0
    );
  }
}
