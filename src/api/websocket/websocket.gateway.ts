import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import {
  ClientMessage,
  ServerMessage,
  ClientSubscription,
} from './websocket.types';

const ClientMessageSchema = z.object({
  action: z.enum(['subscribe', 'unsubscribe']),
  channel: z.enum(['chain', 'transactions']),
});

@NestWebSocketGateway({
  cors: {
    // TODO: Should restrict origins in production
    origin: '*',
  },
})
export class WebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  private readonly clientSubscriptions = new Map<string, ClientSubscription>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clientSubscriptions.set(client.id, {
      clientId: client.id,
      channels: new Set(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: ClientMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      this.logger.debug(`Received message from ${client.id}:`, data);
      if (!this.isValidClientMessage(data)) {
        this.logger.warn(
          `Invalid message format from client ${client.id}:`,
          data,
        );
        client.emit('error', { message: 'Invalid message format' });
        return;
      }

      const subscription = this.clientSubscriptions.get(client.id);
      if (!subscription) {
        this.logger.error(`Subscription not found for client ${client.id}`);
        return;
      }
      if (data.action === 'subscribe') {
        subscription.channels.add(data.channel);
        this.logger.log(
          `Client ${client.id} subscribed to channel: ${data.channel}`,
        );
        client.emit('subscribed', { channel: data.channel });
      } else if (data.action === 'unsubscribe') {
        subscription.channels.delete(data.channel);
        this.logger.log(
          `Client ${client.id} unsubscribed from channel: ${data.channel}`,
        );
        client.emit('unsubscribed', { channel: data.channel });
      }
    } catch (error) {
      this.logger.error(
        `Error handling message from client ${client.id}:`,
        error,
      );
      client.emit('error', { message: 'Internal server error' });
    }
  }

  @OnEvent('websocket.broadcast')
  handleBroadcast(message: ServerMessage): void {
    this.logger.debug(
      `Broadcasting message to channel ${message.channel}:`,
      message.type,
    );

    const subscribedClients: string[] = [];
    this.clientSubscriptions.forEach((subscription, clientId) => {
      if (subscription.channels.has(message.channel)) {
        subscribedClients.push(clientId);
      }
    });
    subscribedClients.forEach((clientId) => {
      const socket = this.server.sockets.sockets.get(clientId);
      if (socket) {
        socket.emit('message', message);
      }
    });

    this.logger.debug(
      `Message broadcasted to ${subscribedClients.length} clients`,
    );
  }

  private isValidClientMessage(data: any): data is ClientMessage {
    try {
      ClientMessageSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }
}
