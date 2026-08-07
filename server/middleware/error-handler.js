import { AppError } from "../utils/app-error.js";

export function notFound(req, res) {
  res.status(404).json({ error: "NOT_FOUND", message: `No endpoint exists at ${req.method} ${req.originalUrl}.` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const appError = error instanceof AppError
    ? error
    : new AppError("An unexpected server error occurred.");

  if (appError.status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}] ${appError.code}:`, error.message);
  }
  res.status(appError.status).json({ error: appError.code, message: appError.message });
}
