// src/routers/index.router.js
// Aggregates all API routers and exports a named `apiRouter`
// so server.js can `import { apiRouter } from "./routers/index.router.js"`

import { Router } from "express";
import { authRouter } from "./auth.router.js";
import { itemRouter } from "./item.router.js";
import { taskRouter } from "./task.router.js";

export const apiRouter = Router();

// Simple health check
apiRouter.get("/health", (req, res) => {
  res.setHeader("x-request-id", req.id || "");
  res.json({ ok: true, "x-request-id": req.id || "" });
});

// Mount feature routers under /api/*
apiRouter.use("/auth", authRouter);
apiRouter.use("/items", itemRouter);
apiRouter.use("/tasks", taskRouter);

// 404 for unknown API routes (keeps rich body for fast iteration)
apiRouter.use((req, res) => {
  res.status(404).json({
    message: "Not found",
    path: req.baseUrl + req.path,
    "x-request-id": req.id || "",
  });
});
