import { PanopticPoolDetail } from '@/types/market';
import { formatUsd, formatToken, getUtilizationColor, getUtilizationDotColor } from '@/lib/market-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollateralCardsProps {
  poolDetail: PanopticPoolDetail;
}

export function CollateralCards({ poolDetail }: CollateralCardsProps) {
  const collaterals = [
    { data: poolDetail.collateral0, token: poolDetail.token0 },
    { data: poolDetail.collateral1, token: poolDetail.token1 },
  ].filter(item => item.data);

  if (collaterals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No collateral data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {collaterals.map(({ data: collateral, token }, index) => {
        if (!collateral) return null;

        const utilization = collateral.poolUtilization 
          ? Number(collateral.poolUtilization) 
          : 0;

        const totalAssets = collateral.totalAssets
          ? Number(collateral.totalAssets) / Math.pow(10, token.decimals)
          : 0;

        const totalShares = collateral.totalShares
          ? Number(collateral.totalShares) / Math.pow(10, token.decimals)
          : 0;

        // Calculate USD values if possible
        const assetsUsd = poolDetail.bundle && token.derivedETH
          ? totalAssets * Number(token.derivedETH) * Number(poolDetail.bundle.ethPriceUSD)
          : 0;

        const utilizationPercent = (utilization * 100).toFixed(1);
        const utilizationColor = getUtilizationColor(utilization);
        const dotColor = getUtilizationDotColor(utilization);

        return (
          <Card key={collateral.id} className="p-6 shadow-card">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Collateral {index} ({token.symbol})
                </h3>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", dotColor)} />
                  <span className={cn("text-sm font-medium", utilizationColor)}>
                    {utilizationPercent}%
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-4">
                {/* Total Assets */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Total Assets</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total amount of {token.symbol} available as collateral</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="font-mono">
                    <div className="font-semibold">
                      {formatToken(totalAssets)} {token.symbol}
                    </div>
                    {assetsUsd > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {formatUsd(assetsUsd)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Shares */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Total Shares</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total shares issued for this collateral pool</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="font-mono font-semibold">
                    {formatToken(totalShares)}
                  </div>
                </div>

                {/* Pool Utilization */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Pool Utilization</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1 text-xs">
                            <p>Percentage of collateral currently being used</p>
                            <p>🟢 ≤40%: Low risk</p>
                            <p>🟡 40-75%: Medium risk</p>
                            <p>🔴 &gt;75%: High risk</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn("font-mono font-semibold", utilizationColor)}>
                        {utilizationPercent}%
                      </span>
                      <Badge 
                        variant={utilization <= 0.4 ? 'default' : utilization <= 0.75 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {utilization <= 0.4 ? 'Low Risk' : utilization <= 0.75 ? 'Medium Risk' : 'High Risk'}
                      </Badge>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          utilization <= 0.4 ? "bg-success" : 
                          utilization <= 0.75 ? "bg-warning" : "bg-danger"
                        )}
                        style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}