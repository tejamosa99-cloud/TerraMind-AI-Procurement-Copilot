import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.allowedOrigins }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
