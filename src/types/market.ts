export type Token = { 
  symbol: string; 
  decimals: number; 
  derivedETH?: string;
};

export type UnderlyingPool = {
  id: string;
  tick: number | null;
  token0: Token;
  token1: Token;
  token0Price?: string | null;
  token1Price?: string | null;
  totalValueLockedUSD?: string | null;
};

export type Collateral = {
  id: string;
  token: Token;
  totalAssets?: string | null;
  totalShares?: string | null;
  poolUtilization?: string | null; // "0.42" etc.
};

export type Chunk = {
  id: string;
  tickLower: number;
  tickUpper: number;
  strike: number;
  width: number;
  tokenType: 0 | 1;     // 0 => token0 side, 1 => token1 side
  netLiquidity: string; // BigInt in Uniswap v3 liquidity units (L)
  longCounts: number;
  shortCounts: number;
};

export type PanopticPoolDetail = {
  id: string;
  token0: Token;
  token1: Token;
  underlyingPool: UnderlyingPool;
  collateral0?: Collateral | null;
  collateral1?: Collateral | null;
  chunks: Chunk[];
  bundle?: { ethPriceUSD: string }; // optional (for USD conversions from derivedETH)
};

export type UnitType = 'USD' | 'Tokens';
export type WindowType = 1 | 3; // ±1% or ±3%