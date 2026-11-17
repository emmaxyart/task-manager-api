
import "dotenv/config";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import taskRoutes from "./routes/task.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { swaggerDocument, swaggerUi } from "./docs/swagger.js";

const app = express();

// Security headers
app.use(helmet());

// CORS: CLIENT_URL accepts a comma-separated list of allowed frontend origins.
// Production allows nothing until origins are explicitly configured.
const configuredOrigins = (process.env.CLIENT_URL ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins =
  configuredOrigins.length > 0
    ? configuredOrigins
    : process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins.includes("*")
      ? "*"
      : allowedOrigins.length > 0
        ? allowedOrigins
        : false,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

app.use(limiter);

// Parse JSON request bodies
app.use(express.json());

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);

// Welcome route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Task Manager API",
    version: "1.0.0",
  });
});

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Task routes
app.use("/api/tasks", taskRoutes);

// Centralized error handler (keep last)
app.use(errorHandler);

export default app;
