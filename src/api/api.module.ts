import { Module } from '@nestjs/common';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  exports: [WebSocketModule],
})
export class ApiModule {}
