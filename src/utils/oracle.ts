export async function getDGPUTokenPriceUSD(): Promise<number> {
    try {
      const res = await fetch("http://localhost:8787/coingecko/dgpu-price");
  
      if (!res.ok) {
        console.error("❌ Failed to fetch dGPU price from proxy");
        return 0;
      }
  
      const data = await res.json();
      return data?.dante?.usd ?? 0;
    } catch (err) {
      console.error("🚨 CoinGecko proxy API error:", err);
      return 0;
    }
  }
  