import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { BlockService } from './block.service';
import { TransactionService } from './transaction.service';
import { CkbModule } from '../ckb/ckb.module';
import { WebSocketModule } from '../../api/websocket/websocket.module';

@Module({
  imports: [CkbModule, WebSocketModule],
  providers: [SyncService, BlockService, TransactionService],
  exports: [SyncService],
})
export class SyncModule {}
