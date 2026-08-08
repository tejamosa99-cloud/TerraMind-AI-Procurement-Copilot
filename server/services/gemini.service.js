import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { validateAiResponse } from "../ai/response-schemas.js";
import { AppError } from "../utils/app-error.js";

function isRetryable(error) {
  const status = Number(error?.status);
  return status === 408 || status === 429 || status >= 500 || /timeout|network|fetch failed/i.test(error?.message || "");
}

function configuredModel() {
  if (!env.geminiApiKey) {
    throw new AppError("AI copilot is not configured for this environment. Contact your administrator.", {
      code: "AI_NOT_CONFIGURED", status: 503,
    });
  }
  console.log("GEMINI MODEL =", env.geminiModel);
  const client = new GoogleGenerativeAI(env.geminiApiKey);
  return client.getGenerativeModel({
    model: env.geminiModel,
    generationConfig: { responseMimeType: "application/json" },
  });
}

export async function generateStructured({ endpoint, prompt, retries = 1 }) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (endpoint === "daily-brief") console.log("[gemini.service] Sending prompt to Gemini for", endpoint); // TEMP TRACE
      const result = await configuredModel().generateContent(prompt);
      if (endpoint === "daily-brief") console.log("[gemini.service] Gemini response received for", endpoint); // TEMP TRACE
      return validateAiResponse(endpoint, result.response.text());
    } catch (error) {
      lastError = error;
      if (error instanceof AppError && error.code !== "AI_GENERATION_FAILED") throw error;
      if (!isRetryable(error) || attempt === retries) break;
    }
  }

  console.error(`Gemini generation failed for ${endpoint}:`, lastError?.message);
  throw new AppError("Unable to retrieve this AI analysis. Retrying may resolve this — please try again.", {
    code: "AI_GENERATION_FAILED", status: 502, cause: lastError,
  });
}
