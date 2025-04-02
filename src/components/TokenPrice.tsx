import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import Card from './Card';
import Button from './Button';

interface TokenPriceData {
  price: number;
  priceChange: number;
  volume24h: number;
  updatedAt: string;
}

const TOKEN_ADDRESS = '7xUV6YR3rZMfExPqZiovQSUxpnHxr2KJJqFg1bFrpump';
const DEX_SCREENER_API = 'https://api.dexscreener.com/latest/dex';

const TokenPrice: React.FC = () => {
  const { showTokenPrice } = useUIStore();
  const [priceData, setPriceData] = useState<TokenPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchPrice = async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response = await fetch(
        `${DEX_SCREENER_API}/search?q=${TOKEN_ADDRESS}`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.pairs || data.pairs.length === 0) {
        throw new Error('No trading pairs found for this token');
      }

      const pair = data.pairs.reduce((best: any, current: any) => {
        const bestLiquidity = parseFloat(best?.liquidity?.usd || '0');
        const currentLiquidity = parseFloat(current?.liquidity?.usd || '0');
        return currentLiquidity > bestLiquidity ? current : best;
      }, data.pairs[0]);

      if (!pair?.priceUsd || !pair?.priceChange?.h24 || !pair?.volume?.h24) {
        throw new Error('Missing required price data');
      }

      setPriceData({
        price: parseFloat(pair.priceUsd),
        priceChange: parseFloat(pair.priceChange.h24),
        volume24h: parseFloat(pair.volume.h24),
        updatedAt: new Date().toISOString()
      });
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch price data';
      console.error('Error fetching token price:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!showTokenPrice) return null;

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card 
          glass 
          glow 
          className="backdrop-blur-xl border border-red-500/20 group hover:border-red-500/40 transition-colors cursor-pointer"
          onClick={fetchPrice}
        >
          <div className="flex items-center gap-2 p-3">
            <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm text-red-500">Click to retry</span>
          </div>
        </Card>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2"
        >
          <span className="text-xl">💵</span>
          <span>${priceData?.price.toFixed(7)}</span>
          <ChevronUp className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card 
        glass 
        glow 
        className="backdrop-blur-xl border border-[#e1ffa6]/20 group hover:border-[#e1ffa6]/40 transition-colors"
      >
        <div className="flex items-center gap-4 p-3">
          <div className="w-8 h-8 bg-[#e1ffa6]/10 rounded-full flex items-center justify-center">
            <img
              src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DGPUgHtqe1Qc3YKXFEj2PQH6YtqGhFETCe4HHCgDoCR3/logo.png"
              alt="dGPU"
              className="w-5 h-5"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjRDMTguNjI3NCAyNCAyNCAxOC42Mjc0IDI0IDEyQzI0IDUuMzcyNTggMTguNjI3NCAwIDEyIDBDNS4zNzI1OCAwIDAgNS4zNzI1OCAwIDEyQzAgMTguNjI3NCA1LjM3MjU4IDI0IDEyIDI0WiIgZmlsbD0iI2UxZmZhNiIvPjwvc3ZnPg==';
              }}
            />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">dGPU</span>
              {!loading && priceData && (
                <div className={`flex items-center gap-1 text-sm ${
                  priceData.priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {priceData.priceChange >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(priceData.priceChange).toFixed(2)}%</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="animate-pulse bg-gray-700 h-4 w-24 rounded"></div>
              ) : (
                <span className="font-mono text-lg">
                  ${priceData?.price.toFixed(7)}
                </span>
              )}
              <RefreshCw className={`w-3 h-3 text-gray-500 transition-all ${
                loading ? 'animate-spin opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`} />
            </div>

            <div className="text-xs text-gray-500 mt-1">
              Updated {Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)}s ago
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="ml-2"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TokenPrice;