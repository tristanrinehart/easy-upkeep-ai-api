// src/controllers/openai.controller.js
// OpenAI Structured Outputs (JSON Schema) with Ajv 2020-12 strict validation.
// NO parsing/coercion: the model must return the exact fields/types defined in the schema.

import OpenAI from "openai";
import Ajv from "ajv/dist/2020.js"; // match $schema: 2020-12
import addFormats from "ajv-formats";
import { getEnv } from "../config/env.js";
import { maintenanceTaskResponseSchema } from "../openai/taskPrompt.schema.js";
import { taskPrompt } from "../openai/taskPrompt.js";

const env = getEnv();
if (!env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment.");
}

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ---------- Ajv (strict) ----------
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validatePlan = ajv.compile(maintenanceTaskResponseSchema());

// ---------- OpenAI Responses call (SDK or fetch fallback) ----------
async function callOpenAIWithStructuredJson({ prompt, assets }) {
  const input = `${prompt}\n\nAssets:\n${JSON.stringify(assets, null, 2)}`;
  const schema = maintenanceTaskResponseSchema();

  // IMPORTANT: the Responses API expects schema at text.format.schema (with name & type)
  const body = {
    model: env.OPENAI_MODEL || "gpt-4.1-mini",
    input,
    temperature: 0.2,
    text: {
      format: {
        type: "json_schema",
        name: "maintenance_task_plan",
        schema,        // <-- required here
        // Keep wire-level permissive; our local Ajv enforces strict shape
        strict: false,
      },
    },
  };

  // Prefer SDK if available
  if (client?.responses?.create) {
    const resp = await client.responses.create(body);
    return extractStructuredJson(resp);
  }

  // Fallback: raw HTTP call (older SDKs)
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    const err = new Error(`OpenAI HTTP ${r.status}`);
    err.code = "openai_http_error";
    err.details = txt.slice(0, 4000);
    throw err;
  }

  const json = await r.json();
  return extractStructuredJson(json);
}

// Extract JSON text from Responses API result (SDK or raw)
function extractStructuredJson(resp) {
  if (typeof resp?.output_text === "string" && resp.output_text.trim()) {
    return JSON.parse(resp.output_text.trim());
  }
  const parts = resp?.output?.flatMap((o) => o?.content ?? []) ?? [];
  const joined = parts
    .filter((c) => c?.type === "output_text" && typeof c?.text === "string")
    .map((c) => c.text)
    .join("")
    .trim();
  if (joined) return JSON.parse(joined);

  const err = new Error("OpenAI returned empty output.");
  err.code = "openai_empty";
  throw err;
}

// ---------- Public API ----------
/**
 * Ask OpenAI for a task plan for this item, validate strictly, and pass-through to DB shape.
 * Returns: { tasks: Task[], generationMode: 'openai' }
 */
export async function generateTasksForItem({ user, item }) {
  const assets = [
    {
      maintenanceItemId: String(item._id || item.id),
      maintenanceItemName: String(item.name),
      ...(item.model ? { model: String(item.model) } : {}),
    },
  ];

  let structured;
  try {
    structured = await callOpenAIWithStructuredJson({ prompt: taskPrompt, assets });
  } catch (err) {
    err.message = `[generation failed] [OpenAI] ${err.message}`;
    throw err;
  }

  // Strict server-side validation (NO coercion)
  const ok = validatePlan(structured);
  if (!ok) {
    const err = new Error("[generation failed] Task plan validation failed");
    err.code = "task_plan_invalid";
    err.details = validatePlan.errors;
    throw err;
  }

  const planArray = Array.isArray(structured?.plan) ? structured.plan : [];

  // Pass-through fields; attach userId/itemId/createdAt
  const tasks = [];
  for (const p of planArray) {
    const arr = Array.isArray(p?.tasks) ? p.tasks : [];
    for (const t of arr) {
      tasks.push({
        ...t,
        userId: String(user.id || user._id),
        itemId: String(item._id || item.id),
        createdAt: new Date(),
      });
    }
  }

  // Sort by numeric priority asc (schema enforces integer)
  tasks.sort((a, b) => a.priority - b.priority);

  return { tasks, generationMode: "openai" };
}
