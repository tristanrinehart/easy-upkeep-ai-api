// src/routers/item.router.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listItems, listItemsAndTasks, createItem, deleteItem } from "../controllers/item.controller.js";

export const itemRouter = Router();

// Specific route first
itemRouter.get("/items-and-tasks", requireAuth, listItemsAndTasks);

// Base CRUD
itemRouter.get("/", requireAuth, listItems);
itemRouter.post("/", requireAuth, createItem);
itemRouter.delete("/:id", requireAuth, deleteItem);
