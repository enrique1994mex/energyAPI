import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const defaultTariffs = [
  { name: 'Tarifa 1',   city: 'Ciudad de México', pricePerKwh: 0.793, fixedCharge: 0 },
  { name: 'Tarifa 1A',  city: 'Monterrey',         pricePerKwh: 0.880, fixedCharge: 0 },
  { name: 'Tarifa 1B',  city: 'Guadalajara',        pricePerKwh: 0.960, fixedCharge: 0 },
  { name: 'Tarifa 1C',  city: 'Hermosillo',         pricePerKwh: 1.162, fixedCharge: 0 },
  { name: 'Tarifa DAC', city: 'Ciudad de México',   pricePerKwh: 5.202, fixedCharge: 0 },
  { name: 'Tarifa 2',   city: 'Ciudad de México',   pricePerKwh: 3.450, fixedCharge: 125.0 },
];

const defaultUsers = [
  { email: 'admin@example.com',  password: 'Admin123!' },
  { email: 'demo@example.com',   password: 'Demo123!'  },
];

async function main() {
  console.log('Seeding database...');

  // Tariffs — only insert if the table is empty
  const tariffCount = await prisma.tariff.count();
  if (tariffCount === 0) {
    await prisma.tariff.createMany({ data: defaultTariffs });
    console.log(`Created ${defaultTariffs.length} tariffs.`);
  } else {
    console.log(`Tariffs already exist (${tariffCount}), skipping.`);
  }

  // Users — upsert by email so running the seed twice is safe
  for (const { email, password } of defaultUsers) {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where:  { email },
      update: {},
      create: { email, password: hashed },
    });
  }
  console.log(`Upserted ${defaultUsers.length} users.`);

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
