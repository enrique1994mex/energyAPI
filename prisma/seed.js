import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Catálogo de tarifas ──────────────────────────────────────────────────────
const TARIFFS = [
  { type: '1'  },
  { type: '1A' },
  { type: '1B' },
  { type: '1C' },
  { type: '1D' },
  { type: '1E' },
  { type: '1F' },
];

// ── Mapeo ciudad → tarifa ────────────────────────────────────────────────────
// summerStartMonth/summerEndMonth: meses inclusivos del periodo de verano CFE (null = sin verano).
// T1D: verano abril–septiembre (confirmado por T1D_RATES del seed).
const CITY_TARIFFS = [
  { city: 'Ciudad de México', tariffType: '1',  summerStartMonth: null, summerEndMonth: null },
  { city: 'Puebla',           tariffType: '1',  summerStartMonth: null, summerEndMonth: null },
  { city: 'Monterrey',        tariffType: '1A', summerStartMonth: null, summerEndMonth: null },
  { city: 'San Luis Potosí',  tariffType: '1A', summerStartMonth: null, summerEndMonth: null },
  { city: 'Tampico',          tariffType: '1B', summerStartMonth: null, summerEndMonth: null },
  { city: 'Culiacán',         tariffType: '1B', summerStartMonth: null, summerEndMonth: null },
  { city: 'Hermosillo',       tariffType: '1C', summerStartMonth: null, summerEndMonth: null },
  { city: 'Chihuahua',        tariffType: '1C', summerStartMonth: null, summerEndMonth: null },
  { city: 'Mérida',           tariffType: '1D', summerStartMonth: 4,    summerEndMonth: 9    },
  { city: 'Campeche',         tariffType: '1D', summerStartMonth: 4,    summerEndMonth: 9    },
  { city: 'Cancún',           tariffType: '1D', summerStartMonth: 4,    summerEndMonth: 9    },
  { city: 'Veracruz',         tariffType: '1D', summerStartMonth: 4,    summerEndMonth: 9    },
  { city: 'Villahermosa',     tariffType: '1E', summerStartMonth: null, summerEndMonth: null },
  { city: 'Tapachula',        tariffType: '1E', summerStartMonth: null, summerEndMonth: null },
  { city: 'Acapulco',         tariffType: '1F', summerStartMonth: null, summerEndMonth: null },
  { city: 'Colima',           tariffType: '1F', summerStartMonth: null, summerEndMonth: null },
];

// ── Usuarios por defecto ─────────────────────────────────────────────────────
const DEFAULT_USERS = [
  { email: 'admin@example.com', password: 'Admin123!', role: 'ADMIN' },
  { email: 'demo@example.com',  password: 'Demo123!',  role: 'USER'  },
];

// ── Bloques T1D ──────────────────────────────────────────────────────────────
// Límites mensuales T1D: Básico 0–75 kWh, Intermedio 75–125 kWh (50 adicionales), Excedente 125+ kWh.
// Verano T1D: Básico 0–175 kWh, Intermedio bajo 175–400 kWh, Intermedio alto 400–600 kWh, Excedente 600+ kWh.
// Precios confirmados de recibos reales (enero 2026 y marzo/abril 2026).
// El resto son estimaciones basadas en ajustes mensuales del DOF.
const T1D_RATES = {
  // { year: { month: { nonSummer?: {fixedCharge, blocks}, summer?: {fixedCharge, blocks} } } }
  2025: {
    12: {
      nonSummer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 75,   pricePerKwh: 1.107 },
          { blockOrder: 2, blockName: 'Intermedio', kwhLimit: 125,   pricePerKwh: 1.345 },
          { blockOrder: 3, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 3.932 },
        ],
      },
    },
  },
  2026: {
    1: {
      nonSummer: {
        fixedCharge: 0,
        // Precios confirmados del recibo feb (periodo 18 DIC 25 – 17 FEB 26, mes más completo = enero)
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 75,   pricePerKwh: 1.110 },
          { blockOrder: 2, blockName: 'Intermedio', kwhLimit: 125,   pricePerKwh: 1.349 },
          { blockOrder: 3, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 3.944 },
        ],
      },
    },
    2: {
      nonSummer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 75,   pricePerKwh: 1.113 },
          { blockOrder: 2, blockName: 'Intermedio', kwhLimit: 125,   pricePerKwh: 1.353 },
          { blockOrder: 3, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 3.956 },
        ],
      },
    },
    3: {
      nonSummer: {
        fixedCharge: 0,
        // Precios confirmados del recibo abr (periodo 17 FEB 26 – 17 ABR 26, mes más completo no-verano = marzo)
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 75,   pricePerKwh: 1.116 },
          { blockOrder: 2, blockName: 'Intermedio', kwhLimit: 125,   pricePerKwh: 1.357 },
          { blockOrder: 3, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 3.968 },
        ], 
      },
    },
    4: {
      summer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 175,   pricePerKwh: 1.001 },
          { blockOrder: 2, blockName: 'Intermedio bajo', kwhLimit: 225,   pricePerKwh: 1.159 },
          { blockOrder: 3, blockName: 'Intermedio alto', kwhLimit: 200,   pricePerKwh: 1.49 },
          { blockOrder: 4, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 3.98 },
        ],
      },
    },
    5: {
      summer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 175,  pricePerKwh: 1.004 },
          { blockOrder: 2, blockName: 'Intermedio bajo', kwhLimit: 225,  pricePerKwh: 1.163 },
          { blockOrder: 3, blockName: 'Intermedio alto', kwhLimit: 200,  pricePerKwh: 1.495 },
          { blockOrder: 4, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 3.992 },
        ],
      },
    },
    6: {
      summer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 175,  pricePerKwh: 1.007 },
          { blockOrder: 2, blockName: 'Intermedio bajo', kwhLimit: 225,  pricePerKwh: 1.167 },
          { blockOrder: 3, blockName: 'Intermedio alto', kwhLimit: 200,  pricePerKwh: 1.5 },
          { blockOrder: 4, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 4.004 },
        ],
      },
    },
    7: {
      summer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 175,  pricePerKwh: 1.010 },
          { blockOrder: 2, blockName: 'Intermedio bajo', kwhLimit: 225,  pricePerKwh: 1.171 },
          { blockOrder: 3, blockName: 'Intermedio alto', kwhLimit: 200,  pricePerKwh: 1.505 },
          { blockOrder: 4, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 4.016 },
        ],
      },
    },
    8: {
      summer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 175,  pricePerKwh: 1.013 },
          { blockOrder: 2, blockName: 'Intermedio bajo', kwhLimit: 225,  pricePerKwh: 1.175 },
          { blockOrder: 3, blockName: 'Intermedio alto', kwhLimit: 200,  pricePerKwh: 1.510 },
          { blockOrder: 4, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 4.028 },
        ],
      },
    },
    9: {
      summer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 175,  pricePerKwh: 1.016 },
          { blockOrder: 2, blockName: 'Intermedio bajo', kwhLimit: 225,  pricePerKwh: 1.179 },
          { blockOrder: 3, blockName: 'Intermedio alto', kwhLimit: 200,  pricePerKwh: 1.515 },
          { blockOrder: 4, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 4.041 },
        ],
      },
    },
    10: {
      nonSummer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 75,   pricePerKwh: 1.140 },
          { blockOrder: 2, blockName: 'Intermedio', kwhLimit: 125,   pricePerKwh: 1.385 },
          { blockOrder: 3, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 4.054 },
        ],
      },
    },
    11: {
      nonSummer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 75,   pricePerKwh: 1.144 },
          { blockOrder: 2, blockName: 'Intermedio', kwhLimit: 125,   pricePerKwh: 1.389 },
          { blockOrder: 3, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 4.067 },
        ],
      },
    },
    12: {
      nonSummer: {
        fixedCharge: 0,
        blocks: [
          { blockOrder: 1, blockName: 'Básico',     kwhLimit: 75,   pricePerKwh: 1.148 },
          { blockOrder: 2, blockName: 'Intermedio', kwhLimit: 125,   pricePerKwh: 1.393 },
          { blockOrder: 3, blockName: 'Excedente',  kwhLimit: null, pricePerKwh: 4.080 },
        ],
      },
    },
  },
};

// ── Funciones de seed ────────────────────────────────────────────────────────

async function seedTariffs() {
  for (const data of TARIFFS) {
    await prisma.tariff.upsert({
      where: { type: data.type },
      create: data,
      update: {},
    });
  }

  console.log(`Upserted ${TARIFFS.length} tariffs.`);
}

async function seedCityTariffs() {
  for (const { city, tariffType, summerStartMonth, summerEndMonth } of CITY_TARIFFS) {
    const tariff = await prisma.tariff.findUnique({ where: { type: tariffType } });

    await prisma.cityTariff.upsert({
      where: { city },
      create: { city, tariffId: tariff.id, summerStartMonth, summerEndMonth },
      update: { tariffId: tariff.id, summerStartMonth, summerEndMonth },
    });
  }

  console.log(`Upserted ${CITY_TARIFFS.length} city-tariff mappings.`);
}

async function seedT1DRatesWithBlocks() {
  const tariff = await prisma.tariff.findUnique({ where: { type: '1D' } });

  let ratesUpserted = 0;
  let blocksUpserted = 0;

  for (const [yearStr, months] of Object.entries(T1D_RATES)) {
    const year = parseInt(yearStr);

    for (const [monthStr, seasons] of Object.entries(months)) {
      const month = parseInt(monthStr);

      for (const [seasonKey, data] of Object.entries(seasons)) {
        const isSummer = seasonKey === 'summer';

        const rate = await prisma.tariffMonthlyRate.upsert({
          where: {
            tariffId_month_year_isSummer: { tariffId: tariff.id, month, year, isSummer },
          },
          create: { tariffId: tariff.id, month, year, isSummer, fixedCharge: data.fixedCharge },
          update: { fixedCharge: data.fixedCharge },
        });

        ratesUpserted++;

        for (const block of data.blocks) {
          await prisma.tariffBlock.upsert({
            where: {
              tariffMonthlyRateId_blockOrder: {
                tariffMonthlyRateId: rate.id,
                blockOrder: block.blockOrder,
              },
            },
            create: { ...block, tariffMonthlyRateId: rate.id },
            update: { kwhLimit: block.kwhLimit, pricePerKwh: block.pricePerKwh, blockName: block.blockName },
          });
          blocksUpserted++;
        }
      }
    }
  }

  console.log(`Upserted ${ratesUpserted} T1D monthly rates and ${blocksUpserted} blocks.`);
}

async function seedUsers() {
  for (const { email, password, role } of DEFAULT_USERS) {
    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { email },
      update: { role },
      create: { email, password: hashed, role },
    });
  }

  console.log(`Upserted ${DEFAULT_USERS.length} users.`);
}

// ── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...');

  await seedTariffs();
  await seedCityTariffs();
  await seedT1DRatesWithBlocks();
  await seedUsers();

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
