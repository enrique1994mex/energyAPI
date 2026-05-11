import * as contractService from "../services/contract.service.js";
import { createContractSchema, updateContractSchema } from "../schemas/contract.schema.js";
import { AppError } from "../errors/AppError.js";
import { parseId } from "../utils/parseId.js";

export const getContracts = async (req, res, next) => {
  try {
    const contracts = await contractService.getContractsByUser(req.user.id);
    res.json(contracts);
  } catch (error) {
    next(error);
  }
};

export const getContract = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const contract = await contractService.getContractById(id, req.user.id);
    res.json(contract);
  } catch (error) {
    next(error);
  }
};

export const createContract = async (req, res, next) => {
  try {
    const contractData = createContractSchema.parse(req.body);
    const newContract = await contractService.createContract(req.user.id, contractData);
    res.status(201).json(newContract);
  } catch (error) {
    next(error);
  }
};

export const updateContract = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const contractData = updateContractSchema.parse(req.body);
    const updatedContract = await contractService.updateContract(id, req.user.id, contractData);
    res.json(updatedContract);
  } catch (error) {
    next(error);
  }
};

export const deleteContract = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await contractService.deleteContract(id, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};