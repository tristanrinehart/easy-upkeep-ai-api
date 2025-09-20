// src/models/item.model.js
// Adds generation status fields so the UI can reflect state precisely.

import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    model: { type: String, default: "" },

    // Generation status for OpenAI tasks
    genStatus: {
      type: String,
      enum: ["none", "pending", "ready", "failed"],
      default: "none",
      index: true,
    },
    genUpdatedAt: { type: Date, default: null },
    genError: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true }, versionKey: false }
);

itemSchema.index({ userId: 1, createdAt: -1 });

export const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);
