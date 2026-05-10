import { z } from 'zod';

export const createContractSchema = z.object({
  contractName: z.string().min(1, 'Contract name is required'),
  meterNumber: z.string().min(1, 'Meter number is required'),
  tariffId: z.int().positive('Tariff ID must be a positive integer'),
});

export const updateContractSchema = z.object({
  contractName: z.string().min(1).optional(),
  meterNumber: z.string().min(1).optional(),
  tariffId: z.int().positive().optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required to update' }
);