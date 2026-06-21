import prisma from '../../config/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { buildInitialMessage } from './messages.js';
import { agentLoop } from './agentLoop.js';

export async function runAgent(contractId, userId) {
  const contract = await prisma.energyContract.findFirst({
    where: { id: contractId, userId },
    include: { tariff: { select: { type: true } } },
  });
  if (!contract) throw new AppError('Contrato no encontrado', 404);

  const messages = [buildInitialMessage(contractId, contract)];
  return agentLoop(messages, contractId, userId);
}
