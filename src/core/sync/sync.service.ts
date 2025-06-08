import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CkbWebsocketService } from '../ckb/ckb-websocket.service';
import { PrismaService } from '../database/prisma.service';
import { BlockService } from './block.service';
import { TransactionService } from './transaction.service';
import { Block, NewTransactionEntry } from '../ckb/ckb.interface';

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly ckbWebsocketService: CkbWebsocketService,
    private readonly prisma: PrismaService,
    private readonly blockService: BlockService,
    private readonly transactionService: TransactionService,
  ) {}

  async onModuleInit() {
    this.logger.log('SyncService initialized. Subscribing to CKB events...');
    await Promise.all([
      this.subscribeToNewTipBlock(),
      this.subscribeToNewTransaction(),
      this.subscribeToProposedTransaction(),
      this.subscribeToRejectedTransaction(),
    ]);
  }

  private async subscribeToNewTipBlock() {
    try {
      await this.ckbWebsocketService.subscribe(
        'new_tip_block',
        async (blockString: string) => {
          try {
            const block = JSON.parse(blockString) as Block;
            await this.prisma.$transaction(async (prisma) => {
              const savedBlock = await this.blockService.upsertBlock(
                block,
                prisma,
              );

              await this.transactionService.updateProposedTransactions(
                block.proposals,
                prisma,
              );
              for (const [i, tx] of block.transactions.entries()) {
                await this.transactionService.processCommittedTx(
                  tx,
                  savedBlock.id,
                  prisma,
                  i === 0,
                );
              }
              this.logger.log(
                `Successfully processed block #${savedBlock.number}`,
              );
            });
          } catch (error) {
            this.logger.error(
              `Failed to process new_tip_block: ${blockString}`,
              error,
            );
          }
        },
      );
      this.logger.log('Successfully subscribed to new_tip_block');
    } catch (error) {
      this.logger.error('Failed to subscribe to new_tip_block', error);
    }
  }

  private async subscribeToNewTransaction() {
    try {
      await this.ckbWebsocketService.subscribe(
        'new_transaction',
        async (txEntry: string) => {
          try {
            const parsedTx = JSON.parse(txEntry) as NewTransactionEntry;
            await this.transactionService.processPendingTx(parsedTx);
            this.logger.log(
              `New Pending Transaction: ${parsedTx.transaction.hash}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to process new_transaction: ${txEntry}`,
              error,
            );
          }
        },
      );
      this.logger.log('Successfully subscribed to new_transaction');
    } catch (error) {
      this.logger.error('Failed to subscribe to new_transaction', error);
    }
  }

  private async subscribeToProposedTransaction() {
    try {
      await this.ckbWebsocketService.subscribe(
        'proposed_transaction',
        async (txEntry: string) => {
          try {
            const parsedTx = JSON.parse(txEntry) as NewTransactionEntry;
            await this.transactionService.updateProposedTransactions([
              parsedTx.transaction.hash,
            ]);
            this.logger.log(
              `Proposed Transaction Updated: ${parsedTx.transaction.hash}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to process proposed_transaction: ${txEntry}`,
              error,
            );
          }
        },
      );
      this.logger.log('Successfully subscribed to proposed_transaction');
    } catch (error) {
      this.logger.error('Failed to subscribe to proposed_transaction', error);
    }
  }

  private async subscribeToRejectedTransaction() {
    try {
      await this.ckbWebsocketService.subscribe(
        'rejected_transaction',
        async (txEntry: string) => {
          try {
            const parsedTx = JSON.parse(txEntry) as NewTransactionEntry;
            await this.transactionService.deleteTransaction(
              parsedTx.transaction.hash,
            );
            this.logger.warn(
              `Rejected Transaction Deleted: ${parsedTx.transaction.hash}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to process rejected_transaction: ${txEntry}`,
              error,
            );
          }
        },
      );
      this.logger.log('Successfully subscribed to rejected_transaction');
    } catch (error) {
      this.logger.error('Failed to subscribe to rejected_transaction', error);
    }
  }
}
