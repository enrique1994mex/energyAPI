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
  kwhNonSummer: z.number().min(0).optional(),
  kwhSummer:    z.number().min(0).optional(),
}).refine(
  (data) => data.kwhNonSummer !== undefined || data.kwhSummer !== undefined,
  { message: 'At least one kWh field is required to update' }
).refine(
  (data) => !(data.kwhNonSummer === 0 && data.kwhSummer === 0),
  { message: 'kwhNonSummer and kwhSummer cannot both be zero' }
);
