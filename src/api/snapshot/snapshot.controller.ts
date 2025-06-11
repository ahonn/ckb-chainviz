import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';
import { SnapshotResponse, SnapshotResponseSchema } from './snapshot.schemas';

@Controller('api/v1')
export class SnapshotController {
  constructor(private readonly snapshotService: SnapshotService) {}

  @Get('snapshot')
  async getCurrentSnapshot(): Promise<SnapshotResponse> {
    try {
      const [latestBlock, pendingTransactions, proposedTransactions] =
        await Promise.all([
          this.snapshotService.getLatestBlock(),
          this.snapshotService.getPendingTransactions(),
          this.snapshotService.getProposedTransactions(),
        ]);

      if (!latestBlock) {
        throw new HttpException('No blocks found', HttpStatus.NOT_FOUND);
      }

      const response = {
        data: {
          latestBlock: {
            blockNumber: latestBlock.number.toString(),
            blockHash: latestBlock.hash,
            timestamp: latestBlock.timestamp.toISOString(),
            transactionCount: latestBlock.transactionCount,
          },
          pendingTransactions: pendingTransactions.map((tx) => ({
            txHash: tx.hash,
            timestamp: tx.createdAt.toISOString(),
            fee: tx.fee.toString(),
            feeRate: this.snapshotService.calculateFeeRate(tx.fee, tx.size),
            size: tx.size.toString(),
          })),
          proposedTransactions: proposedTransactions.map((tx) => ({
            txHash: tx.hash,
            timestamp: tx.createdAt.toISOString(),
            fee: tx.fee.toString(),
            feeRate: this.snapshotService.calculateFeeRate(tx.fee, tx.size),
            size: tx.size.toString(),
            context: {
              blockNumber: tx.block?.number.toString() || '0',
              blockHash: tx.block?.hash || '',
            },
          })),
        },
        timestamp: new Date().toISOString(),
      };

      return SnapshotResponseSchema.parse(response);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

