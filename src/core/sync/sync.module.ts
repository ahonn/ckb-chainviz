import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { CkbModule } from '../ckb/ckb.module';

@Module({
  imports: [CkbModule],
  providers: [SyncService],
})
export class SyncModule {}

