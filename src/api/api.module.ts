import { Module } from '@nestjs/common';
import { WebSocketModule } from './websocket/websocket.module';
import { BlocksModule } from './blocks/blocks.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SnapshotModule } from './snapshot/snapshot.module';

@Module({
  imports: [WebSocketModule, BlocksModule, TransactionsModule, SnapshotModule],
  exports: [WebSocketModule, BlocksModule, TransactionsModule, SnapshotModule],
})
export class ApiModule {}
