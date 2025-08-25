import { useEffect, useState } from 'react';
import { gqlFetch } from '../../lib/graphql';
import { priceFromTick, feeTierToPercent } from '../../lib/math';
import { Link } from 'react-router-dom';

const QUERY = `
query OldestPools($first: Int!) {
  panopticPools(first: $first, orderBy: createdBlockNumber, orderDirection: asc) {
    id
    feeTier
    token0 { symbol decimals }
    token1 { symbol decimals }
    underlyingPool {
      tick
      token0 { decimals }
      token1 { decimals }
      token1Price
    }
  }
}`;

interface PoolRow {
  id: string;
  feeTier: string;
  token0: { symbol: string; decimals: number };
  token1: { symbol: string; decimals: number };
  underlyingPool: {
    tick: number | null;
    token0: { decimals: number };
    token1: { decimals: number };
    token1Price: string;
  } | null;
  price: number;
}

const Index = () => {
  const [pools, setPools] = useState<PoolRow[]>([]);

  useEffect(() => {
    async function fetchPools() {
      try {
        const data = await gqlFetch<{ panopticPools: PoolRow[] }>(QUERY, { first: 50 });
        console.log('fetchPools data', data)
        const rows = data.panopticPools.map((p) => {
          const u = p.underlyingPool;
          const price =
            u?.tick !== null && u?.tick !== undefined
              ? priceFromTick(u.tick, u.token0.decimals, u.token1.decimals)
              : Number(u?.token1Price ?? 0);
          return { ...p, price };
        });
        setPools(rows);
      } catch (error) {
        console.error('Error fetching pools:', error);
      }
    }
    fetchPools();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-bullish bg-clip-text text-transparent">
            Panoptic Market Explorer
          </h1>
          <p className="text-xl text-muted-foreground">
            Advanced DeFi market visualization and liquidity analysis
          </p>
        </div>
        

        {/* Display the list of pools */}
        <div className="grid grid-cols-4 gap-2 font-medium border-b pb-2">
          <div>Token 0</div>
          <div>Token 1</div>
          <div>Fee Tier</div>
          <div>Current Price</div>
        </div>
        {pools.map((p) => (
          <Link key={p.id} to={`/markets/${p.id}`} className="grid grid-cols-4 gap-2 py-2 hover:bg-zinc-900/5">
            <div>{p.token0.symbol}</div>
            <div>{p.token1.symbol}</div>
            <div>{feeTierToPercent(Number(p.feeTier))}</div>
            <div>{Number.isFinite(p.price) ? p.price.toPrecision(8) : "-"}</div>
          </Link>
        ))}
        
      </div>
    </div>
  );
};

export default Index;
