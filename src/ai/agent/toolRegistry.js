import { schema as consumptionSchema } from '../tools/get_consumption_history.js';
import { schema as billingSchema } from '../tools/get_billing_simulation.js';
import { schema as tariffSchema } from '../tools/get_tariff_info.js';

export const AGENT_TOOLS = [consumptionSchema, billingSchema, tariffSchema];
