import * as contractService from './contract.service.js';
import * as consumptionService from './consumptionRecord.service.js';
import { simulateBilling } from './billing.service.js';
import { runAgent } from '../ai/agent/agentService.js';
import { callGemini } from '../providers/ai.provider.js';
import { AppError } from '../errors/AppError.js';

export async function getContractInsights(contractId, userId) {
  const providerName = process.env.AI_PROVIDER ?? 'claude';

  if (providerName === 'claude') {
    return runAgent(contractId, userId);
  }

  // Gemini: build context and send it in a single call
  const contract = await contractService.getContractById(contractId, userId);

  const allRecords = await consumptionService.getConsumptionRecordsByContract(contractId, userId);
  const records = allRecords
    .sort((a, b) => new Date(b.periodEnd) - new Date(a.periodEnd))
    .slice(0, 6);

  if (records.length === 0) {
    throw new AppError('No hay registros de consumo para analizar', 422);
  }

  const settled = await Promise.allSettled(
    records.map(r => simulateBilling(r.id, contractId, userId))
  );

  const valid = settled
    .map((res, i) => (res.status === 'fulfilled' ? { record: records[i], sim: res.value } : null))
    .filter(Boolean);

  if (valid.length === 0) {
    throw new AppError('No se pudo simular la facturación para ningún registro', 422);
  }

  const billingHistory = valid.map(({ record, sim }) => ({
    period: `${record.periodStart.toISOString().slice(0, 10)} – ${record.periodEnd.toISOString().slice(0, 10)}`,
    totalKwh: record.kwhNonSummer + record.kwhSummer,
    summerKwh: record.kwhSummer,
    nonSummerKwh: record.kwhNonSummer,
    estimatedCost: sim.totalEstimado,
    isMixed: sim.isMixed,
  }));

  const kwhs = billingHistory.map(b => b.totalKwh);
  const avgConsumption = Math.round(kwhs.reduce((a, b) => a + b, 0) / kwhs.length);

  const latestSim = valid[0].sim;
  const seasonalPeriod = latestSim.isMixed ? 'mixed' : latestSim.summer ? 'summer' : 'non-summer';

  const context = {
    tariff: contract.tariff.type,
    city: contract.city ?? 'unknown',
    avgConsumption,
    latestConsumption: billingHistory[0].totalKwh,
    latestCost: billingHistory[0].estimatedCost,
    seasonalPeriod,
    billingHistory,
  };

  return callGemini(context);
}
