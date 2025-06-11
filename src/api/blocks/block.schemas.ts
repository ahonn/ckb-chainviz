import { z } from 'zod';

export const TransactionSummarySchema = z.object({
  txHash: z.string(),
  fee: z.string(),
  feeRate: z.string(),
  size: z.string(),
});

export const LatestBlockDataSchema = z.object({
  blockNumber: z.string(),
  blockHash: z.string(),
  timestamp: z.string(),
  transactionCount: z.number(),
  totalFees: z.string(),
});

export const LatestBlockResponseSchema = z.object({
  data: LatestBlockDataSchema,
});

export const BlockDataSchema = z.object({
  blockNumber: z.string(),
  blockHash: z.string(),
  timestamp: z.string(),
  miner: z.string(),
  transactionCount: z.number(),
  transactions: z.array(TransactionSummarySchema),
});

export const BlockResponseSchema = z.object({
  data: BlockDataSchema,
});

export const BlockNumberSchema = z
  .string()
  .regex(/^\d+$/, 'Block number must be a valid number');

export type TransactionSummary = z.infer<typeof TransactionSummarySchema>;
export type LatestBlockData = z.infer<typeof LatestBlockDataSchema>;
export type LatestBlockResponse = z.infer<typeof LatestBlockResponseSchema>;
export type BlockData = z.infer<typeof BlockDataSchema>;
export type BlockResponse = z.infer<typeof BlockResponseSchema>;
