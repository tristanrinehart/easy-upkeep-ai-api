// src/controllers/item.controller.js
// Fast create (background OpenAI generation), list items, list items AND tasks, delete.

import { Item } from "../models/item.model.js";
import { Task } from "../models/task.model.js";
import { getEnv } from "../config/env.js";
import { generateTasksForItem } from "./openai.controller.js";

const env = getEnv();

// Compute [startUtc, endUtc] for "today" in the user's local timezone.
function localMidnightRange(tzOffsetMinutes) {
  const now = new Date();
  const localMs = now.getTime() - tzOffsetMinutes * 60_000;
  const local = new Date(localMs);
  const startLocal = new Date(local.getFullYear(), local.getMonth(), local.getDate(), 0, 0, 0, 0);
  const endLocal = new Date(local.getFullYear(), local.getMonth(), local.getDate() + 1, 0, 0, 0, 0);
  return {
    startUtc: new Date(startLocal.getTime() + tzOffsetMinutes * 60_000),
    endUtc: new Date(endLocal.getTime() + tzOffsetMinutes * 60_000),
  };
}

async function dailyTaskCount(userId, tzOffsetMinutes) {
  const { startUtc, endUtc } = localMidnightRange(tzOffsetMinutes);
  return Task.countDocuments({
    userId: String(userId),
    createdAt: { $gte: startUtc, $lt: endUtc },
  });
}

// GET /api/items
export async function listItems(req, res, next) {
  try {
    const items = await Item.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.setHeader("x-request-id", req.id);
    return res.json({ items, "x-request-id": req.id });
  } catch (e) {
    res.setHeader("x-request-id", req.id);
    return next(e);
  }
}

// GET /api/items/items-and-tasks
export async function listItemsAndTasks(req, res, next) {
  try {
    const userId = String(req.user.id);
    const items = await Item.find({ userId }).sort({ createdAt: -1 }).lean();
    const itemIds = items.map((i) => String(i._id));

    let tasksByItem = {};
    if (itemIds.length > 0) {
      const tasks = await Task.find({ userId, itemId: { $in: itemIds } })
        .sort({ priority: 1, createdAt: 1 })
        .lean();

      tasksByItem = tasks.reduce((acc, t) => {
        const k = String(t.itemId);
        if (!acc[k]) acc[k] = [];
        acc[k].push(t);
        return acc;
      }, {});
    }

    const itemsWithTasks = items.map((i) => ({
      ...i,
      tasks: tasksByItem[String(i._id)] || [],
    }));

    res.setHeader("x-request-id", req.id);
    return res.json({ items: itemsWithTasks, "x-request-id": req.id });
  } catch (e) {
    res.setHeader("x-request-id", req.id);
    return next(e);
  }
}

// POST /api/items
export async function createItem(req, res, next) {
  const rid = req.id;
  try {
    const { name, model } = req.body || {};
    const tzOffset = Number(req.headers["x-tz-offset"] || "0");

    if (!name || typeof name !== "string") {
      res.setHeader("x-request-id", rid);
      return res.status(400).json({
        message: "Validation error",
        details: [{ field: "name", message: "name is required" }],
        "x-request-id": rid,
      });
    }

    // 1) Create item quickly
    const item = await Item.create({
      userId: req.user.id,
      name: name.trim(),
      model: (model || "").trim(),
      genStatus: "pending",
      genUpdatedAt: new Date(),
      genError: null,
    });

    console.log("[items] create saved", { rid, itemId: String(item._id) });

    // 2) Respond immediately
    res.setHeader("x-request-id", rid);
    res.status(201).json({
      item,
      banner: null,
      generationMode: "background",
      "x-request-id": rid,
    });

    // 3) Background generation once
    const userSnapshot = { id: req.user.id, email: req.user.email };
    setImmediate(async () => {
      console.log("[items] bg gen start", {
        rid,
        itemId: String(item._id),
        userId: String(userSnapshot.id),
      });

      try {
        const fresh = await Item.findById(item._id).lean();
        if (!fresh || fresh.genStatus !== "pending") {
          console.log("[items] bg gen abort: status changed", {
            rid,
            itemId: String(item._id),
            genStatus: fresh?.genStatus,
          });
          return;
        }

        const already = await dailyTaskCount(userSnapshot.id, tzOffset);
        const remaining = Math.max(0, env.DAILY_TASK_LIMIT - already);
        if (remaining <= 0) {
          await Item.updateOne(
            { _id: item._id },
            {
              $set: {
                genStatus: "failed",
                genUpdatedAt: new Date(),
                genError: `Daily task generation limit (${env.DAILY_TASK_LIMIT}) reached. Resets at local midnight.`,
              },
            }
          );
          console.log("[items] bg gen skipped due to cap", { rid, itemId: String(item._id) });
          return;
        }

        const gen = await generateTasksForItem({ user: userSnapshot, item });
        const toInsert = (gen.tasks || []).slice(0, remaining);
        if (toInsert.length > 0) {
          await Task.insertMany(toInsert);
        }

        await Item.updateOne(
          { _id: item._id },
          { $set: { genStatus: "ready", genUpdatedAt: new Date(), genError: null } }
        );

        console.log("[items] bg gen success", {
          rid,
          itemId: String(item._id),
          inserted: toInsert.length,
        });
      } catch (err) {
        await Item.updateOne(
          { _id: item._id },
          {
            $set: {
              genStatus: "failed",
              genUpdatedAt: new Date(),
              genError: String(err?.message || err).slice(0, 500),
            },
          }
        );
        console.error("[items] bg gen error", { rid, err });
      } finally {
        console.log("[items] bg gen cleared schedule", {
          rid,
          itemId: String(item._id),
        });
      }
    });
  } catch (e) {
    res.setHeader("x-request-id", req.id);
    return next(e);
  }
}

// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    const { id } = req.params;
    await Task.deleteMany({ itemId: id, userId: req.user.id });
    await Item.deleteOne({ _id: id, userId: req.user.id });
    res.setHeader("x-request-id", req.id);
    return res.json({ ok: true, "x-request-id": req.id });
  } catch (e) {
    res.setHeader("x-request-id", req.id);
    return next(e);
  }
}
