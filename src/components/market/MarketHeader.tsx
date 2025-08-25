import { PanopticPoolDetail } from '@/types/market';
import { priceFromTick, inversePrice, formatUsd, formatRelativeTime } from '@/lib/market-utils';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface MarketHeaderProps {
  poolDetail: PanopticPoolDetail;
}

export function MarketHeader({ poolDetail }: MarketHeaderProps) {
  const currentPrice = poolDetail.underlyingPool.tick 
    ? priceFromTick(
        poolDetail.underlyingPool.tick,
        poolDetail.token0.decimals,
        poolDetail.token1.decimals
      )
    : 0;

  const tvl = poolDetail.underlyingPool.totalValueLockedUSD
    ? formatUsd(Number(poolDetail.underlyingPool.totalValueLockedUSD))
    : '—';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Pair */}
      <Card className="p-6 shadow-card">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Trading Pair</p>
          <h3 className="text-2xl font-bold font-mono">
            {poolDetail.token0.symbol}/{poolDetail.token1.symbol}
          </h3>
        </div>
      </Card>

      {/* Current Price */}
      <Card className="p-6 shadow-card">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">Current Price</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Inverse: {currentPrice > 0 ? inversePrice(currentPrice).toFixed(6) : '—'} {poolDetail.token0.symbol} per 1 {poolDetail.token1.symbol}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="font-mono">
            <div className="text-2xl font-bold">
              {currentPrice > 0 ? currentPrice.toFixed(6) : '—'}
            </div>
            <div className="text-sm text-muted-foreground">
              {poolDetail.token1.symbol} per 1 {poolDetail.token0.symbol}
            </div>
          </div>
        </div>
      </Card>

      {/* USD Market Size (TVL) */}
      <Card className="p-6 shadow-card">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">USD Market Size</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total Value Locked (TVL) in the underlying Uniswap pool</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold font-mono text-success">
            {tvl}
          </div>
        </div>
      </Card>

      {/* Last Update */}
      <Card className="p-6 shadow-card">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Last Update</p>
          <div className="text-2xl font-bold">
            {formatRelativeTime()}
          </div>
        </div>
      </Card>
    </div>
  );
}