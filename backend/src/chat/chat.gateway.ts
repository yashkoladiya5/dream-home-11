import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

interface JwtPayload {
  sub: string;
  phoneNumber: string;
}

interface ChatMessagePayload {
  chatId: string;
  content: string;
  type?: string;
}

interface TypingPayload {
  chatId: string;
  isTyping: boolean;
}

interface MarkReadPayload {
  chatId: string;
  messageId: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`No token provided for client ${client.id}`);
        client.disconnect();
        return;
      }

      let payload: JwtPayload;
      try {
        payload = this.jwtService.verify<JwtPayload>(token);
      } catch {
        this.logger.warn(`Invalid token for client ${client.id}`);
        client.disconnect();
        return;
      }

      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.isActive) {
        this.logger.warn(
          `User not found or inactive for client ${client.id}`,
        );
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      client.join(`user:${user.id}`);

      this.logger.log(
        `Client ${client.id} connected as user ${user.id} (${user.phoneNumber})`,
      );
    } catch (error) {
      this.logger.error(
        `Error in handleConnection for client ${client.id}: ${error}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.logger.log(`Client ${client.id} (user ${userId}) disconnected`);
    } else {
      this.logger.log(`Client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(client: Socket, payload: { chatId: string }) {
    if (!payload?.chatId) return;
    client.join(`chat:${payload.chatId}`);
    this.logger.log(
      `Client ${client.id} (user ${client.data?.userId}) joined chat:${payload.chatId}`,
    );
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(client: Socket, payload: { chatId: string }) {
    if (!payload?.chatId) return;
    client.leave(`chat:${payload.chatId}`);
    this.logger.log(
      `Client ${client.id} (user ${client.data?.userId}) left chat:${payload.chatId}`,
    );
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(client: Socket, payload: ChatMessagePayload) {
    const userId = client.data?.userId;
    if (!userId || !payload?.chatId || !payload?.content) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      chatId: payload.chatId,
      senderId: userId,
      content: payload.content,
      type: payload.type || 'text',
      createdAt: new Date(),
      isRead: false,
    };

    this.server.to(`chat:${payload.chatId}`).emit('newMessage', message);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: TypingPayload) {
    if (!payload?.chatId) return;
    client
      .to(`chat:${payload.chatId}`)
      .emit('userTyping', {
        userId: client.data?.userId,
        chatId: payload.chatId,
        isTyping: payload.isTyping,
      });
  }

  @SubscribeMessage('markRead')
  handleMarkRead(client: Socket, payload: MarkReadPayload) {
    if (!payload?.chatId || !payload?.messageId) return;
    this.server.to(`chat:${payload.chatId}`).emit('messageRead', {
      userId: client.data?.userId,
      chatId: payload.chatId,
      messageId: payload.messageId,
    });
  }
}
