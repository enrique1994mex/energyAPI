import express from "express";
import userRoutes from "./routes/user.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/api/users", userRoutes);

// middleware de errores (siempre al final)
app.use(errorMiddleware);

export default app;