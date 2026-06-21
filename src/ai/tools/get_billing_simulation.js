import { simulateBilling } from '../../services/billing.service.js';

export const schema = {
  name: 'get_billing_simulation',
  description:
    'Simulates the CFE electric bill for a specific consumption record. Returns energy subtotal, IVA, DAP estimate, and total cost in MXN.',
  input_schema: {
    type: 'object',
    properties: {
      recordId: {
        type: 'integer',
        description: 'The numeric ID of the consumption record to simulate',
      },
    },
    required: ['recordId'],
  },
};

export async function handler({ recordId }, contractId, userId) {
  return simulateBilling(recordId, contractId, userId);
}
