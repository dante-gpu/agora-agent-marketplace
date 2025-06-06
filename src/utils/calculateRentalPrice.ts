import { agentPricesUSD } from "../config/agentPrices";
import { getDGPUTokenPriceUSD } from "./oracle";

const PRICE_CACHE_KEY = "cached_dgpu_price_usd";

/**
 * Calculates how much dGPU is required to rent an agent for N hours.
 * Returns the value in floating-point dGPU units (not in lamports).
 */
export async function calculateDGPUAmount(agentId: string, hours: number = 1): Promise<number> {
  const usdPrice = agentPricesUSD[agentId] ?? 0.25;

  let dgpuPriceUSD = await getDGPUTokenPriceUSD();

  if (!dgpuPriceUSD || dgpuPriceUSD === 0) {
    const cached = localStorage.getItem(PRICE_CACHE_KEY);
    const parsed = cached ? parseFloat(cached) : 0;

    if (parsed && parsed > 0) {
      console.warn("🟡 [Oracle] Fresh price failed, using cached:", parsed);
      dgpuPriceUSD = parsed;
    } else {
      console.error("🔴 [Oracle] No valid price available. Returning 0.");
      return 0;
    }
  } else {
    localStorage.setItem(PRICE_CACHE_KEY, dgpuPriceUSD.toString());
    console.log("✅ [Oracle] Fresh price updated cache:", dgpuPriceUSD);
  }

  const totalUsd = usdPrice * hours;
  const dgpuAmount = totalUsd / dgpuPriceUSD;
  console.log(`🧮 Calculated ${dgpuAmount} dGPU for $${totalUsd} (${hours}h)`);
  return dgpuAmount;
}
