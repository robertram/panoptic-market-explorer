import { gqlFetch } from "../../../lib/graphql";
import { feeTierToPercent, priceFromTick } from "../../../lib/math";

const QUERY = `
query PoolDetail($id: ID!) {
  panopticPool(id: $id) {
    id
    feeTier
    token0 { symbol decimals name id }
    token1 { symbol decimals name id }
    underlyingPool {
      id
      tick
      token0 { decimals }
      token1 { decimals }
      token0Price
      token1Price
      totalValueLockedUSD
      liquidity
      tickLastUpdateTimestamp
    }
    collateral0 { id token { symbol decimals } totalShares totalAssets }
    collateral1 { id token { symbol decimals } totalShares totalAssets }
    chunks(first: 50, orderBy: netLiquidity, orderDirection: desc) {
      id
      netLiquidity
      longCounts
      shortCounts
    }
  }
}`;

export default async function Page({ params }: { params: { pool: string } }) {
  const { pool } = params;
  const data = await gqlFetch<{ panopticPool: any }>(QUERY, { id: pool.toLowerCase() });
  const p = data.panopticPool;
  const u = p?.underlyingPool;
  const price = u?.tick != null ? priceFromTick(u.tick, u.token0.decimals, u.token1.decimals) : Number(u?.token1Price ?? 0);

  console.log('data', data);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{p.token0.symbol}/{p.token1.symbol}</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Fee Tier</div>
          <div className="text-xl">{feeTierToPercent(Number(p.feeTier))}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Market Cap (TVL, USD)</div>
          <div className="text-xl">{Number(u?.totalValueLockedUSD ?? 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border p-4 col-span-2">
          <div className="text-sm text-muted-foreground">Current Price (token1 per token0)</div>
          <div className="text-xl">{Number.isFinite(price) ? price.toPrecision(8) : "-"}</div>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Positions Overview</h2>
        <div className="text-sm text-muted-foreground">Top chunks by net liquidity</div>
        <div className="grid grid-cols-3 gap-2 font-medium border-b pb-2">
          <div>Chunk</div><div>Net Liquidity</div><div>Long / Short</div>
        </div>
        {p.chunks?.map((c: any) => (
          <div key={c.id} className="grid grid-cols-3 gap-2 py-1">
            <div className="truncate">{c.id}</div>
            <div>{Number(c.netLiquidity).toLocaleString()}</div>
            <div>{c.longCounts} / {c.shortCounts}</div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Deposit (Collateral Trackers)</h2>
        <p className="text-sm text-muted-foreground">For testing, use Sepolia or Unichain markets. You’ll need to approve the token, then call <code>deposit(assets, receiver)</code> on the tracker.</p>
        <ul className="list-disc list-inside text-sm">
          <li>collateral0: {p.collateral0?.id}</li>
          <li>collateral1: {p.collateral1?.id}</li>
        </ul>
        {/* Implement wallet + approve + deposit in Part 2 (wagmi writeContract). */}
      </section>
    </main>
  );
} 