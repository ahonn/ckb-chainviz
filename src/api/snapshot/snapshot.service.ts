import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class SnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestBlock() {
    return this.prisma.block.findFirst({
      orderBy: {
        number: 'desc',
      },
    });
  }

  async getPendingTransactions(limit: number = 50) {
    return this.prisma.transaction.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getProposedTransactions(limit: number = 50) {
    return this.prisma.transaction.findMany({
      where: {
        status: 'PROPOSED',
      },
      include: {
        block: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
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

