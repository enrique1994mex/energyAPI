import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Catálogo de tarifas ──────────────────────────────────────────────────────
const TARIFFS = [
  { type: '1',  summerStartMonth: null, summerEndMonth: null },
  { type: '1A', summerStartMonth: 5,    summerEndMonth: 10   },
  { type: '1B', summerStartMonth: 5,    summerEndMonth: 10   },
  { type: '1C', summerStartMonth: 5,    summerEndMonth: 10   },
  { type: '1D', summerStartMonth: 4,    summerEndMonth: 10   },
  { type: '1E', summerStartMonth: 3,    summerEndMonth: 10   },
  { type: '1F', summerStartMonth: 3,    summerEndMonth: 10   },
];

// ── Mapeo ciudad → tarifa ────────────────────────────────────────────────────
const CITY_TARIFFS = [
  { city: 'Ciudad de México', tariffType: '1'  },
  { city: 'Puebla',           tariffType: '1'  },
  { city: 'Monterrey',        tariffType: '1A' },
  { city: 'San Luis Potosí',  tariffType: '1A' },
  { city: 'Tampico',          tariffType: '1B' },
  { city: 'Culiacán',         tariffType: '1B' },
  { city: 'Hermosillo',       tariffType: '1C' },
  { city: 'Chihuahua',        tariffType: '1C' },
  { city: 'Mérida',           tariffType: '1D' },
  { city: 'Campeche',         tariffType: '1D' },
  { city: 'Cancún',           tariffType: '1D' },
  { city: 'Veracruz',         tariffType: '1D' },
  { city: 'Villahermosa',     tariffType: '1E' },
  { city: 'Tapachula',        tariffType: '1E' },
  { city: 'Acapulco',         tariffType: '1F' },
  { city: 'Colima',           tariffType: '1F' },
];

// ── Usuarios por defecto ─────────────────────────────────────────────────────
const DEFAULT_USERS = [
  { email: 'admin@example.com', password: 'Admin123!', role: 'ADMIN' },
  { email: 'demo@example.com',  password: 'Demo123!',  role: 'USER'  },
];

// ── Funciones de seed ────────────────────────────────────────────────────────

async function seedTariffs() {
  for (const data of TARIFFS) {
    await prisma.tariff.upsert({
      where: { type: data.type },
      create: data,
      update: {
        summerStartMonth: data.summerStartMonth,
        summerEndMonth: data.summerEndMonth,
      },
    });
  }

  console.log(`Upserted ${TARIFFS.length} tariffs.`);
}

async function seedCityTariffs() {
  for (const { city, tariffType } of CITY_TARIFFS) {
    const tariff = await prisma.tariff.findUnique({
      where: { type: tariffType },
    });

    await prisma.cityTariff.upsert({
      where: { city },
      create: {
        city,
        tariffId: tariff.id,
      },
      update: {
        tariffId: tariff.id,
      },
    });
  }

  console.log(`Upserted ${CITY_TARIFFS.length} city-tariff mappings.`);
}

async function seedT1DRates2026() {
  const tariff = await prisma.tariff.findUnique({
    where: { type: '1D' },
  });

  const SUMMER_MONTHS_T1D = new Set([4, 5, 6, 7, 8, 9, 10]);

  for (let month = 1; month <= 12; month++) {

    // Registro NON-SUMMER
    await prisma.tariffMonthlyRate.upsert({
      where: {
        tariffId_month_year_isSummer: {
          tariffId: tariff.id,
          month,
          year: 2026,
          isSummer: false,
        },
      },
      create: {
        tariffId: tariff.id,
        month,
        year: 2026,
        isSummer: false,
        fixedCharge: 0,
      },
      update: {},
    });

    // Registro SUMMER
    if (SUMMER_MONTHS_T1D.has(month)) {
      await prisma.tariffMonthlyRate.upsert({
        where: {
          tariffId_month_year_isSummer: {
            tariffId: tariff.id,
            month,
            year: 2026,
            isSummer: true,
          },
        },
        create: {
          tariffId: tariff.id,
          month,
          year: 2026,
          isSummer: true,
          fixedCharge: 0,
        },
        update: {},
      });
    }
  }

  console.log('Upserted T1D 2026 monthly rates (without blocks).');
}

async function seedUsers() {
  for (const { email, password, role } of DEFAULT_USERS) {
    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { email },
      update: { role },
      create: {
        email,
        password: hashed,
        role,
      },
    });
  }

  console.log(`Upserted ${DEFAULT_USERS.length} users.`);
}

// ── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...');

  await seedTariffs();
  await seedCityTariffs();
  await seedT1DRates2026();
  await seedUsers();

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());