// src/openai/taskPrompt.schema.js
// Canonical JSON Schema for OpenAI Structured Outputs and server-side Ajv (2020-12).
// Exported symbol: maintenanceTaskResponseSchema

export function maintenanceTaskResponseSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    additionalProperties: false,
    required: ["plan"],
    properties: {
      plan: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["maintenanceItemId", "maintenanceItemName", "tasks"],
          properties: {
            maintenanceItemId: { type: "string" },
            maintenanceItemName: { type: "string" },
            model: { type: "string" },
            tasks: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "taskName",
                  "description",
                  "priority",
                  "frequency",
                  "frequencyInWeeks",
                  "difficulty",
                  "duration",
                  "durationMinutes",
                  "who",
                  "steps",
                  "tools"
                ],
                properties: {
                  taskName: { type: "string" },
                  description: { type: "string" },
                  // integers only (no strings)
                  priority: { type: "integer", minimum: 1, maximum: 10 },
                  frequency: { type: "string" },
                  // integers only (no strings, no defaults)
                  frequencyInWeeks: { type: "integer", minimum: 1, maximum: 520 },
                  difficulty: {
                    type: "string",
                    enum: ["easy", "medium", "hard", "very hard"]
                  },
                  duration: { type: "string" },
                  // integers only (no strings)
                  durationMinutes: { type: "integer", minimum: 1, maximum: 100000 },
                  who: {
                    type: "string",
                    enum: ["owner", "professional"]
                  },
                  steps: {
                    type: "array",
                    items: { type: "string" }
                  },
                  tools: {
                    type: "array",
                    items: { type: "string" }
                  },
                  // Optional OEM fields
                  manufacturerSnippet: { type: "string" },
                  manufacturerSourceUrl: { type: "string", format: "uri" },
                  manufacturerDocTitle: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  };
}
