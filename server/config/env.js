import "dotenv/config";

function optionalNumber(value, fallback) {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function originList(value) {
  if (!value) return ["http://localhost:5173"];
  return value.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export const env = Object.freeze({
  port: optionalNumber(process.env.PORT, 8787),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  // Confirmed against this project API key; override per environment when needed.
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  marketDataProvider: process.env.MARKET_DATA_PROVIDER || "mock",
  allowedOrigins: originList(process.env.ALLOWED_ORIGINS),
  aiCacheTtlMs: optionalNumber(process.env.AI_CACHE_TTL_MS, 5 * 60_000),
  aiCacheMaxEntries: optionalNumber(process.env.AI_CACHE_MAX_ENTRIES, 200),
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: optionalNumber(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
});
