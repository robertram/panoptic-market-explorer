import { useState } from 'react';
import { PanopticPoolDetail, UnitType, WindowType, Chunk } from '@/types/market';
import { 
  priceFromTick, 
  pctDiff, 
  amountsFromLiquidityL, 
  tokenToUsd, 
  formatUsd, 
  formatToken, 
  formatPercent,
  calculateNearbyLiquidity 
} from '@/lib/market-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChunkRowProps {
  chunk: Chunk & { strikePrice: number };
  poolDetail: PanopticPoolDetail;
  unit: UnitType;
  window: WindowType;
  currentPrice: number;
  isExpanded: boolean;
  onClick: () => void;
  type: 'above' | 'below';
}

export function ChunkRow({ 
  chunk, 
  poolDetail, 
  unit, 
  window, 
  currentPrice, 
  isExpanded, 
  onClick, 
  type 
}: ChunkRowProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Calculate zone bounds
  const lowerPrice = priceFromTick(chunk.tickLower, poolDetail.token0.decimals, poolDetail.token1.decimals);
  const upperPrice = priceFromTick(chunk.tickUpper, poolDetail.token0.decimals, poolDetail.token1.decimals);
  
  // Calculate distance from current price
  const distance = pctDiff(chunk.strikePrice, currentPrice);
  
  // Calculate available amounts
  const { amount0, amount1 } = amountsFromLiquidityL(
    chunk.netLiquidity,
    chunk.tickLower,
    chunk.tickUpper,
    poolDetail.underlyingPool.tick || 0,
    poolDetail.token0.decimals,
    poolDetail.token1.decimals
  );

  // USD values
  const usd0 = poolDetail.bundle 
    ? tokenToUsd(amount0, poolDetail.token0, poolDetail.bundle.ethPriceUSD)
    : 0;
  const usd1 = poolDetail.bundle 
    ? tokenToUsd(amount1, poolDetail.token1, poolDetail.bundle.ethPriceUSD)
    : 0;
  const totalUsd = usd0 + usd1;

  // Calculate nearby percentage
  const { chunkPercentages } = calculateNearbyLiquidity(
    poolDetail.chunks,
    currentPrice,
    window,
    poolDetail,
    unit === 'USD'
  );
  const nearbyPercent = chunkPercentages.get(chunk.id) || 0;

  // Interest display
  const totalInterest = chunk.longCounts + chunk.shortCounts;
  const interestDisplay = totalInterest > 0 
    ? `${chunk.longCounts}L / ${chunk.shortCounts}S`
    : '—';

  // Side display
  const sideDisplay = chunk.tokenType === 0 
    ? `${poolDetail.token0.symbol} side`
    : `${poolDetail.token1.symbol} side`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const distanceColor = type === 'above' ? 'text-success' : 'text-danger';
  const rowBg = type === 'above' ? 'hover:bg-success-muted/20' : 'hover:bg-danger-muted/20';

  return (
    <div className={cn("transition-colors", rowBg)}>
      <div
        className="grid grid-cols-12 gap-2 p-3 cursor-pointer"
        onClick={onClick}
      >
        {/* Zone */}
        <div className="col-span-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-mono text-sm">
                  <div>[{lowerPrice.toFixed(4)} → {upperPrice.toFixed(4)}]</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p>Lower tick: {chunk.tickLower}</p>
                  <p>Upper tick: {chunk.tickUpper}</p>
                  <p>Width: {chunk.width} ticks</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Mid (Strike) */}
        <div className="col-span-2">
          <div className="font-mono text-sm font-medium">
            {chunk.strikePrice.toFixed(4)}
          </div>
        </div>

        {/* Distance */}
        <div className="col-span-2">
          <span className={cn("font-mono text-sm font-medium", distanceColor)}>
            {formatPercent(distance)}
          </span>
        </div>

        {/* Available */}
        <div className="col-span-2">
          <div className="space-y-1">
            <div className="font-mono text-sm font-medium">
              {unit === 'USD' ? formatUsd(totalUsd) : `${formatToken(amount0)} / ${formatToken(amount1)}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {unit === 'USD' 
                ? `${formatToken(amount0)} ${poolDetail.token0.symbol} / ${formatToken(amount1)} ${poolDetail.token1.symbol}`
                : formatUsd(totalUsd)
              }
            </div>
          </div>
          {nearbyPercent > 0 && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {nearbyPercent.toFixed(1)}%
            </Badge>
          )}
        </div>

        {/* Interest */}
        <div className="col-span-2">
          <div className="font-mono text-sm">
            {interestDisplay}
          </div>
        </div>

        {/* Side */}
        <div className="col-span-1 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {sideDisplay}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-6 py-4 border-t bg-muted/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Raw Data</h4>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Liquidity:</span>
                  <div className="flex items-center gap-2">
                    <span>{chunk.netLiquidity} L</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(chunk.netLiquidity, 'liquidity');
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strike Tick:</span>
                  <div className="flex items-center gap-2">
                    <span>{chunk.strike}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(chunk.strike.toString(), 'strike');
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Token Amounts</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{poolDetail.token0.symbol}:</span>
                  <span className="font-mono">{formatToken(amount0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{poolDetail.token1.symbol}:</span>
                  <span className="font-mono">{formatToken(amount1)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">USD Values</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{poolDetail.token0.symbol}:</span>
                  <span className="font-mono">{formatUsd(usd0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{poolDetail.token1.symbol}:</span>
                  <span className="font-mono">{formatUsd(usd1)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Position Data</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Long Positions:</span>
                  <span className="font-mono">{chunk.longCounts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Short Positions:</span>
                  <span className="font-mono">{chunk.shortCounts}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const rawData = {
                  id: chunk.id,
                  tickLower: chunk.tickLower,
                  tickUpper: chunk.tickUpper,
                  strike: chunk.strike,
                  width: chunk.width,
                  netLiquidity: chunk.netLiquidity,
                  tokenType: chunk.tokenType,
                  longCounts: chunk.longCounts,
                  shortCounts: chunk.shortCounts
                };
                copyToClipboard(JSON.stringify(rawData, null, 2), 'raw');
              }}
            >
              {copiedField === 'raw' ? 'Copied!' : 'Copy Raw Data'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}