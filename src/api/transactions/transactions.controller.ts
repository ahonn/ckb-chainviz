import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  TransactionDetailsResponse,
  TransactionHashSchema,
  TransactionDetailsResponseSchema,
} from './transaction.schemas';
import { ZodParam } from '../../common/decorators/zod-param.decorator';

@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get(':txHash')
  async getTransactionDetails(
    @ZodParam('txHash', TransactionHashSchema) txHash: string,
  ): Promise<TransactionDetailsResponse> {
    try {
      const transaction =
        await this.transactionsService.getTransactionByHash(txHash);

      if (!transaction) {
        throw new HttpException(
          `Transaction ${txHash} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      const response = {
        data: {
          txHash: transaction.hash,
          status: this.transactionsService.getTransactionStatus(transaction),
          timestamp: transaction.createdAt.toISOString(),
          fee: transaction.fee.toString(),
          feeRate: this.transactionsService.calculateFeeRate(
            transaction.fee,
            transaction.size,
          ),
          size: transaction.size.toString(),
          cycles: transaction.cycles.toString(),
          inputs: transaction.inputs.map((input) => ({
            previousOutput: {
              txHash: input.previousTxHash,
              index: input.previousIndex.toString(),
            },
            since: input.since,
          })),
          outputs: transaction.outputs.map((output) => ({
            capacity: output.capacity.toString(),
            lock: {
              codeHash: output.lock.codeHash,
              hashType: output.lock.hashType,
              args: output.lock.args,
            },
          })),
        },
      };

      return TransactionDetailsResponseSchema.parse(response);
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

