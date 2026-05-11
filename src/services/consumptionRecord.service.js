import prisma from "../config/prisma.js";
import { AppError } from "../errors/AppError.js";

const verifyContractOwnership = async (contractId, userId) => {
  const contract = await prisma.energyContract.findFirst({
    where: { id: contractId, userId },
  });
  if (!contract) throw new AppError("Contract not found or not accessible", 404);
};

export const getConsumptionRecordsByContract = async (contractId, userId) => {
  await verifyContractOwnership(contractId, userId);

  return prisma.consumptionRecord.findMany({
    where: { contractId },
  });
};

export const getConsumptionRecordById = async (recordId, contractId, userId) => {
  await verifyContractOwnership(contractId, userId);

  const record = await prisma.consumptionRecord.findFirst({
    where: { id: recordId, contractId },
  });

  if (!record) throw new AppError("Consumption record not found", 404);
  return record;
};

export const createConsumptionRecord = async (contractId, userId, recordData) => {
  await verifyContractOwnership(contractId, userId);

  return prisma.consumptionRecord.create({
    data: { ...recordData, contractId },
  });
};

export const updateConsumptionRecord = async (recordId, contractId, userId, updateData) => {
  await verifyContractOwnership(contractId, userId);

  const existing = await prisma.consumptionRecord.findFirst({
    where: { id: recordId, contractId },
  });
  if (!existing) throw new AppError("Consumption record not found", 404);

  return prisma.consumptionRecord.update({
    where: { id: recordId },
    data: updateData,
  });
};

export const deleteConsumptionRecord = async (recordId, contractId, userId) => {
  await verifyContractOwnership(contractId, userId);

  const existing = await prisma.consumptionRecord.findFirst({
    where: { id: recordId, contractId },
  });
  if (!existing) throw new AppError("Consumption record not found", 404);

  return prisma.consumptionRecord.delete({ where: { id: recordId } });
};
