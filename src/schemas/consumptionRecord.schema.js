import { z } from 'zod';

export const createConsumptionRecordSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  kwhConsumed: z.number().positive(),
});

export const updateConsumptionRecordSchema = z.object({
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).max(2100).optional(),
  kwhConsumed: z.number().positive().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required to update' }
);