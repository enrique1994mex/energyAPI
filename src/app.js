import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import contractRoutes from "./routes/contract.routes.js";
import consumptionRecordRoutes from "./routes/consumptionRecord.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/contracts/:contractId/consumption-records", consumptionRecordRoutes);

// middleware de errores (siempre al final)
app.use(errorMiddleware);

export default app;