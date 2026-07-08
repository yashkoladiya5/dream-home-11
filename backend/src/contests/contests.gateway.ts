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
import { createWebSocketCorsConfig } from '../common/config/websocket-cors.config';

interface JwtPayload {
  sub: string;
  phoneNumber: string;
}

@WebSocketGateway({
  namespace: '/contests',
  cors: createWebSocketCorsConfig(),
})
export class ContestsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ContestsGateway.name);
  private connectedClients: Map<string, Set<string>> = new Map();

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
        this.logger.warn(`User not found or inactive for client ${client.id}`);
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      this.logger.log(`Client ${client.id} connected as user ${user.id}`);
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
    for (const [contestId, sockets] of this.connectedClients.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.connectedClients.delete(contestId);
        }
      }
    }
  }

  @SubscribeMessage('joinContestRoom')
  handleJoinRoom(client: Socket, payload: { contestId: string }) {
    if (!payload?.contestId) return;
    const room = `contest:${payload.contestId}`;
    client.join(room);
    if (!this.connectedClients.has(payload.contestId)) {
      this.connectedClients.set(payload.contestId, new Set());
    }
    this.connectedClients.get(payload.contestId)!.add(client.id);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leaveContestRoom')
  handleLeaveRoom(client: Socket, payload: { contestId: string }) {
    if (!payload?.contestId) return;
    const room = `contest:${payload.contestId}`;
    client.leave(room);
    const sockets = this.connectedClients.get(payload.contestId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedClients.delete(payload.contestId);
      }
    }
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  emitPointUpdate(
    contestId: string,
    data: {
      userId: string;
      points: number;
      activity: string;
      description: string;
      timestamp: Date;
    },
  ) {
    this.server.to(`contest:${contestId}`).emit('contest.pointUpdate', {
      contestId,
      ...data,
    });
  }

  emitLeaderboardUpdate(contestId: string, leaderboard: any[]) {
    this.server.to(`contest:${contestId}`).emit('contest.leaderboardUpdate', {
      contestId,
      leaderboard,
    });
  }
}
