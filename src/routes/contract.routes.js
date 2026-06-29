import { Router } from "express";
import { getAllContracts, getContracts, getContract, createContract, updateContract, deleteContract } from "../controllers/contract.controller.js";
import { getContractInsights } from "../controllers/ai.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getContracts);
router.get("/all", requireRole("ADMIN"), getAllContracts);
router.get("/:id", getContract);
router.get("/:id/ai-insights", getContractInsights);
router.post("/", createContract);
router.put("/:id", updateContract);
router.delete("/:id", deleteContract);

export default router;