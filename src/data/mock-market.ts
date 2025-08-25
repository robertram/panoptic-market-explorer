import { PanopticPoolDetail } from '@/types/market';
import { useState, useEffect } from 'react';
import { gqlFetch } from '../../lib/graphql';

const QUERY = `
query PoolDetail($id: ID!) {
  panopticPool(id: $id) {
    id
    feeTier
    token0 { symbol decimals name id }
    token1 { symbol decimals name id }
    underlyingPool {
      id
      tick
      token0 { decimals }
      token1 { decimals }
      token0Price
      token1Price
      totalValueLockedUSD
      liquidity
      tickLastUpdateTimestamp
    }
    collateral0 { id token { symbol decimals } totalShares totalAssets }
    collateral1 { id token { symbol decimals } totalShares totalAssets }
    chunks(first: 50, orderBy: netLiquidity, orderDirection: desc) {
      id
      netLiquidity
      longCounts
      shortCounts
      tickLower
      tickUpper
      strike
    }
  }
}`;

export const mockDetail: PanopticPoolDetail = {
  id: "0xPool123456",
  token0: { symbol: "DAI", decimals: 18, derivedETH: "0.00033" },
  token1: { symbol: "WETH", decimals: 18, derivedETH: "1" },
  underlyingPool: {
    id: "0xUniPool789",
    tick: 69000,
    token0: { symbol: "DAI", decimals: 18 },
    token1: { symbol: "WETH", decimals: 18 },
    totalValueLockedUSD: "12500000"
  },
  collateral0: { 
    id: "0xC0", 
    token: { symbol: "DAI", decimals: 18 }, 
    totalAssets: "500000000000000000000000", 
    totalShares: "500000000000000000000000", 
    poolUtilization: "0.38" 
  },
  collateral1: { 
    id: "0xC1", 
    token: { symbol: "WETH", decimals: 18 }, 
    totalAssets: "7500000000000000000000", 
    totalShares: "7500000000000000000000", 
    poolUtilization: "0.52" 
  },
  chunks: [
    // Above current price zones
    { 
      id: "chunk-1", 
      tickLower: 70200, 
      tickUpper: 75000, 
      strike: 72600, 
      width: 4800, 
      tokenType: 0, 
      netLiquidity: "344549069", 
      longCounts: 2, 
      shortCounts: 1 
    },
    { 
      id: "chunk-2", 
      tickLower: 69600, 
      tickUpper: 74400, 
      strike: 72000, 
      width: 4800, 
      tokenType: 1, 
      netLiquidity: "298057708", 
      longCounts: 1, 
      shortCounts: 2 
    },
    { 
      id: "chunk-3", 
      tickLower: 69300, 
      tickUpper: 74100, 
      strike: 71700, 
      width: 4800, 
      tokenType: 0, 
      netLiquidity: "456123789", 
      longCounts: 3, 
      shortCounts: 0 
    },
    
    // At/near current price
    { 
      id: "chunk-4", 
      tickLower: 68880, 
      tickUpper: 73680, 
      strike: 71280, 
      width: 4800, 
      tokenType: 0, 
      netLiquidity: "644549069", 
      longCounts: 1, 
      shortCounts: 1 
    },
    { 
      id: "chunk-5", 
      tickLower: 68700, 
      tickUpper: 73500, 
      strike: 71100, 
      width: 4800, 
      tokenType: 1, 
      netLiquidity: "798057708", 
      longCounts: 0, 
      shortCounts: 2 
    },
    
    // Below current price zones
    { 
      id: "chunk-6", 
      tickLower: 66720, 
      tickUpper: 71520, 
      strike: 69120, 
      width: 4800, 
      tokenType: 1, 
      netLiquidity: "698057708", 
      longCounts: 0, 
      shortCounts: 2 
    },
    { 
      id: "chunk-7", 
      tickLower: 66000, 
      tickUpper: 70800, 
      strike: 68400, 
      width: 4800, 
      tokenType: 0, 
      netLiquidity: "534221156", 
      longCounts: 2, 
      shortCounts: 1 
    },
    { 
      id: "chunk-8", 
      tickLower: 65400, 
      tickUpper: 70200, 
      strike: 67800, 
      width: 4800, 
      tokenType: 1, 
      netLiquidity: "423678901", 
      longCounts: 1, 
      shortCounts: 3 
    },
    { 
      id: "chunk-9", 
      tickLower: 64800, 
      tickUpper: 69600, 
      strike: 67200, 
      width: 4800, 
      tokenType: 0, 
      netLiquidity: "345789012", 
      longCounts: 1, 
      shortCounts: 1 
    }
  ],
  bundle: { ethPriceUSD: "2600" }
};

export function usePoolDetail(poolAddress: string) {
  const [data, setData] = useState<PanopticPoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await gqlFetch<{ panopticPool: PanopticPoolDetail }>(QUERY, { id: poolAddress.toLowerCase() });
        console.log('result', result.panopticPool);
        
         setData(result.panopticPool);
        //setData(mockDetail);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poolAddress]);

  return { data, loading, error };
}