import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as RpcWebSocketClient } from 'rpc-websockets';
import { Subject } from 'rxjs';
import { firstValueFrom } from 'rxjs';

type SubscriptionListener = {
  topic: string;
  listener: (...args: any[]) => void;
};

@Injectable()
export class CkbWebsocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CkbWebsocketService.name);

  private client: RpcWebSocketClient;
  private ckbWsUrl: string;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionReady = new Subject<void>();
  private subscriptionListeners = new Map<string, SubscriptionListener>();
  private isListeningForNotifications = false;

  constructor(private readonly configService: ConfigService) {
    this.ckbWsUrl = this.configService.get<string>('CKB_WS_RPC_URL')!;
  }

  onModuleInit() {
    this.logger.log('Initializing CKB WebSocket service...');
    this.connect();
  }

  onModuleDestroy() {
    this.logger.log('Destroying CKB WebSocket service...');
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.client) {
      this.client.close();
    }
  }

  private connect() {
    this.logger.log(`Connecting to CKB node at ${this.ckbWsUrl}`);

    this.client = new RpcWebSocketClient(this.ckbWsUrl, {
      reconnect: false,
    });

    this.client.on('open', () => {
      this.logger.log('Successfully connected to CKB node.');
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.listenForNotifications();
      this.connectionReady.next();
      this.connectionReady.complete();
    });

    this.client.on('error', (err: any) => {
      this.logger.error('WebSocket error:', err.message);
    });

    this.client.on('close', (code: number, reason: string) => {
      this.logger.warn(
        `WebSocket closed. Code: ${code}, Reason: ${reason}. Attempting to reconnect...`,
      );
      this.scheduleReconnect();
    });
  }

  private listenForNotifications() {
    if (this.isListeningForNotifications || !this.client) {
      return;
    }
    this.client.on(
      'subscribe',
      (data: { subscription: string; result: any }) => {
        if (data && data.subscription) {
          const sub = this.subscriptionListeners.get(data.subscription);
          if (sub) {
            sub.listener(data.result);
          }
        }
      },
    );
    this.isListeningForNotifications = true;
    this.logger.log('Central subscription listener is active.');
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    const reconnectDelay = 5000;
    this.connectionReady = new Subject<void>();
    this.reconnectTimeout = setTimeout(() => {
      this.logger.log('Attempting to reconnect...');
      this.reconnectTimeout = null;
      this.connect();
    }, reconnectDelay);
  }

  private async ensureConnected() {
    if (this.client && this.client['readyState'] === 1) {
      return;
    }
    return firstValueFrom(this.connectionReady);
  }

  public async call<T = any>(method: string, params: any[]): Promise<T> {
    await this.ensureConnected();
    this.logger.debug(`Calling RPC method: ${method}`, { params });
    return this.client.call(method, params) as T;
  }

  public async subscribe(
    topic: string,
    listener: (...args: any[]) => void,
  ): Promise<{ unsubscribe: () => Promise<void> }> {
    await this.ensureConnected();

    this.logger.debug(`Requesting subscription to topic: ${topic}`);
    const subscriptionId = (await this.client.call('subscribe', [
      topic,
    ])) as string;
    this.logger.log(
      `Successfully subscribed to topic: ${topic} with ID: ${subscriptionId}`,
    );

    this.subscriptionListeners.set(subscriptionId, { topic, listener });
    return {
      unsubscribe: async () => {
        this.logger.debug(`Unsubscribing from topic ID: ${subscriptionId}`);
        if (this.client && this.client['readyState'] === 1) {
          await this.client.call('unsubscribe', [subscriptionId]);
        }
        this.subscriptionListeners.delete(subscriptionId);
      },
    };
  }
}
