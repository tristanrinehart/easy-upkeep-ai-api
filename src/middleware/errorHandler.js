/**
 * errorHandler.js
 * - Rich 4xx body for fast iteration (Ajv errors, validation details).
 */
export function notFound(req, res, next) {
  res.status(404).json({ message: "Not found", path: req.originalUrl, "x-request-id": req.id });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    message: err.message || "Internal Server Error",
    details: err.details || null,
    "x-request-id": req.id
  };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}