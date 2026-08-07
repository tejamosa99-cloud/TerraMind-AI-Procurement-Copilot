import { AppError } from "../utils/app-error.js";

export function validateRequest(schema) {
  return (req, res, next) => {
    const body = req.body;
    if (!body || Array.isArray(body) || typeof body !== "object") {
      return next(new AppError("Request body must be a JSON object.", { code: "INVALID_REQUEST", status: 400 }));
    }

    for (const [field, expectedType] of Object.entries(schema)) {
      const value = body[field];
      if (value === undefined || value === null || value === "") {
        return next(new AppError(`Missing required field: ${field}.`, { code: "INVALID_REQUEST", status: 400 }));
      }
      const valid = expectedType === "array" ? Array.isArray(value) : typeof value === expectedType;
      if (!valid) {
        return next(new AppError(`Field ${field} must be a ${expectedType}.`, { code: "INVALID_REQUEST", status: 400 }));
      }
    }
    next();
  };
}
