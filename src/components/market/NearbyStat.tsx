import { PanopticPoolDetail, UnitType, WindowType } from '@/types/market';
import { calculateNearbyLiquidity, priceFromTick, formatUsd, formatToken } from '@/lib/market-utils';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface NearbyStatProps {
  poolDetail: PanopticPoolDetail;
  unit: UnitType;
  window: WindowType;
}

export function NearbyStat({ poolDetail, unit, window }: NearbyStatProps) {
  const currentPrice = poolDetail.underlyingPool.tick 
    ? priceFromTick(
        poolDetail.underlyingPool.tick,
        poolDetail.token0.decimals,
        poolDetail.token1.decimals
      )
    : 0;

  const { total } = calculateNearbyLiquidity(
    poolDetail.chunks,
    currentPrice,
    window,
    poolDetail,
    unit === 'USD'
  );

  const formattedTotal = unit === 'USD' 
    ? formatUsd(total)
    : formatToken(total);

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Nearby Liquidity</h3>
          <p className="text-sm text-muted-foreground">
            Within ±{window}% of current price
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-2xl font-bold font-mono">
          {formattedTotal}
        </div>
        <Badge variant="secondary" className="text-xs">
          {poolDetail.chunks.filter(chunk => {
            const strikePrice = priceFromTick(
              chunk.strike, 
              poolDetail.token0.decimals, 
              poolDetail.token1.decimals
            );
            const lowerBound = currentPrice * (1 - window / 100);
            const upperBound = currentPrice * (1 + window / 100);
            return strikePrice >= lowerBound && strikePrice <= upperBound;
          }).length} zones
        </Badge>
      </div>
    </div>
  );
}