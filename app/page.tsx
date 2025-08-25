import Link from "next/link";
import { gqlFetch } from "../lib/graphql";
import { priceFromTick, feeTierToPercent } from "../lib/math";

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

type Token = { symbol: string; decimals: number };
interface Underlying {
  tick: number | null;
  token0: Token;
  token1: Token;
  token1Price: string | null;
}
interface PoolRow {
  id: string;
  feeTier: string; // or number depending on schema
  token0: Token;
  token1: Token;
  underlyingPool: Underlying;
}

export default async function Home() {
  const data = await gqlFetch<{ panopticPools: PoolRow[] }>(QUERY, { first: 50 });
  const rows = data.panopticPools.map((p) => {
    const u = p.underlyingPool;
    const price =
      u?.tick !== null && u?.tick !== undefined
        ? priceFromTick(u.tick, u.token0.decimals, u.token1.decimals)
        : Number(u?.token1Price ?? 0);
    return { ...p, price };
  });

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Oldest Panoptic Pools (Mainnet)</h1>
      <div className="grid grid-cols-4 gap-2 font-medium border-b pb-2">
        <div>Token 0</div>
        <div>Token 1</div>
        <div>Fee Tier</div>
        <div>Current Price</div>
      </div>
      {rows.map((p) => (
        <Link key={p.id} href={`/markets/${p.id}`}>
          <div className="grid grid-cols-4 gap-2 py-2 hover:bg-zinc-900/5">
            <div>{p.token0.symbol}</div>
            <div>{p.token1.symbol}</div>
            <div>{feeTierToPercent(Number(p.feeTier))}</div>
            <div>{Number.isFinite(p.price) ? p.price.toPrecision(8) : "-"}</div>
          </div>
        </Link>
      ))}
    </main>
  );
}
