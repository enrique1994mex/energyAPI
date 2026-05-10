import prisma from "../config/prisma.js";
import { AppError } from "../errors/AppError.js";

export const getContractsByUser = async (userId) => {
  return prisma.energyContract.findMany({
    where: { userId },
    select: {
      id: true,
      contractName: true,
      meterNumber: true,
      isActive: true,
      createdAt: true,
      tariff: {
        select: {
          id: true,
          name: true,
          city: true,
          pricePerKwh: true,
          fixedCharge: true,
        },
      },
    },
  });
};

export const getContractById = async (contractId, userId) => {
  const contract = await prisma.energyContract.findFirst({
    where: { id: contractId, userId },
    select: {
      id: true,
      contractName: true,
      meterNumber: true,
      isActive: true,
      createdAt: true,
      tariff: {
        select: {
          id: true,
          name: true,
          city: true,
          pricePerKwh: true,
          fixedCharge: true,
        },
      },
    },
  });

  if (!contract) {
    throw new AppError("Contrato no encontrado", 404);
  }
  return contract;
};

export const createContract = async (userId, contractData) => {
  const { contractName, meterNumber, tariffId } = contractData;

  // Validar que la tarifa exista
  const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
  if (!tariff) {
    throw new AppError("Tarifa no encontrada", 404);
  }

  // Crear el contrato
  return prisma.energyContract.create({
    data: {
      contractName,
      meterNumber,
      userId,
      tariffId,
    },
    select: {
      id: true,
      contractName: true,
      meterNumber: true,
      isActive: true,
      createdAt: true,
      tariff: {
        select: {
          id: true,
          name: true,
          city: true,
          pricePerKwh: true,
          fixedCharge: true,
        },
      },
    },
  });
};

export const updateContract = async (contractId, userId, updateData) => {
  const { contractName, meterNumber, tariffId, isActive } = updateData;

  // Validar que el contrato exista y pertenezca al usuario
  const existingContract = await prisma.energyContract.findFirst({
    where: { id: contractId, userId },
  });
  if (!existingContract) {
    throw new AppError("Contrato no encontrado", 404);
  }

  // Si se proporciona una nueva tarifa, validar que exista
  if (tariffId) {
    const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
    if (!tariff) {
      throw new AppError("Tarifa no encontrada", 404);
    }
  }

  // Actualizar el contrato
  return prisma.energyContract.update({
    where: { id: contractId },
    data: {
      contractName,
      meterNumber,
      tariffId,
      isActive,
    },
    select: {
      id: true,
      contractName: true,
      meterNumber: true,
      isActive: true,
      createdAt: true,
      tariff: {
        select: {
          id: true,
          name: true,
          city: true,
          pricePerKwh: true,
          fixedCharge: true,
        },
      },
    },
  });
};

export const deleteContract = async (contractId, userId) => {
  // Validar que el contrato exista y pertenezca al usuario
  const existingContract = await prisma.energyContract.findFirst({
    where: { id: contractId, userId },
  });
  if (!existingContract) {
    throw new AppError("Contrato no encontrado", 404);
  }

  // Eliminar el contrato
  await prisma.energyContract.delete({ where: { id: contractId } });
};
