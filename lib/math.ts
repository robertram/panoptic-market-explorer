export function feeTierToPercent(feeTierBps: number) {
  // 3000 -> 0.3%
  return `${(feeTierBps / 1e4).toFixed(1)}%`;
}

export function priceFromTick(tick: number, token0Decimals: number, token1Decimals: number) {
  // price of token1 per 1 token0
  const ratio = Math.pow(1.0001, tick);
  const decimalAdj = Math.pow(10, token0Decimals - token1Decimals);
  return ratio * decimalAdj;
} 