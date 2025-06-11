import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactionByHash(txHash: string) {
    return this.prisma.transaction.findUnique({
      where: {
        hash: txHash,
      },
      include: {
        inputs: true,
        outputs: {
          include: {
            lock: true,
            type: true,
          },
        },
      },
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

  getTransactionStatus(transaction: any): string {
    if (transaction.status === 'CONFIRMED') {
      return 'confirmed';
    } else if (transaction.status === 'PROPOSED') {
      return 'proposed';
    } else if (transaction.status === 'PENDING') {
      return 'pending';
    } else if (transaction.status === 'REJECTED') {
      return 'rejected';
    }
    return 'unknown';
  }
}

