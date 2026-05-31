import * as aiService from '../services/ai.service.js';
import { parseId } from '../utils/parseId.js';

export const getContractInsights = async (req, res, next) => {
  try {
    const contractId = parseId(req.params.id);
    const insights = await aiService.getContractInsights(contractId, req.user.id);
    res.json(insights);
  } catch (error) {
    next(error);
  }
};
