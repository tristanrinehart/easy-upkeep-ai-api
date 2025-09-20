/**
 * auth.js
 * - Minimal JWT-based auth scaffold using httpOnly same-site cookies to avoid CSRF issues on iOS/Safari.
 * - In production, consider short-lived access tokens + refresh rotation.
 */
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

const env = getEnv();

export function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
  res.cookie("eua_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookie(res) {
  res.clearCookie("eua_token", { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production" });
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.eua_token;
  if (!token) return res.status(401).json({ message: "Unauthorized", "x-request-id": req.id });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized", "x-request-id": req.id });
  }
}