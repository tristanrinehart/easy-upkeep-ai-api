// src/models/task.model.js
// Expanded Task model to match UI + OpenAI plan shape exactly.
// All numeric fields are required numbers now (priority, frequencyInWeeks, durationMinutes).

import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    itemId: { type: String, required: true, index: true },

    taskName: { type: String, required: true },
    description: { type: String, required: true },

    priority: { type: Number, min: 1, max: 10, required: true },

    frequency: { type: String, required: true },
    frequencyInWeeks: { type: Number, required: true, min: 1, max: 520 },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "very hard"],
      required: true,
    },

    duration: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1 }, // now required

    who: { type: String, enum: ["owner", "professional"], required: true },

    steps: { type: [String], default: [] },
    tools: { type: [String], default: [] },

    // Optional manufacturer citations
    manufacturerSnippet: { type: String, default: undefined },
    manufacturerSourceUrl: { type: String, default: undefined },
    manufacturerDocTitle: { type: String, default: undefined },

    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Helpful indexes
taskSchema.index({ userId: 1, itemId: 1, priority: 1, createdAt: 1 });
taskSchema.index({ userId: 1, itemId: 1 });

export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
