import { z } from 'zod';

export const PreviousOutputSchema = z.object({
  txHash: z.string(),
  index: z.string(),
});

export const TransactionInputSchema = z.object({
  previousOutput: PreviousOutputSchema,
  since: z.string(),
});

export const LockScriptSchema = z.object({
  codeHash: z.string(),
  hashType: z.string(),
  args: z.string(),
});

export const TransactionOutputSchema = z.object({
  capacity: z.string(),
  lock: LockScriptSchema,
});

export const TransactionDetailsDataSchema = z.object({
  txHash: z.string(),
  status: z.string(),
  timestamp: z.string(),
  fee: z.string(),
  feeRate: z.string(),
  size: z.string(),
  cycles: z.string(),
  inputs: z.array(TransactionInputSchema),
  outputs: z.array(TransactionOutputSchema),
});

export const TransactionDetailsResponseSchema = z.object({
  data: TransactionDetailsDataSchema,
});

export const TransactionHashSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]+$/,
    'Transaction hash must be a valid hex string starting with 0x',
  );

export type PreviousOutput = z.infer<typeof PreviousOutputSchema>;
export type TransactionInput = z.infer<typeof TransactionInputSchema>;
export type LockScript = z.infer<typeof LockScriptSchema>;
export type TransactionOutput = z.infer<typeof TransactionOutputSchema>;
export type TransactionDetailsData = z.infer<
  typeof TransactionDetailsDataSchema
>;
export type TransactionDetailsResponse = z.infer<
  typeof TransactionDetailsResponseSchema
>;

