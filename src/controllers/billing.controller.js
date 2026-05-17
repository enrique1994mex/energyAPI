import { simulateBilling } from '../services/billing.service.js';
import { parseId } from '../utils/parseId.js';

export const getBillingSimulation = async (req, res, next) => {
  try {
    const contractId = parseId(req.params.contractId);
    const recordId   = parseId(req.params.recordId);
    const userId     = req.user.id;

    const result = await simulateBilling(recordId, contractId, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
