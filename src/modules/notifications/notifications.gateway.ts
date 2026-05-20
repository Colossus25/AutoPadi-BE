import { appConfig } from '@/config';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

const userRoom = (userId: number) => `user:${userId}`;

@Injectable()
@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: appConfig.JWT_SECRET,
      });

      socket.userId = payload.id;
      await socket.join(userRoom(payload.id));
    } catch (err) {
      this.logger.warn(`Socket auth failed: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  /** Pushes a real-time event to every device the user has connected. */
  emitToUser(userId: number, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(userRoom(userId)).emit(event, payload);
  }

  /** True if the user has at least one active socket on this namespace. */
  async isUserOnline(userId: number): Promise<boolean> {
    if (!this.server) return false;
    const sockets = await this.server.in(userRoom(userId)).fetchSockets();
    return sockets.length > 0;
  }
}
