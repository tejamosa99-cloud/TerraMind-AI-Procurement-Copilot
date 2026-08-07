import { env } from "../config/env.js";

const MOCK_COMMODITIES = {
  steel: { symbol: "STEEL", name: "Steel / Alloy", unit: "USD/tonne", price: 742.5, change24hPct: 2.9, trend7d: [718, 724, 731, 726, 735, 739, 742.5], source: "mock" },
  iron: { symbol: "IRON", name: "Iron Ore", unit: "USD/tonne", price: 108.2, change24hPct: 1.6, trend7d: [103, 104.5, 105, 106.8, 107, 107.6, 108.2], source: "mock" },
  rubber: { symbol: "RUBBER", name: "Natural Rubber", unit: "USD/kg", price: 1.61, change24hPct: -3.8, trend7d: [1.72, 1.7, 1.68, 1.66, 1.64, 1.63, 1.61], source: "mock" },
  aluminium: { symbol: "ALU", name: "Aluminium", unit: "USD/tonne", price: 2312, change24hPct: 0.4, trend7d: [2288, 2295, 2301, 2299, 2305, 2309, 2312], source: "mock" },
};

const providers = {
  mock: {
    label: "Mocked Market Feed",
    async fetch() {
      const now = new Date().toISOString();
      return Object.fromEntries(Object.entries(MOCK_COMMODITIES).map(([key, commodity]) => [key, { ...commodity, lastUpdated: now }]));
    },
  },
  lme: unavailableProvider("London Metal Exchange", "LME adapter not yet configured."),
  tradingEconomics: unavailableProvider("Trading Economics", "Trading Economics adapter not yet configured."),
  metalPriceApi: unavailableProvider("MetalPriceAPI", "MetalPriceAPI adapter not yet configured."),
  steelBenchmarker: unavailableProvider("SteelBenchmarker", "SteelBenchmarker adapter not yet configured."),
};

function unavailableProvider(label, message) {
  return { label, async fetch() { throw new Error(message); } };
}

let cache = { createdAt: 0, provider: null, data: null };
const CACHE_TTL_MS = 60_000;

export async function getMarketData({ provider = env.marketDataProvider } = {}) {
  const isFresh = cache.data && cache.provider === provider && Date.now() - cache.createdAt < CACHE_TTL_MS;
  if (isFresh) return { ...cache.data, cached: true };

  const adapter = providers[provider] || providers.mock;
  try {
    const data = await adapter.fetch();
    cache = { createdAt: Date.now(), provider, data };
    return { ...data, cached: false, providerLabel: adapter.label };
  } catch (error) {
    if (provider !== "mock") {
      console.warn(`Market provider "${provider}" unavailable; using mock data.`);
      return getMarketData({ provider: "mock" });
    }
    throw error;
  }
}
