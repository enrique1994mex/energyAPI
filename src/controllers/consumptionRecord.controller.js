import * as consumptionRecordService from '../services/consumptionRecord.service.js';
import { createConsumptionRecordSchema, updateConsumptionRecordSchema } from '../schemas/consumptionRecord.schema.js';
import { AppError } from '../errors/AppError.js';
import { parseId } from '../utils/parseId.js';

export const getConsumptionRecords = async (req, res, next) => {
  try {
    const contractId = parseId(req.params.contractId);
    const userId = req.user.id;
    const records = await consumptionRecordService.getConsumptionRecordsByContract(contractId, userId);
    res.json(records);
  } catch (error) {
    next(error);
  }
};

export const getConsumptionRecord = async (req, res, next) => {
  try {
    const contractId = parseId(req.params.contractId);
    const recordId = parseId(req.params.recordId);
    const userId = req.user.id;
    const record = await consumptionRecordService.getConsumptionRecordById(recordId, contractId, userId);
    res.json(record);
  } catch (error) {
    next(error);
  }
};

export const createConsumptionRecord = async (req, res, next) => {
  try {
    const contractId = parseId(req.params.contractId);
    const userId = req.user.id;
    const recordData = createConsumptionRecordSchema.parse(req.body);
    const newRecord = await consumptionRecordService.createConsumptionRecord(contractId, userId, recordData);
    res.status(201).json(newRecord);
  } catch (error) {
    next(error);
  }
};

export const updateConsumptionRecord = async (req, res, next) => {
  try {
    const contractId = parseId(req.params.contractId);
    const recordId = parseId(req.params.recordId);
    const userId = req.user.id;
    const recordData = updateConsumptionRecordSchema.parse(req.body);
    const updatedRecord = await consumptionRecordService.updateConsumptionRecord(recordId, contractId, userId, recordData);
    res.json(updatedRecord);
  } catch (error) {
    next(error);
  }
};

export const deleteConsumptionRecord = async (req, res, next) => {
  try {
    const contractId = parseId(req.params.contractId);
    const recordId = parseId(req.params.recordId);
    const userId = req.user.id;
    await consumptionRecordService.deleteConsumptionRecord(recordId, contractId, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
