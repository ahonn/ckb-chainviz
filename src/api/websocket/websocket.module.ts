import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WebSocketGateway } from './websocket.gateway';
import { EventService } from './event.service';

@Module({
  imports: [EventEmitterModule],
  providers: [WebSocketGateway, EventService],
  exports: [EventService],
})
export class WebSocketModule {}
