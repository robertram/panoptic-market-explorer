import { PanopticPoolDetail, WindowType } from '@/types/market';
import { priceFromTick, calculateNearbyLiquidity } from '@/lib/market-utils';
import { cn } from '@/lib/utils';

interface HeatmapBarProps {
  poolDetail: PanopticPoolDetail;
  window: WindowType;
  className?: string;
}

export function HeatmapBar({ poolDetail, window, className }: HeatmapBarProps) {
  const currentPrice = poolDetail.underlyingPool.tick 
    ? priceFromTick(
        poolDetail.underlyingPool.tick,
        poolDetail.token0.decimals,
        poolDetail.token1.decimals
      )
    : 0;

  if (!currentPrice) return null;

  // Create price range for visualization
  const range = window / 100;
  const minPrice = currentPrice * (1 - range);
  const maxPrice = currentPrice * (1 + range);
  const priceStep = (maxPrice - minPrice) / 50; // 50 segments

  // Generate segments
  const segments = Array.from({ length: 50 }, (_, i) => {
    const segmentPrice = minPrice + (i * priceStep);
    
    // Find chunks that contain this price
    const relevantChunks = poolDetail.chunks.filter(chunk => {
      const lowerPrice = priceFromTick(chunk.tickLower, poolDetail.token0.decimals, poolDetail.token1.decimals);
      const upperPrice = priceFromTick(chunk.tickUpper, poolDetail.token0.decimals, poolDetail.token1.decimals);
      return segmentPrice >= lowerPrice && segmentPrice <= upperPrice;
    });

    // Calculate total liquidity for this segment
    const totalLiquidity = relevantChunks.reduce((sum, chunk) => {
      return sum + Number(chunk.netLiquidity);
    }, 0);

    return {
      price: segmentPrice,
      intensity: totalLiquidity
    };
  });

  // Normalize intensities to 0-1 range
  const maxIntensity = Math.max(...segments.map(s => s.intensity));
  const normalizedSegments = segments.map(segment => ({
    ...segment,
    normalizedIntensity: maxIntensity > 0 ? segment.intensity / maxIntensity : 0
  }));

  // Find current price position
  const currentPricePosition = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Liquidity Density</span>
        <span>±{window}% from current</span>
      </div>
      
      <div className="relative h-8 bg-muted/30 rounded-lg overflow-hidden border">
        {/* Heatmap segments */}
        <div className="flex h-full">
          {normalizedSegments.map((segment, i) => (
            <div
              key={i}
              className="flex-1 transition-colors"
              style={{
                backgroundColor: segment.normalizedIntensity > 0 
                  ? `hsl(225 70% ${Math.max(30, 90 - (segment.normalizedIntensity * 60))}%)`
                  : 'transparent'
              }}
              title={`Price: ${segment.price.toFixed(4)}, Liquidity: ${segment.intensity.toLocaleString()}`}
            />
          ))}
        </div>

        {/* Current price indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg"
          style={{ left: `${currentPricePosition}%` }}
        />
        
        {/* Current price label */}
        <div
          className="absolute -top-6 transform -translate-x-1/2 text-xs font-medium text-primary whitespace-nowrap"
          style={{ left: `${currentPricePosition}%` }}
        >
          Current
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>{minPrice.toFixed(4)}</span>
        <span className="text-center">
          Current: {currentPrice.toFixed(4)}
        </span>
        <span>{maxPrice.toFixed(4)}</span>
      </div>
    </div>
  );
}