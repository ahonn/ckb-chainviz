import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { BlockService } from './block.service';
import { TransactionService } from './transaction.service';
import { CkbModule } from '../ckb/ckb.module';

@Module({
  imports: [CkbModule],
  providers: [SyncService, BlockService, TransactionService],
  exports: [SyncService],
})
export class SyncModule {}
