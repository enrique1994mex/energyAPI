import { simulateBilling } from '../services/billing.service.js';
import { parseId } from '../utils/parseId.js';
import logger from '../config/logger.js';

export const getBillingSimulation = async (req, res, next) => {
  try {
    const contractId = parseId(req.params.contractId);
    const recordId   = parseId(req.params.recordId);
    const userId     = req.user.id;

    const start = Date.now();
    const result = await simulateBilling(recordId, contractId, userId);

    logger.info({
      requestId: req.requestId,
      event: 'billing_simulation',
      contractId,
      recordId,
      durationMs: Date.now() - start,
    }, 'billing simulation completed');

    res.json(result);
  } catch (error) {
    next(error);
  }
};
