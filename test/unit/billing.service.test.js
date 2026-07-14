import { countSeasonDays, findMostCompleteMonth, applyBlocks } from '../../src/utils/billing.utils.js';

// T1D: verano de abril (4) a septiembre (9), conforme a la configuración de Mérida
const T1D_SUMMER_START = 4;
const T1D_SUMMER_END = 9;

const d = (str) => new Date(str);

describe('countSeasonDays', () => {
  it('periodo 100% no-verano -> summerDays = 0', () => {
    // (2025-12-18, 2026-02-17] -> firstDay = Dic 19
    // Dic: 13 días (no-verano) | Ene: 31 días (no-verano) | Feb: 17 días (no-verano) = 61 días no-verano
    const { nonSummerDays, summerDays } = countSeasonDays(
      d('2025-12-18'), d('2026-02-17'), T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(summerDays).toBe(1);
    expect(nonSummerDays).toBe(61);
  });

  it('periodo 100% verano -> nonSummerDays = 0', () => {
    // (2026-04-15, 2026-06-16] -> firstDay = Abr 16
    // Abril: 15 días (verano) | Mayo: 31 días (verano) | Junio: 16 días (verano) = 62 días verano
    const { nonSummerDays, summerDays } = countSeasonDays(
      d('2026-04-15'), d('2026-06-16'), T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(nonSummerDays).toBe(0);
    expect(summerDays).toBe(62);
  });

  it('periodo de 3 meses que cruza inicio de verano (abril) -> split no-verano/verano correcto', () => {
    // (2026-03-10, 2026-05-9] -> firstDay = Mar 11
    // Mar: 21 días (no-verano) | Abr: 30 días (verano) | May: 9 días (verano) = 21 días no-verano + 39 días verano
    const { nonSummerDays, summerDays } = countSeasonDays(
      d('2026-03-10'), d('2026-05-09'), T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(nonSummerDays).toBe(21);
    expect(summerDays).toBe(39);
  });

  it('tarifa sin verano (T1, summerStartMonth = null) -> todo no-verano', () => {
    // (2026-05-20, 2026-07-20] -> firstDay = May 21
    // May: 11 días (no-verano) | Jun: 30 días (no-verano) | Jul: 20 días (no-verano) = 61 días no-verano
    const { nonSummerDays, summerDays } = countSeasonDays(
      d('2026-05-20'), d('2026-07-20'), null, null
    );
    expect(summerDays).toBe(0);
    expect(nonSummerDays).toBe(61);
  });

  it('periodo de 3 meses que cruza fin de verano (septiembre) -> octubre y noviembre son no-verano', () => {
    // (2026-09-15, 2026-11-14] -> firstDay = Sep 16
    // Sep: 15 días (verano) | Oct: 31 días (no-verano) | Nov: 14 días (no-verano) = 15 días verano + 45 días no-verano
    const { nonSummerDays, summerDays } = countSeasonDays(
      d('2026-09-15'), d('2026-11-14'), T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(summerDays).toBe(15);
    expect(nonSummerDays).toBe(45);
  });

  it('un solo día en verano -> summerDays = 1, nonSummerDays = 0', () => {
    // (2026-07-14, 2026-07-15] → firstDay = Jul 15 (verano)
    const { nonSummerDays, summerDays } = countSeasonDays(
      d('2026-07-14'), d('2026-07-15'), T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(summerDays).toBe(1);
    expect(nonSummerDays).toBe(0);
  });
});

describe('findMostCompleteMonth', () => {
  it('periodo dentro de un solo mes -> ese mes es el más completo', () => {
    // (2026-05-11, 2026-05-25] -> firstDay = May 12
    const best = findMostCompleteMonth(
      d('2026-05-11'), d('2026-05-25'), true, T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(best).toEqual({ month: 5, year: 2026 });
  });

  it('no-verano: marzo con 31 días supera a febrero con 11 -> devuelve marzo', () => {
    // (2026-02-17, 2026-04-17] -> firstDay = Feb 18
    const best = findMostCompleteMonth(
      d('2026-02-17'), d('2026-04-17'), false, T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(best).toEqual({ month: 3, year: 2026 });
  });

  it('verano: mayo con 31 días supera a abril y junio -> devuelve mayo', () => {
    // (2026-04-17, 2026-06-17] -> firstDay = Apr 18
    const best = findMostCompleteMonth(
      d('2026-04-17'), d('2026-06-17'), true, T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(best).toEqual({ month: 5, year: 2026 });
  });

  it('no existe mes de la temporada -> devuelve null', () => {
    // (2026-05-20, 2026-07-20] -> firstDay = May 21
    const best = findMostCompleteMonth(
      d('2026-05-20'), d('2026-07-20'), false, T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(best).toBeNull();
  });

  it('en empate de días, conserva el primer mes encontrado', () => {
    // (2026-04-15, 2026-05-15] -> firstDay = Apr 16
    const best = findMostCompleteMonth(
      d('2026-04-15'), d('2026-05-15'), true, T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(best).toEqual({ month: 4, year: 2026 });
  });

  it('periodo de un día en verano -> devuelve el mes de ese único día', () => {
    // (2026-07-14, 2026-07-15] → firstDay = Jul 15 (verano)
    const best = findMostCompleteMonth(
      d('2026-07-14'), d('2026-07-15'), true, T1D_SUMMER_START, T1D_SUMMER_END
    );
    expect(best).toEqual({ month: 7, year: 2026 });
  });
});

describe('applyBlocks', () => {
  it('consumo dentro del bloque básico -> se consume solo ese bloque', () => {
    const blocksWithLimits = [
      { blockOrder: 1, blockName: 'básico',     kwhLimit: 100,  pricePerKwh: 1.107 },
      { blockOrder: 2, blockName: 'intermedio', kwhLimit: 125,  pricePerKwh: 1.345 },
      { blockOrder: 3, blockName: 'excedente',  kwhLimit: null, pricePerKwh: 3.932 },
    ];
    const { blocks, subtotal } = applyBlocks(80, blocksWithLimits);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ blockOrder: 1, kwhConsumed: 80, subtotal: 88.56 });
    expect(subtotal).toBe(88.56);
  });

  it('consumo que rebasa el bloque básico pero no el intermedio -> se consumen bloques básico e intermedio', () => {
    const blocksWithLimits = [
      { blockOrder: 1, blockName: 'básico',     kwhLimit: 100,  pricePerKwh: 1.107 },
      { blockOrder: 2, blockName: 'intermedio', kwhLimit: 125,  pricePerKwh: 1.345 },
      { blockOrder: 3, blockName: 'excedente',  kwhLimit: null, pricePerKwh: 3.932 },
    ];
    const { blocks, subtotal } = applyBlocks(180, blocksWithLimits);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ blockOrder: 1, kwhConsumed: 100, subtotal: 110.7 });
    expect(blocks[1]).toMatchObject({ blockOrder: 2, kwhConsumed: 80, subtotal: 107.6 });
    expect(subtotal).toBe(218.3);
  }); 

  it('cosumo que rebasa todos los bloques con límite -> se consume todo el bloque básico, todo el intermedio y el excedente', () => {
    const blocksWithLimits = [
      { blockOrder: 1, blockName: 'básico',     kwhLimit: 100,  pricePerKwh: 1.107 },
      { blockOrder: 2, blockName: 'intermedio', kwhLimit: 125,  pricePerKwh: 1.345 },
      { blockOrder: 3, blockName: 'excedente',  kwhLimit: null, pricePerKwh: 3.932 },
    ];
    const { blocks, subtotal } = applyBlocks(250, blocksWithLimits);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toMatchObject({ blockOrder: 1, kwhConsumed: 100, subtotal: 110.7 });
    expect(blocks[1]).toMatchObject({ blockOrder: 2, kwhConsumed: 125, subtotal: 168.13 });
    expect(blocks[2]).toMatchObject({ blockOrder: 3, kwhConsumed: 25, subtotal: 98.3 });
    expect(subtotal).toBe(377.13);
  });

  it('consumo exactamente en el límite de un bloque -> se consume todo ese bloque y no el siguiente', () => {
    const blocksWithLimits = [
      { blockOrder: 1, blockName: 'básico',     kwhLimit: 100,  pricePerKwh: 1.107 },
      { blockOrder: 2, blockName: 'intermedio', kwhLimit: 125,  pricePerKwh: 1.345 },
      { blockOrder: 3, blockName: 'excedente',  kwhLimit: null, pricePerKwh: 3.932 },
    ];
    const { blocks, subtotal } = applyBlocks(225, blocksWithLimits);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ blockOrder: 1, kwhConsumed: 100, subtotal: 110.7 });
    expect(blocks[1]).toMatchObject({ blockOrder: 2, kwhConsumed: 125, subtotal: 168.13 });
    expect(subtotal).toBe(278.83);
  });

  it('consumo de 0 kWh -> no se consume ningún bloque y subtotal es 0', () => {
    const blocksWithLimits = [
      { blockOrder: 1, blockName: 'básico',     kwhLimit: 100,  pricePerKwh: 1.107 },
      { blockOrder: 2, blockName: 'intermedio', kwhLimit: 125,  pricePerKwh: 1.345 },
      { blockOrder: 3, blockName: 'excedente',  kwhLimit: null, pricePerKwh: 3.932 },
    ];
    const { blocks, subtotal } = applyBlocks(0, blocksWithLimits);
    expect(blocks).toHaveLength(0);
    expect(subtotal).toBe(0);
  });
});
