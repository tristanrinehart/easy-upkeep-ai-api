// src/controllers/task.controller.js
// Long-poll aware tasks endpoint: returns tasks immediately if present;
// otherwise, waits up to ~45s for background generator to finish.
// If generation failed for the item, returns 409 with the error.

import { Task } from "../models/task.model.js";
import { Item } from "../models/item.model.js";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// GET /api/tasks/item/:itemId?wait=1
export async function listTasksByItem(req, res, next) {
  const rid = req.id || "";
  const userId = String(req.user.id);
  const itemId = String(req.params.itemId || "");

  // helper to set header + body consistently
  function send(status, body) {
    res.setHeader("x-request-id", rid);
    return res.status(status).json({ ...body, "x-request-id": rid });
  }

  try {
    // 0) Validate ownership
    const item = await Item.findOne({ _id: itemId, userId }).lean();
    if (!item) return send(404, { message: "Item not found" });

    // 1) Return tasks immediately if present
    const tasksNow = await Task.find({ userId, itemId }).sort({ priority: 1, createdAt: 1 }).lean();
    if (tasksNow.length > 0) return send(200, { tasks: tasksNow });

    // 2) If no tasks and no wait requested, reflect current status quickly
    const doWait = String(req.query.wait || "").trim() === "1";
    if (!doWait) {
      if (item.genStatus === "failed") {
        return send(409, { message: "generation_failed", error: item.genError || "Task generation failed." });
      }
      // still pending or unknown -> tell client to try again later
      return send(202, { pending: true });
    }

    // 3) Long-poll loop (up to ~45s)
    const start = Date.now();
    const timeoutMs = 45_000;
    const intervalMs = 800;

    // re-check status & tasks periodically
    while (Date.now() - start < timeoutMs) {
      // refresh item status in case generator finished/failed
      const fresh = await Item.findById(itemId).lean();
      if (!fresh) return send(404, { message: "Item deleted" });

      if (fresh.genStatus === "failed") {
        return send(409, { message: "generation_failed", error: fresh.genError || "Task generation failed." });
      }

      const tasks = await Task.find({ userId, itemId }).sort({ priority: 1, createdAt: 1 }).lean();
      if (tasks.length > 0) return send(200, { tasks });

      await sleep(intervalMs);
    }

    // 4) Timed out — tell client to poll again
    return send(202, { pending: true });
  } catch (err) {
    res.setHeader("x-request-id", rid);
    return next(err);
  }
}
