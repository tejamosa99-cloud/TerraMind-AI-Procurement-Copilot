export class AppError extends Error {
  constructor(message, { code = "INTERNAL_ERROR", status = 500, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}
