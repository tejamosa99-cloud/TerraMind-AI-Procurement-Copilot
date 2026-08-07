import React from "react";
import { callAIEndpoint } from "../services/apiClient";
import { useDemoMode } from "../context/DemoModeContext";
import { DEMO_FIXTURES } from "../data/demoFixtures";

// Keeps the "AI thinking" reasoning timeline visible for a minimum stretch
// so it reads as genuine reasoning rather than a flicker, even against a
// cached/instant response.
const MIN_THINKING_MS = 1900;
const MIN_ERROR_MS = 900;

// Generic AI-call hook: status machine (idle -> thinking -> done | error),
// demo-mode aware, cached via apiClient, with retry support.
export function useAI(endpoint) {
  const { demoMode } = useDemoMode();
  const [status, setStatus] = React.useState("idle");
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const lastPayloadRef = React.useRef(null);

  const generate = React.useCallback(
    async (payload) => {
      lastPayloadRef.current = payload;
      setStatus("thinking");
      setError(null);
      const startedAt = Date.now();
      try {
        const result = await callAIEndpoint(endpoint, payload, { demoMode, demoFixtures: DEMO_FIXTURES });
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_THINKING_MS) await new Promise((r) => setTimeout(r, MIN_THINKING_MS - elapsed));
        setData(result);
        setStatus("done");
      } catch (err) {
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_ERROR_MS) await new Promise((r) => setTimeout(r, MIN_ERROR_MS - elapsed));
        setError({ message: err.message, code: err.code });
        setStatus("error");
      }
    },
    [endpoint, demoMode]
  );

  const retry = React.useCallback(() => generate(lastPayloadRef.current), [generate]);

  return { status, data, error, generate, retry, loading: status === "thinking" };
}
