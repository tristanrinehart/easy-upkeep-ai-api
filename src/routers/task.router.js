// src/routers/task.router.js

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listTasksByItem } from "../controllers/task.controller.js";

export const taskRouter = Router();

taskRouter.get("/item/:itemId", requireAuth, listTasksByItem);