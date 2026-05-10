import { Router } from "express";
import { getContracts, getContract, createContract, updateContract, deleteContract } from "../controllers/contract.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getContracts);
router.get("/:id", getContract);
router.post("/", createContract);
router.put("/:id", updateContract);
router.delete("/:id", deleteContract);

export default router;