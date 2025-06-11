import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestBlock() {
    return this.prisma.block.findFirst({
      orderBy: {
        number: 'desc',
      },
    });
  }

  async getBlockByNumber(blockNumber: bigint) {
    return this.prisma.block.findUnique({
      where: {
        number: blockNumber,
      },
    });
  }

  async getBlockTransactions(blockId: number) {
    return this.prisma.transaction.findMany({
      where: {
        blockId,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async calculateTotalFees(blockId: number): Promise<string> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        blockId,
        status: 'CONFIRMED',
      },
      _sum: {
        fee: true,
      },
    });

    return result._sum.fee?.toString() || '0';
  }

  calculateFeeRate(fee: bigint, size: bigint): string {
    if (size === BigInt(0)) {
      return '0';
    }

    // Fee rate = fee / size (in CKB per byte)
    // Converting to a more readable format with 2 decimal places
    const feeRate = Number(fee) / Number(size);
    return feeRate.toFixed(2);
  }
}
