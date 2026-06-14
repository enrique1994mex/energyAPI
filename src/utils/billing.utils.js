function getDaysInMonth(month, year) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isMonthSummer(month, summerStartMonth, summerEndMonth) {
  if (!summerStartMonth || !summerEndMonth) return false;
  return month >= summerStartMonth && month <= summerEndMonth;
}

/**
 * Cuenta los días de verano y no-verano en (periodStart, periodEnd].
 * Convención: se excluye el día de inicio y se incluye el día de fin,
 * de modo que periodos consecutivos que comparten fecha no se solapan.
 */
export function countSeasonDays(periodStart, periodEnd, summerStartMonth, summerEndMonth) {
  const firstDay = new Date(periodStart.getTime() + 86400000);
  let nonSummerDays = 0;
  let summerDays = 0;

  let cur = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth(), 1));

  while (cur <= periodEnd) {
    const month = cur.getUTCMonth() + 1;
    const year = cur.getUTCFullYear();
    const nextMonth = new Date(Date.UTC(year, cur.getUTCMonth() + 1, 1));

    const segStart = new Date(Math.max(firstDay.getTime(), cur.getTime()));
    const segEnd = new Date(Math.min(nextMonth.getTime() - 86400000, periodEnd.getTime()));
    const days = Math.round((segEnd - segStart) / 86400000) + 1;

    if (isMonthSummer(month, summerStartMonth, summerEndMonth)) {
      summerDays += days;
    } else {
      nonSummerDays += days;
    }

    cur = nextMonth;
  }

  return { nonSummerDays, summerDays };
}

/**
 * Encuentra el mes calendario con más días presentes en (periodStart, periodEnd]
 * que pertenezca a la temporada indicada.
 */
export function findMostCompleteMonth(periodStart, periodEnd, isSummerSeason, summerStartMonth, summerEndMonth) {
  const firstDay = new Date(periodStart.getTime() + 86400000);
  let best = null;
  let bestDays = 0;

  let cur = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth(), 1));

  while (cur <= periodEnd) {
    const month = cur.getUTCMonth() + 1;
    const year = cur.getUTCFullYear();
    const nextMonth = new Date(Date.UTC(year, cur.getUTCMonth() + 1, 1));

    if (isMonthSummer(month, summerStartMonth, summerEndMonth) === isSummerSeason) {
      const segStart = new Date(Math.max(firstDay.getTime(), cur.getTime()));
      const segEnd = new Date(Math.min(nextMonth.getTime() - 86400000, periodEnd.getTime()));
      const days = Math.round((segEnd - segStart) / 86400000) + 1;

      if (days > bestDays) {
        bestDays = days;
        best = { month, year };
      }
    }

    cur = nextMonth;
  }

  return best;
}

/**
 * Aplica los bloques tarifarios (con límites ya calculados para el periodo)
 * al consumo en kWh. Devuelve el desglose por bloque y el total.
 */
export function applyBlocks(kwhConsumed, blocksWithPeriodLimits) {
  const result = [];
  let remaining = kwhConsumed;
  let totalCharge = 0;

  for (const block of blocksWithPeriodLimits) {
    if (remaining <= 0) break;

    const limitForPeriod = block.kwhLimit === null ? Infinity : block.kwhLimit;
    const kwhInBlock = Math.min(remaining, limitForPeriod);
    const subtotal = Math.round(kwhInBlock * block.pricePerKwh * 100) / 100;

    result.push({
      blockOrder: block.blockOrder,
      blockName: block.blockName,
      kwhLimit: block.kwhLimit,
      kwhConsumed: Math.round(kwhInBlock * 100) / 100,
      pricePerKwh: block.pricePerKwh,
      subtotal,
    });

    totalCharge += subtotal;
    remaining -= kwhInBlock;
  }

  return { blocks: result, subtotal: Math.round(totalCharge * 100) / 100 };
}
