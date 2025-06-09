import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ServerMessage,
  BlockFinalizedPayload,
  TransactionPendingPayload,
  TransactionProposedPayload,
  TransactionConfirmedPayload,
  TransactionRejectedPayload,
} from './websocket.types';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitBlockFinalized(payload: BlockFinalizedPayload) {
    const message: ServerMessage = {
      channel: 'chain',
      type: 'block.finalized',
      payload,
    };

    this.logger.debug(
      `Emitting block.finalized event for block #${payload.blockNumber}`,
    );
    this.eventEmitter.emit('websocket.broadcast', message);
  }

  emitTransactionPending(payload: TransactionPendingPayload) {
    const message: ServerMessage = {
      channel: 'transactions',
      type: 'transaction.pending',
      payload,
    };

    this.logger.debug(
      `Emitting transaction.pending event for tx ${payload.txHash}`,
    );
    this.eventEmitter.emit('websocket.broadcast', message);
  }

  emitTransactionProposed(payload: TransactionProposedPayload) {
    const message: ServerMessage = {
      channel: 'transactions',
      type: 'transaction.proposed',
      payload,
    };

    this.logger.debug(
      `Emitting transaction.proposed event for tx ${payload.txHash}`,
    );
    this.eventEmitter.emit('websocket.broadcast', message);
  }

  emitTransactionConfirmed(payload: TransactionConfirmedPayload) {
    const message: ServerMessage = {
      channel: 'transactions',
      type: 'transaction.confirmed',
      payload,
    };

    this.logger.debug(
      `Emitting transaction.confirmed event for tx ${payload.txHash}`,
    );
    this.eventEmitter.emit('websocket.broadcast', message);
  }

  emitTransactionRejected(payload: TransactionRejectedPayload) {
    const message: ServerMessage = {
      channel: 'transactions',
      type: 'transaction.rejected',
      payload,
    };

    this.logger.debug(
      `Emitting transaction.rejected event for tx ${payload.txHash}`,
    );
    this.eventEmitter.emit('websocket.broadcast', message);
  }
}
