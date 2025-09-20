/**
 * ajv.js
 * - Exports a function to validate request bodies and respond with rich details on failure.
 */
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

export function validateBody(schema) {
  const validate = ajv.compile(schema);
  return (req, res, next) => {
    const valid = validate(req.body);
    if (!valid) {
      const error = new Error("Validation failed");
      error.status = 400;
      error.details = validate.errors;
      return next(error);
    }
    next();
  };
}