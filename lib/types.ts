export type Address = `0x${string}`;

export type TokenMeta = {
  address: Address;
  symbol: string;
  name?: string;
  decimals: number; // WBTC=8, WETH=18
};

export type TrackerMeta = {
  address: Address;         // collateral tracker address
  token: TokenMeta;         // underlying ERC-20 for this tracker
  totalAssets?: string;     // optional subgraph stats (string to avoid precision issues)
  totalShares?: string;
  poolUtilization?: string; // "0.38"
};

export type MarketDetail = {
  poolAddress: Address;
  token0: TokenMeta;
  token1: TokenMeta;
  collateral0: TrackerMeta;
  collateral1: TrackerMeta;
}; 