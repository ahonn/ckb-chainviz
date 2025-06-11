import { z } from 'zod';

export const ErrorDetailsSchema = z.object({
  parameter: z.string().optional(),
  provided: z.union([z.string(), z.number()]).optional(),
  maximum: z.number().optional(),
}).optional();

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: ErrorDetailsSchema,
});

export const ErrorResponseSchema = z.object({
  error: ErrorSchema,
  timestamp: z.string(),
});

export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;
export type Error = z.infer<typeof ErrorSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
