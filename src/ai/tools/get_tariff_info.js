import prisma from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';

export const schema = {
  name: 'get_tariff_info',
  description:
    'Returns rate blocks and prices for a CFE tariff type. Useful to understand the tier structure (básico, intermedio, excedente) and their kWh limits.',
  input_schema: {
    type: 'object',
    properties: {
      tariffType: {
        type: 'string',
        description: 'CFE tariff type. One of: "1", "1A", "1B", "1C", "1D", "1E", "1F", "DAC"',
      },
    },
    required: ['tariffType'],
  },
};

export async function handler({ tariffType }) {
  const tariff = await prisma.tariff.findUnique({
    where: { type: tariffType },
    include: {
      monthlyRates: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 2,
        include: { blocks: { orderBy: { blockOrder: 'asc' } } },
      },
    },
  });
  if (!tariff) throw new AppError(`Tarifa "${tariffType}" no encontrada`, 404);
  return tariff;
}
