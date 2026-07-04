import prisma from '../config/prisma.js';
import { AppError } from '../errors/AppError.js';
import { countSeasonDays, findMostCompleteMonth, applyBlocks, getDaysInMonth } from '../utils/billing.utils.js';
import { getCachedSimulation, setCachedSimulation } from '../cache/billing.cache.js';

const IVA_RATE = 0.16;
// DAP (Derecho al Alumbrado Público) es un impuesto municipal variable.
// Mérida/Yucatán aplica ~4.31% sobre (energía + IVA) según los recibos de referencia.
const DAP_RATE = 0.04312;

// ── Carga de tarifas desde BD ────────────────────────────────────────────────

async function getRate(tariffId, month, year, isSummer) {
  const rate = await prisma.tariffMonthlyRate.findUnique({
    where: { tariffId_month_year_isSummer: { tariffId, month, year, isSummer } },
    include: { blocks: { orderBy: { blockOrder: 'asc' } } },
  });
  
  if (!rate) throw new AppError(`Tarifa no encontrada para ${month}/${year} (verano=${isSummer})`, 422);
  if (!rate.blocks.length) throw new AppError(`Sin bloques para tarifa ${month}/${year} (verano=${isSummer})`, 422);

  return rate;
}

// ── Cálculo de bloques con límites del periodo ───────────────────────────────

/**
 * Regla 1 (periodo puro): límite = límite_mesInicio + límite_mesFin.
 * Precio del mes más completo.
 */
async function buildBlocksPurePeriod(tariffId, periodStart, periodEnd, isSummer, summerStartMonth, summerEndMonth) {
  const startMonth = periodStart.getUTCMonth() + 1;
  const startYear  = periodStart.getUTCFullYear();
  const endMonth   = periodEnd.getUTCMonth() + 1;
  const endYear    = periodEnd.getUTCFullYear();

  const mostComplete = findMostCompleteMonth(periodStart, periodEnd, isSummer, summerStartMonth, summerEndMonth);
  const [startRate, endRate, priceRate] = await Promise.all([
    getRate(tariffId, startMonth, startYear, isSummer),
    getRate(tariffId, endMonth, endYear, isSummer),
    getRate(tariffId, mostComplete.month, mostComplete.year, isSummer),
  ]);

  const startMap = new Map(startRate.blocks.map(b => [b.blockOrder, b]));
  const endMap   = new Map(endRate.blocks.map(b => [b.blockOrder, b]));

  const blocks = priceRate.blocks.map(b => {
    const sl = startMap.get(b.blockOrder);
    const el = endMap.get(b.blockOrder);

    const periodLimit =
      b.kwhLimit === null ? null
      : (sl?.kwhLimit ?? 0) + (el?.kwhLimit ?? 0);

    return { ...b, kwhLimit: periodLimit };
  });

  return { blocks, rateMonth: mostComplete };
}

/**
 * Regla 2 (subperiodo mixto): límite = floor(límiteMensual × días / díasMesCompleto).
 * Precio del mes más completo del subperiodo.
 */
async function buildBlocksMixedSubperiod(tariffId, subperiodStart, subperiodEnd, days, isSummer, summerStartMonth, summerEndMonth) {
  const mostComplete = findMostCompleteMonth(subperiodStart, subperiodEnd, isSummer, summerStartMonth, summerEndMonth);
  const daysInMonth  = getDaysInMonth(mostComplete.month, mostComplete.year);
  const rate         = await getRate(tariffId, mostComplete.month, mostComplete.year, isSummer);

  const blocks = rate.blocks.map(b => ({
    ...b,
    kwhLimit: b.kwhLimit === null ? null : Math.floor(b.kwhLimit * days / daysInMonth),
  }));

  return { blocks, rateMonth: mostComplete };
}

// ── Función principal ────────────────────────────────────────────────────────

export async function simulateBilling(recordId, contractId, userId) {
  const record = await prisma.consumptionRecord.findFirst({
    where: { id: recordId, contractId },
    include: {
      contract: {
        select: { userId: true, tariff: true, city: true },
      },
    },
  });

  if (!record) throw new AppError('Registro de consumo no encontrado', 404);
  if (record.contract.userId !== userId) throw new AppError('Sin acceso', 403);

  const { tariff, city } = record.contract;
  const { periodStart, periodEnd, kwhNonSummer, kwhSummer } = record;

  const cached = await getCachedSimulation(recordId, kwhNonSummer, kwhSummer, tariff.type, city);
  if (cached) return cached;

  // Rango de verano de la ciudad: fuente de verdad para determinar temporalidad.
  // Si el contrato no tiene ciudad asignada, el periodo se trata como completamente no-verano.
  let summerStartMonth = null;
  let summerEndMonth   = null;
  if (city) {
    const cityTariff = await prisma.cityTariff.findUnique({
      where: { city },
      select: { summerStartMonth: true, summerEndMonth: true },
    });
    summerStartMonth = cityTariff?.summerStartMonth ?? null;
    summerEndMonth   = cityTariff?.summerEndMonth   ?? null;
  }

  const totalDays = Math.round((periodEnd - periodStart) / 86400000);
  const { nonSummerDays, summerDays } = countSeasonDays(periodStart, periodEnd, summerStartMonth, summerEndMonth);
  const isMixed = nonSummerDays > 0 && summerDays > 0;

  let nonSummerSection = null;
  let summerSection    = null;

  // ── Subperiodo no-verano ──
  if (nonSummerDays > 0) {
    let blocksInfo;

    if (!isMixed) {
      blocksInfo = await buildBlocksPurePeriod(
        tariff.id, periodStart, periodEnd, false, summerStartMonth, summerEndMonth,
      );
    } else {
      blocksInfo = await buildBlocksMixedSubperiod(
        tariff.id, periodStart, periodEnd, nonSummerDays, false, summerStartMonth, summerEndMonth,
      );
    }

    const { blocks, subtotal } = applyBlocks(kwhNonSummer, blocksInfo.blocks);
    nonSummerSection = {
      days: nonSummerDays,
      kwhConsumed: kwhNonSummer,
      rateMonth: blocksInfo.rateMonth,
      blocks,
      subtotal,
    };
  }

  // ── Subperiodo verano ──
  if (summerDays > 0) {
    let blocksInfo;

    if (!isMixed) {
      blocksInfo = await buildBlocksPurePeriod(
        tariff.id, periodStart, periodEnd, true, summerStartMonth, summerEndMonth,
      );
    } else {
      blocksInfo = await buildBlocksMixedSubperiod(
        tariff.id, periodStart, periodEnd, summerDays, true, summerStartMonth, summerEndMonth,
      );
    }

    const { blocks, subtotal } = applyBlocks(kwhSummer, blocksInfo.blocks);
    summerSection = {
      days: summerDays,
      kwhConsumed: kwhSummer,
      rateMonth: blocksInfo.rateMonth,
      blocks,
      subtotal,
    };
  }

  const energiaSubtotal = Math.round(
    ((nonSummerSection?.subtotal ?? 0) + (summerSection?.subtotal ?? 0)) * 100,
  ) / 100;

  const iva              = Math.round(energiaSubtotal * IVA_RATE * 100) / 100;
  const facturaDelPeriodo = Math.round((energiaSubtotal + iva) * 100) / 100;
  const dapEstimado      = Math.round(facturaDelPeriodo * DAP_RATE * 100) / 100;

  const result = {
    period: {
      start: periodStart,
      end: periodEnd,
      totalDays,
    },
    consumption: {
      total: kwhNonSummer + kwhSummer,
      nonSummer: kwhNonSummer,
      summer: kwhSummer,
    },
    isMixed,
    nonSummer: nonSummerSection,
    summer: summerSection,
    energiaSubtotal,
    iva,
    facturaDelPeriodo,
    dapEstimado,
    totalEstimado: Math.round((facturaDelPeriodo + dapEstimado) * 100) / 100,
  };

  await setCachedSimulation(recordId, kwhNonSummer, kwhSummer, tariff.type, city, result);
  return result;
}
