import { getConsumptionRecordsByContract } from '../../services/consumptionRecord.service.js';

export const schema = {
  name: 'get_consumption_history',
  description:
    'Returns the most recent consumption records for the contract. Each record includes id, periodStart, periodEnd, kwhNonSummer, and kwhSummer.',
  input_schema: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        description: 'Maximum number of records to return (1-12). Default is 6.',
      },
    },
    required: [],
  },
};

export async function handler({ limit = 6 }, contractId, userId) {
  const records = await getConsumptionRecordsByContract(contractId, userId);
  return records
    .sort((a, b) => new Date(b.periodEnd) - new Date(a.periodEnd))
    .slice(0, Math.min(limit, 12));
}
