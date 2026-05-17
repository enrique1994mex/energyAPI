import prisma from "../config/prisma.js";
import { AppError } from "../errors/AppError.js";

const CONTRACT_SELECT = {
  id: true,
  contractName: true,
  meterNumber: true,
  city: true,
  isActive: true,
  createdAt: true,
  tariff: { select: { id: true, type: true } },
};

export const getContractsByUser = async (userId) => {
  return prisma.energyContract.findMany({
    where: { userId },
    select: CONTRACT_SELECT,
  });
};

export const getContractById = async (contractId, userId) => {
  const contract = await prisma.energyContract.findFirst({
    where: { id: contractId, userId },
    select: CONTRACT_SELECT,
  });

  if (!contract) throw new AppError("Contrato no encontrado", 404);
  return contract;
};

export const createContract = async (userId, contractData) => {
  const { contractName, meterNumber, city, tariffId } = contractData;

  const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
  if (!tariff) throw new AppError("Tarifa no encontrada", 404);

  return prisma.energyContract.create({
    data: { contractName, meterNumber, city, userId, tariffId },
    select: CONTRACT_SELECT,
  });
};

export const updateContract = async (contractId, userId, updateData) => {
  const { contractName, meterNumber, city, tariffId, isActive } = updateData;

  const existingContract = await prisma.energyContract.findFirst({
    where: { id: contractId, userId },
  });
  if (!existingContract) throw new AppError("Contrato no encontrado", 404);

  if (tariffId) {
    const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
    if (!tariff) throw new AppError("Tarifa no encontrada", 404);
  }

  return prisma.energyContract.update({
    where: { id: contractId },
    data: { contractName, meterNumber, city, tariffId, isActive },
    select: CONTRACT_SELECT,
  });
};

export const deleteContract = async (contractId, userId) => {
  const existingContract = await prisma.energyContract.findFirst({
    where: { id: contractId, userId },
  });
  if (!existingContract) throw new AppError("Contrato no encontrado", 404);

  await prisma.energyContract.delete({ where: { id: contractId } });
};
