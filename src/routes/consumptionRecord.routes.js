import { Router } from "express";
import { getConsumptionRecords, getConsumptionRecord, createConsumptionRecord, updateConsumptionRecord, deleteConsumptionRecord } from "../controllers/consumptionRecord.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", getConsumptionRecords);
router.get("/:recordId", getConsumptionRecord);
router.post("/", createConsumptionRecord);
router.put("/:recordId", updateConsumptionRecord);
router.delete("/:recordId", deleteConsumptionRecord);

export default router;
