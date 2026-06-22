import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/contests',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ContestsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    console.log(`[ContestsGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[ContestsGateway] Client disconnected: ${client.id}`);
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
    console.log(`[ContestsGateway] Client ${client.id} joined room ${room}`);
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
    console.log(`[ContestsGateway] Client ${client.id} left room ${room}`);
  }

  emitPointUpdate(contestId: string, data: { userId: string; points: number; activity: string; description: string; timestamp: Date }) {
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
