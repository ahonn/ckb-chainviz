import { Module } from '@nestjs/common';
import { CkbWebsocketService } from './ckb-websocket.service';

@Module({
  providers: [CkbWebsocketService],
  exports: [CkbWebsocketService],
})
export class CkbModule {}
