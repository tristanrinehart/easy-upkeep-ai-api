/**
 * user.model.js
 * - Email/password auth (no username), plus provider fields for Google/Apple (scaffold).
 */
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // only for email/password
  provider: { type: String, enum: ["password", "google", "apple"], default: "password" },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);