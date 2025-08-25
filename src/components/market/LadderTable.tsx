import { useState } from 'react';
import { PanopticPoolDetail, UnitType, WindowType, Chunk } from '@/types/market';
import { priceFromTick } from '@/lib/market-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChunkRow } from './ChunkRow';

interface LadderTableProps {
  poolDetail: PanopticPoolDetail;
  unit: UnitType;
  window: WindowType;
}

export function LadderTable({ poolDetail, unit, window }: LadderTableProps) {
  const [expandedChunk, setExpandedChunk] = useState<string | null>(null);

  const currentPrice = poolDetail.underlyingPool.tick 
    ? priceFromTick(
        poolDetail.underlyingPool.tick,
        poolDetail.token0.decimals,
        poolDetail.token1.decimals
      )
    : 0;

  // Separate chunks into above and below current price
  const chunksWithPrices = poolDetail.chunks.map(chunk => ({
    ...chunk,
    strikePrice: priceFromTick(chunk.strike, poolDetail.token0.decimals, poolDetail.token1.decimals)
  }));

  const aboveChunks = chunksWithPrices
    .filter(chunk => chunk.strikePrice > currentPrice)
    .sort((a, b) => a.strikePrice - b.strikePrice); // Ascending for above

  const belowChunks = chunksWithPrices
    .filter(chunk => chunk.strikePrice <= currentPrice)
    .sort((a, b) => b.strikePrice - a.strikePrice); // Descending for below

  const handleRowClick = (chunkId: string) => {
    setExpandedChunk(expandedChunk === chunkId ? null : chunkId);
  };

  const TableHeader = () => (
    <div className="grid grid-cols-12 gap-2 p-3 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
      <div className="col-span-3">Zone</div>
      <div className="col-span-2">Mid (Strike)</div>
      <div className="col-span-2">Distance</div>
      <div className="col-span-2">Available ({unit})</div>
      <div className="col-span-2">Interest</div>
      <div className="col-span-1">Side</div>
    </div>
  );

  const EmptyState = ({ type }: { type: 'above' | 'below' }) => (
    <div className="p-8 text-center text-muted-foreground">
      <p>No zones {type} current price</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="above" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="above" className="data-[state=active]:text-success">
            Above Price ({aboveChunks.length})
          </TabsTrigger>
          <TabsTrigger value="below" className="data-[state=active]:text-danger">
            Below Price ({belowChunks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="above" className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            <TableHeader />
            {aboveChunks.length > 0 ? (
              <div className="divide-y">
                {aboveChunks.map((chunk) => (
                  <ChunkRow
                    key={chunk.id}
                    chunk={chunk}
                    poolDetail={poolDetail}
                    unit={unit}
                    window={window}
                    currentPrice={currentPrice}
                    isExpanded={expandedChunk === chunk.id}
                    onClick={() => handleRowClick(chunk.id)}
                    type="above"
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="above" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="below" className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            <TableHeader />
            {belowChunks.length > 0 ? (
              <div className="divide-y">
                {belowChunks.map((chunk) => (
                  <ChunkRow
                    key={chunk.id}
                    chunk={chunk}
                    poolDetail={poolDetail}
                    unit={unit}
                    window={window}
                    currentPrice={currentPrice}
                    isExpanded={expandedChunk === chunk.id}
                    onClick={() => handleRowClick(chunk.id)}
                    type="below"
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="below" />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}