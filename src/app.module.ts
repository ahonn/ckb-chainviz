import { Module } from '@nestjs/common';
import ConfigModule from './config';
import { DatabaseModule } from './core/database/database.module';
import { CkbModule } from './core/ckb/ckb.module';
import { SyncModule } from './core/sync/sync.module';

@Module({
  imports: [ConfigModule, DatabaseModule, CkbModule, SyncModule],
})
export class AppModule {}
