import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import {
  LatestBlockResponse,
  BlockResponse,
  BlockNumberSchema,
  LatestBlockResponseSchema,
  BlockResponseSchema,
} from './block.schemas';
import { ZodParam } from '../../common/decorators/zod-param.decorator';

@Controller('api/v1/blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get('latest')
  async getLatestBlock(): Promise<LatestBlockResponse> {
    try {
      const latestBlock = await this.blocksService.getLatestBlock();

      if (!latestBlock) {
        throw new HttpException('No blocks found', HttpStatus.NOT_FOUND);
      }

      const response = {
        data: {
          blockNumber: latestBlock.number.toString(),
          blockHash: latestBlock.hash,
          timestamp: latestBlock.timestamp.toISOString(),
          transactionCount: latestBlock.transactionCount,
          totalFees: await this.blocksService.calculateTotalFees(
            latestBlock.id,
          ),
        },
      };

      // Validate response with zod schema
      return LatestBlockResponseSchema.parse(response);
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

  @Get(':blockNumber')
  async getBlockByNumber(
    @ZodParam('blockNumber', BlockNumberSchema) blockNumber: string,
  ): Promise<BlockResponse> {
    try {
      const blockNum = BigInt(blockNumber);
      const block = await this.blocksService.getBlockByNumber(blockNum);

      if (!block) {
        throw new HttpException(
          `Block ${blockNumber} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      const transactions = await this.blocksService.getBlockTransactions(
        block.id,
      );

      const response = {
        data: {
          blockNumber: block.number.toString(),
          blockHash: block.hash,
          timestamp: block.timestamp.toISOString(),
          miner: block.miner,
          transactionCount: block.transactionCount,
          transactions: transactions.map((tx) => ({
            txHash: tx.hash,
            fee: tx.fee.toString(),
            feeRate: this.blocksService.calculateFeeRate(tx.fee, tx.size),
            size: tx.size.toString(),
          })),
        },
      };

      // Validate response with zod schema
      return BlockResponseSchema.parse(response);
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
