import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NewTransactionEntry, Transaction } from '../ckb/ckb.interface';
import { PrismaService } from '../database/prisma.service';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateProposedTransactions(
    proposalIds: string[],
    prisma?: TransactionClient,
  ) {
    const prismaClient = prisma || this.prisma;
    if (proposalIds.length === 0) return;
    this.logger.debug(`Updating ${proposalIds.length} proposed transactions.`);
    return prismaClient.transaction.updateMany({
      where: {
        hash: { in: proposalIds },
        status: 'PENDING',
      },
      data: {
        status: 'PROPOSED',
      },
    });
  }

  private async clearTransactionRelations(
    txHash: string,
    prisma: TransactionClient,
  ) {
    await prisma.cellDep.deleteMany({ where: { txHash } });
    await prisma.headerDep.deleteMany({ where: { txHash } });
    await prisma.input.deleteMany({ where: { txHash } });
    await prisma.output.deleteMany({ where: { txHash } });
  }

  async processPendingTx(
    txEntry: NewTransactionEntry,
    prismaClient?: TransactionClient,
  ) {
    const tx = txEntry.transaction;
    this.logger.debug(`Processing pending tx ${tx.hash}`);

    const processor = async (prisma: TransactionClient) => {
      const existingTx = await prisma.transaction.findUnique({
        where: { hash: tx.hash },
      });
      if (existingTx) {
        await this.clearTransactionRelations(tx.hash, prisma);
      }

      const txData = {
        status: 'PENDING' as const,
        fee: BigInt(txEntry.fee),
        size: BigInt(txEntry.size),
        cycles: BigInt(txEntry.cycles),
        version: parseInt(tx.version, 16),
        witnesses: tx.witnesses,
      };

      await prisma.transaction.upsert({
        where: { hash: tx.hash },
        create: { hash: tx.hash, ...txData },
        update: txData,
      });

      await this.createTransactionRelations(tx, prisma);
    };

    if (prismaClient) {
      await processor(prismaClient);
    } else {
      await this.prisma.$transaction(processor);
    }
  }

  async processCommittedTx(
    tx: Transaction,
    blockId: number,
    prismaClient?: TransactionClient,
    isCellbase = false,
  ) {
    this.logger.debug(`Processing committed tx ${tx.hash}`);

    const logic = async (prisma: TransactionClient) => {
      const existingTx = await prisma.transaction.findUnique({
        where: { hash: tx.hash },
      });
      if (existingTx) {
        await this.clearTransactionRelations(tx.hash, prisma);
      }

      const txData = {
        blockId,
        status: 'COMMITTED' as const,
        fee: existingTx?.fee ?? BigInt(0),
        size: existingTx?.size ?? BigInt(0),
        cycles: existingTx?.cycles ?? BigInt(0),
        version: parseInt(tx.version, 16),
        witnesses: tx.witnesses,
      };

      if (existingTx) {
        await prisma.transaction.update({
          where: { hash: tx.hash },
          data: txData,
        });
      } else {
        await prisma.transaction.create({
          data: {
            hash: tx.hash,
            ...txData,
          },
        });
      }

      await this.createTransactionRelations(tx, prisma, isCellbase);
    };
    if (prismaClient) {
      await logic(prismaClient);
    } else {
      await this.prisma.$transaction(logic);
    }
  }

  private async createTransactionRelations(
    tx: Transaction,
    prisma: TransactionClient,
    isCellbase = false,
  ) {
    for (const dep of tx.cell_deps) {
      await prisma.cellDep.create({
        data: {
          txHash: tx.hash,
          outPointTxHash: dep.out_point.tx_hash,
          outPointIndex: parseInt(dep.out_point.index, 16),
          depType: dep.dep_type,
        },
      });
    }

    for (const hash of tx.header_deps) {
      await prisma.headerDep.create({
        data: { txHash: tx.hash, blockHash: hash },
      });
    }

    for (const [index, output] of tx.outputs.entries()) {
      const lockScript = await prisma.script.upsert({
        where: {
          codeHash_hashType_args: {
            codeHash: output.lock.code_hash,
            hashType: output.lock.hash_type,
            args: output.lock.args,
          },
        },
        create: {
          codeHash: output.lock.code_hash,
          hashType: output.lock.hash_type,
          args: output.lock.args,
        },
        update: {},
      });

      let typeScriptId: number | null = null;
      if (output.type) {
        const typeScript = await prisma.script.upsert({
          where: {
            codeHash_hashType_args: {
              codeHash: output.type.code_hash,
              hashType: output.type.hash_type,
              args: output.type.args,
            },
          },
          create: {
            codeHash: output.type.code_hash,
            hashType: output.type.hash_type,
            args: output.type.args,
          },
          update: {},
        });
        typeScriptId = typeScript.id;
      }

      await prisma.output.create({
        data: {
          txHash: tx.hash,
          index: index,
          capacity: BigInt(output.capacity),
          lockScriptId: lockScript.id,
          typeScriptId: typeScriptId,
          data: tx.outputs_data[index],
        },
      });
    }

    if (isCellbase) {
      this.logger.debug(`Skipping inputs for cellbase tx ${tx.hash}`);
      return;
    }

    for (const input of tx.inputs) {
      await prisma.input.create({
        data: {
          txHash: tx.hash,
          previousTxHash: input.previous_output.tx_hash,
          previousIndex: BigInt(input.previous_output.index),
          since: input.since,
        },
      });
    }
  }

  async deleteTransaction(txHash: string, prismaClient?: TransactionClient) {
    const logic = async (prisma: TransactionClient) => {
      const existingTx = await prisma.transaction.findUnique({
        where: { hash: txHash },
      });

      if (existingTx) {
        this.logger.warn(`Deleting transaction: ${txHash}`);
        await this.clearTransactionRelations(txHash, prisma);
        await prisma.transaction.delete({ where: { hash: txHash } });
      }
    };

    if (prismaClient) {
      await logic(prismaClient);
    } else {
      await this.prisma.$transaction(logic);
    }
  }
}
