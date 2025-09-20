/**
 * auth.controller.js
 * - Email/password sign up/in + sign out.
 * - Google/Apple routes are stubs to show where to integrate OAuth later.
 * - Returns user object with email for header display.
 */
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { setAuthCookie, clearAuthCookie } from "../middleware/auth.js";

export async function signUp(req, res, next) {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, provider: "password" });
    setAuthCookie(res, { id: user._id.toString(), email: user.email });
    res.json({ user: { email: user.email, id: user._id } });
  } catch (e) { next(e); }
}

export async function signIn(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    setAuthCookie(res, { id: user._id.toString(), email: user.email });
    res.json({ user: { email: user.email, id: user._id } });
  } catch (e) { next(e); }
}

export async function signOut(req, res, next) {
  try {
    clearAuthCookie(res);
    res.json({ message: "Signed out" });
  } catch (e) { next(e); }
}

// --- OAuth stubs ---
export async function googleStart(req, res) {
  // TODO: Implement Google OAuth (passport or custom), then set cookie and redirect to frontend
  res.status(501).json({ message: "Google OAuth not implemented" });
}

export async function appleStart(req, res) {
  // TODO: Implement Sign in with Apple
  res.status(501).json({ message: "Apple Sign in not implemented" });
}