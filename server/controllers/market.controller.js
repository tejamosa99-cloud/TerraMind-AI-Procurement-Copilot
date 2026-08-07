import { getMarketData } from "../services/market-data.service.js";
import { AppError } from "../utils/app-error.js";

export function health(req, res) {
  res.json({ ok: true });
}

export async function marketData(req, res, next) {
  try {
    res.json(await getMarketData({ provider: req.query.provider }));
  } catch (error) {
    next(new AppError("Market feed unavailable. Using latest cached values.", {
      code: "MARKET_FEED_UNAVAILABLE", status: 502, cause: error,
    }));
  }
}
