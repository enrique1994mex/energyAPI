import { z } from 'zod';

export const createConsumptionRecordSchema = z.object({
  periodStart:  z.coerce.date(),
  periodEnd:    z.coerce.date(),
  kwhNonSummer: z.number().min(0),
  kwhSummer:    z.number().min(0),
}).refine(
  (data) => data.periodEnd > data.periodStart,
  { message: 'periodEnd must be after periodStart', path: ['periodEnd'] }
).refine(
  (data) => data.kwhNonSummer + data.kwhSummer > 0,
  { message: 'Total consumption (kwhNonSummer + kwhSummer) must be greater than 0' }
);

export const updateConsumptionRecordSchema = z.object({
  periodStart:  z.coerce.date().optional(),
  periodEnd:    z.coerce.date().optional(),
  kwhNonSummer: z.number().min(0).optional(),
  kwhSummer:    z.number().min(0).optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'At least one field is required to update' }
);
