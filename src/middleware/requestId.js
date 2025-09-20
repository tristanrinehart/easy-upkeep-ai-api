/**
 * requestId.js
 * - Adds a unique request ID to req.id and response header x-request-id.
 * - Allows correlation from browser console to server logs (Render).
 */
import { customAlphabet } from "nanoid";

const nano = customAlphabet("1234567890abcdef", 16);

export function requestId() {
  return (req, res, next) => {
    const incoming = req.headers["x-request-id"];
    req.id = (typeof incoming === "string" && incoming.length > 0) ? incoming : nano();
    res.setHeader("x-request-id", req.id);
    next();
  };
}