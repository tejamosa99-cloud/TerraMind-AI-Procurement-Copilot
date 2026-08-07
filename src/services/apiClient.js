// Thin client for TerraMind's internal /api/* endpoints. The frontend never
// talks to Gemini directly — all model calls happen server-side (see server/).

const CLIENT_CACHE = new Map();

function cacheKey(endpoint, payload) {
  return endpoint + ":" + JSON.stringify(payload || {});
}

function readSessionCache(key) {
  try {
    const raw = sessionStorage.getItem("tm_ai_cache:" + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSessionCache(key, value) {
  try {
    sessionStorage.setItem("tm_ai_cache:" + key, JSON.stringify(value));
  } catch {
    // sessionStorage unavailable (private mode etc) — in-memory cache still works
  }
}

const AI_REQUEST_TIMEOUT_MS = 15000;

async function postJson(path, payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      const err = new Error("The AI service took too long to respond. Please try again.");
      err.code = "AI_TIMEOUT";
      throw err;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(body?.message || "The AI service could not complete this request.");
    err.code = body?.error || "AI_GENERATION_FAILED";
    throw err;
  }
  return body;
}

// Calls an AI endpoint. In demo mode it resolves from local fixtures instead
// of hitting the network, and identical live requests are cached (memory +
// sessionStorage) so navigating back to an agent doesn't re-bill Gemini.
export async function callAIEndpoint(endpoint, payload, { demoMode, demoFixtures } = {}) {
  const key = cacheKey(endpoint, payload);

  if (endpoint === "daily-brief") {
    console.log(`[apiClient] Calling /api/${endpoint}. demoMode =`, demoMode); // TEMP TRACE — remove after verifying Agent 1
  }

  if (demoMode) {
    await new Promise((r) => setTimeout(r, 300));
    const fixture = demoFixtures?.[endpoint];
    if (!fixture) {
      const err = new Error("No demo data available for this section.");
      err.code = "DEMO_DATA_MISSING";
      throw err;
    }
    return fixture;
  }

  if (CLIENT_CACHE.has(key)) return CLIENT_CACHE.get(key);
  const cached = readSessionCache(key);
  if (cached) {
    CLIENT_CACHE.set(key, cached);
    return cached;
  }

  const data = await postJson(`/api/${endpoint}`, payload);
  CLIENT_CACHE.set(key, data);
  writeSessionCache(key, data);
  return data;
}

export async function fetchMarketData({ demoMode, demoFixtures } = {}) {
  if (demoMode) {
    await new Promise((r) => setTimeout(r, 150));
    return demoFixtures?.marketData;
  }
  const res = await fetch("/api/market-data");
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(body?.message || "Market feed unavailable. Using latest cached values.");
    err.code = body?.error || "MARKET_FEED_UNAVAILABLE";
    throw err;
  }
  return body;
}

export function clearAICache() {
  CLIENT_CACHE.clear();
}
