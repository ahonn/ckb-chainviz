import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CkbWebsocketService } from '../ckb/ckb-websocket.service';

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly ckbWebsocketService: CkbWebsocketService) {}

  async onModuleInit() {
    this.logger.log('SyncService initialized. Subscribing to CKB events...');
    await Promise.all([
      this.subscribeToNewTipHeader(),
      this.subscribeToNewTransaction(),
    ]);
  }

  private async subscribeToNewTipHeader() {
    try {
      await this.ckbWebsocketService.subscribe('new_tip_header', (header) => {
        this.logger.log(`New Tip Header Received: ${header}`);
      });
      this.logger.log('Successfully subscribed to new_tip_header');
    } catch (error) {
      this.logger.error('Failed to subscribe to new_tip_header', error);
    }
  }

  private async subscribeToNewTransaction() {
    try {
      await this.ckbWebsocketService.subscribe('new_transaction', (tx) => {
        this.logger.log(`New Transaction Received: ${tx}`);
      });
      this.logger.log('Successfully subscribed to new_transaction');
    } catch (error) {
      this.logger.error('Failed to subscribe to new_transaction', error);
    }
  }
}

