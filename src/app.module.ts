import { Module } from '@nestjs/common';
import ConfigModule from './config';
import { DatabaseModule } from './core/database/database.module';
import { CkbModule } from './core/ckb/ckb.module';
import { SyncModule } from './core/sync/sync.module';
import { ApiModule } from './api/api.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CkbModule,
    SyncModule,
    ApiModule,
    EventEmitterModule.forRoot(),
  ],
})
export class AppModule {}
