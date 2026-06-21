import { handler as consumptionHandler } from '../tools/get_consumption_history.js';
import { handler as billingHandler } from '../tools/get_billing_simulation.js';
import { handler as tariffHandler } from '../tools/get_tariff_info.js';
import { AppError } from '../../errors/AppError.js';

const HANDLERS = {
  get_consumption_history: consumptionHandler,
  get_billing_simulation: billingHandler,
  get_tariff_info: tariffHandler,
};

export async function executeToolCall(toolName, toolInput, contractId, userId) {
  const fn = HANDLERS[toolName];
  if (!fn) throw new AppError(`Herramienta desconocida: ${toolName}`, 500);
  return fn(toolInput, contractId, userId);
}
