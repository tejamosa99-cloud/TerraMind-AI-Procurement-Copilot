import React from "react";
import { fetchMarketData } from "../services/apiClient";
import { useDemoMode } from "../context/DemoModeContext";
import { DEMO_FIXTURES } from "../data/demoFixtures";

// Live commodity feed (mocked today, adapter-ready for LME / Trading
// Economics / MetalPriceAPI / SteelBenchmarker — see server/marketData.js).
export function useMarketData() {
  const { demoMode } = useDemoMode();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMarketData({ demoMode, demoFixtures: DEMO_FIXTURES });
      setData(result);
    } catch (err) {
      setError({ message: err.message, code: err.code });
      setData(DEMO_FIXTURES.marketData);
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
