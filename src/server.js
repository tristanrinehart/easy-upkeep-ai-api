/**
 * server.js
 * - Express app listening on port 6700 (6000-7000 range).
 * - Environment-aware: NODE_ENV controls security settings.
 * - CSRF-safe auth: same-site Lax cookies on same domain; or Authorization header.
 * - Adds request ID (x-request-id) and surfaces it in logs and responses.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiRouter } from "./routers/index.router.js";
import { getEnv } from "./config/env.js";

const app = express();
const env = getEnv();

// Secure defaults; allow same-site cookie usage on same domain (Render deploy front+api).
app.set("trust proxy", true);
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN, // e.g., https://your-domain.com or http://localhost:6600
  credentials: true
}));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request ID + logging
app.use(requestId());
app.use(morgan((tokens, req, res) => {
  return [
    `[backend] ${tokens.method(req, res)} ${tokens.url(req, res)}`,
    tokens.status(req, res),
    tokens["response-time"](req, res), "ms",
    `x-request-id=${req.id}`
  ].join(" ");
}));

// Connect Mongo
mongoose.connect(env.MONGO_URI).then(() => {
  console.log("[backend] connected to Mongo");
}).catch((err) => {
  console.error("[backend] Mongo connection error", err);
  process.exit(1);
});

// Mount API
app.use("/api", apiRouter);

// 404 + error
app.use(notFound);
app.use(errorHandler);

const port = Number(env.PORT || 6500);
app.listen(port, () => {
  console.log(`[backend] listening on ${port}`);
});