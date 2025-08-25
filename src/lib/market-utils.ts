import { PanopticPoolDetail, Token, Chunk } from '@/types/market';

// Price calculation from tick (Uniswap v3 math)
export function priceFromTick(tick: number, decimals0: number, decimals1: number): number {
  return Math.pow(1.0001, tick) * Math.pow(10, decimals0 - decimals1);
}

// Calculate inverse price
export function inversePrice(price: number): number {
  return 1 / price;
}

// Calculate percentage difference
export function pctDiff(current: number, reference: number): number {
  return ((current - reference) / reference) * 100;
}

// Mock liquidity to token amounts conversion (simplified)
export function amountsFromLiquidityL(
  liquidity: string,
  tickLower: number,
  tickUpper: number,
  currentTick: number,
  decimals0: number,
  decimals1: number
): { amount0: number; amount1: number } {
  const L = Number(liquidity);
  // Simplified approximation - in production this would use proper Uniswap v3 math
  const amount0 = L * Math.pow(10, -decimals0) * 0.5;
  const amount1 = L * Math.pow(10, -decimals1) * 0.5;
  
  return { amount0, amount1 };
}

// Convert token amount to USD
export function tokenToUsd(
  amount: number,
  token: Token,
  ethPriceUsd: string
): number {
  if (!token.derivedETH || !ethPriceUsd) return 0;
  return amount * Number(token.derivedETH) * Number(ethPriceUsd);
}

// Format USD values
export function formatUsd(value: number): string {
  if (value === 0) return '—';
  
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  } else if (value >= 1) {
    return `$${value.toFixed(2)}`;
  } else {
    return `$${value.toFixed(4)}`;
  }
}

// Format compact numbers
export function formatNumCompact(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  } else {
    return value.toFixed(2);
  }
}

// Format token amounts
export function formatToken(amount: number, decimals: number = 4): string {
  if (amount === 0) return '0';
  
  if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(2)}M`;
  } else if (amount >= 1e3) {
    return `${(amount / 1e3).toFixed(2)}K`;
  } else if (amount >= 1) {
    return amount.toFixed(decimals);
  } else {
    return amount.toFixed(6);
  }
}

// Format percentage
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Calculate nearby liquidity
export function calculateNearbyLiquidity(
  chunks: Chunk[],
  currentPrice: number,
  windowPercent: number,
  poolDetail: PanopticPoolDetail,
  showUsd: boolean
): { total: number; chunkPercentages: Map<string, number> } {
  const lowerBound = currentPrice * (1 - windowPercent / 100);
  const upperBound = currentPrice * (1 + windowPercent / 100);
  
  let totalLiquidity = 0;
  const chunkValues = new Map<string, number>();
  
  chunks.forEach(chunk => {
    const strikePrice = priceFromTick(chunk.strike, poolDetail.token0.decimals, poolDetail.token1.decimals);
    
    if (strikePrice >= lowerBound && strikePrice <= upperBound) {
      const { amount0, amount1 } = amountsFromLiquidityL(
        chunk.netLiquidity,
        chunk.tickLower,
        chunk.tickUpper,
        poolDetail.underlyingPool.tick || 0,
        poolDetail.token0.decimals,
        poolDetail.token1.decimals
      );
      
      let value: number;
      if (showUsd && poolDetail.bundle) {
        const usd0 = tokenToUsd(amount0, poolDetail.token0, poolDetail.bundle.ethPriceUSD);
        const usd1 = tokenToUsd(amount1, poolDetail.token1, poolDetail.bundle.ethPriceUSD);
        value = usd0 + usd1;
      } else {
        // Use token amounts when USD not available
        value = amount0 + amount1;
      }
      
      chunkValues.set(chunk.id, value);
      totalLiquidity += value;
    }
  });
  
  // Calculate percentages
  const chunkPercentages = new Map<string, number>();
  chunkValues.forEach((value, id) => {
    chunkPercentages.set(id, totalLiquidity > 0 ? (value / totalLiquidity) * 100 : 0);
  });
  
  return { total: totalLiquidity, chunkPercentages };
}

// Format relative time
export function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return 'Just updated';
  
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just updated';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Get utilization color class
export function getUtilizationColor(utilization: number): string {
  if (utilization <= 0.4) return 'text-success';
  if (utilization <= 0.75) return 'text-warning';
  return 'text-danger';
}

// Get utilization dot color
export function getUtilizationDotColor(utilization: number): string {
  if (utilization <= 0.4) return 'bg-success';
  if (utilization <= 0.75) return 'bg-warning';
  return 'bg-danger';
}