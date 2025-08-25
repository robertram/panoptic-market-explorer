import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePoolDetail } from '@/data/mock-market';
import { UnitType, WindowType } from '@/types/market';

import { MarketHeader } from '@/components/market/MarketHeader';
import { LadderControls } from '@/components/market/LadderControls';
import { NearbyStat } from '@/components/market/NearbyStat';
import { LadderTable } from '@/components/market/LadderTable';
import { CollateralCards } from '@/components/market/CollateralCards';
import { HeatmapBar } from '@/components/market/HeatmapBar';
// import DepositPanel from '@/components/DepositPanel';
import { mockMarket } from '../../lib/mocks';
import DepositPanel from '@/components/DepositPanel';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const MarketDetail = () => {
  const { poolAddress } = useParams<{ poolAddress: string }>();
  const navigate = useNavigate();
  const { data: poolDetail, loading, error } = usePoolDetail(poolAddress || '');
  
  const [unit, setUnit] = useState<UnitType>('USD');
  const [window, setWindow] = useState<WindowType>(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </div>

          {/* Header skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card p-6 rounded-lg border shadow-card">
                <div className="space-y-3">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Ladder skeleton */}
          <div className="bg-card rounded-lg border shadow-card p-6">
            <div className="space-y-4">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-12 w-full bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="border-danger/20 bg-danger-muted">
            <AlertDescription className="text-danger">
              Failed to load market data. Please try again.
              <Button variant="outline" size="sm" className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!poolDetail) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {poolDetail.token0.symbol}/{poolDetail.token1.symbol} Market
          </h1>
        </div>

        {/* Add Liquidity Button and Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default">Add Liquidity</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogTitle>Add Liquidity</DialogTitle>
            <DialogDescription>
              Select a token and amount to add liquidity.
            </DialogDescription>
            <div className="grid md:grid-cols-2 gap-4">
              <DepositPanel market={mockMarket} side="token0" />
              <DepositPanel market={mockMarket} side="token1" />
            </div>
          </DialogContent>
        </Dialog>

        {/* Market Header */}
        <MarketHeader poolDetail={poolDetail} />

        {/* Main Market State Section */}
        <div className="bg-card rounded-lg border shadow-card">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold">State of the Market</h2>
              <LadderControls 
                unit={unit} 
                window={window} 
                onUnitChange={setUnit} 
                onWindowChange={setWindow} 
              />
            </div>

            <NearbyStat 
              poolDetail={poolDetail} 
              unit={unit} 
              window={window} 
            />

            {/* Optional heatmap */}
            <HeatmapBar 
              poolDetail={poolDetail} 
              window={window} 
              className="mb-4" 
            />

            <LadderTable 
              poolDetail={poolDetail} 
              unit={unit} 
              window={window} 
            />
          </div>
        </div>

        {/* Collateral Snapshot */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Collateral Snapshot</h2>
          <CollateralCards poolDetail={poolDetail} />
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;