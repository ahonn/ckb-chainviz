import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Block as PrismaBlock } from '@prisma/client';
import { Block } from '../ckb/ckb.interface';
import { PrismaService } from '../database/prisma.service';
import { HashType, Script, utils } from '@ckb-lumos/lumos';

@Injectable()
export class BlockService {
  private readonly logger = new Logger(BlockService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getMinerLockScript(block: Block): Script {
    const cellbase = block.transactions[0];
    const minerLockScript = cellbase.outputs[0].lock;
    return {
      codeHash: minerLockScript.code_hash,
      hashType: minerLockScript.hash_type as HashType,
      args: minerLockScript.args,
    };
  }

  async upsertBlock(
    block: Block,
    prisma?: Prisma.TransactionClient,
  ): Promise<PrismaBlock> {
    const prismaClient = prisma || this.prisma;
    const header = block.header;
    const cellbase = block.transactions[0];
    const minerLockScript = this.getMinerLockScript(block);
    this.logger.debug(`Upserting block #${header.number}`);

    const savedBlock = await prismaClient.block.upsert({
      where: { hash: header.hash },
      create: {
        hash: header.hash,
        number: BigInt(header.number),
        timestamp: new Date(parseInt(header.timestamp, 16)),
        miner: utils.computeScriptHash(minerLockScript),
        reward: BigInt(cellbase.outputs[0].capacity),
        transactionCount: block.transactions.length,
        proposalsCount: block.proposals.length,
        unclesCount: block.uncles.length,
        size: BigInt(0),
        proposals: block.proposals,
        uncles: JSON.stringify(block.uncles),
        version: parseInt(header.version, 16),
        parentHash: header.parent_hash,
        compactTarget: header.compact_target,
        nonce: header.nonce,
        epoch: header.epoch,
        dao: header.dao,
      },
      update: {},
    });
    return savedBlock;
  }
}
