# Panoptic Frontend Interview — Next Steps Guide

This guide assumes you’ve already run:

```bash
npx create-next-app@latest panoptic-interview --typescript --eslint
cd panoptic-interview
```

We’ll fetch the **50 oldest pools** from the Panoptic mainnet subgraph, render them, and set up a pool details route. At the end, you’ll be able to deploy and share a repo + live URL.

---

## 0) Install helpful deps (optional but recommended)

* **Tailwind** (styling):

  ```bash
  npx tailwindcss init -p
  ```

  Configure `tailwind.config.js`, include `./app/**/*.{ts,tsx}` in content. Add Tailwind to `app/globals.css`.

* **React Query / Wagmi / RainbowKit** (for Part 2 wallet writes later):

  ```bash
  npm i @tanstack/react-query @rainbow-me/rainbowkit wagmi viem
  ```

> You can skip wallet libraries until Part 2 if you want to keep Part 1 minimal.

---

## 1) Environment variable

Create `.env.local`:

```env
NEXT_PUBLIC_PANOPTIC_SUBGRAPH=https://api.goldsky.com/api/public/project_cl9gc21q105380hxuh8ks53k3/subgraphs/panoptic-subgraph-mainnet/prod/gn
```

> This is a **GraphQL** endpoint. You must **POST** JSON with `{ query, variables }`.

---

## 2) GraphQL helper

Create `lib/graphql.ts`:

```ts
export async function gqlFetch<T>(query: string, variables?: Record<string, any>) {
  const url = process.env.NEXT_PUBLIC_PANOPTIC_SUBGRAPH;
  if (!url) throw new Error("Missing NEXT_PUBLIC_PANOPTIC_SUBGRAPH");

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e: any) => e.message).join("; "));
  return json.data as T;
}
```

### Quick curl test (optional)

```bash
curl -s -X POST "$NEXT_PUBLIC_PANOPTIC_SUBGRAPH" \
  -H 'content-type: application/json' \
  -d '{"query":"query($first:Int!){panopticPools(first:$first,orderBy:createdBlockNumber,orderDirection:asc){id feeTier token0{symbol decimals} token1{symbol decimals} underlyingPool{ tick token0{decimals} token1{decimals} token1Price }}}","variables":{"first":50}}' | jq
```

If you see HTML, you performed a GET or set headers wrong. Use **POST** with JSON.

---

## 3) Uniswap tick → price helper

Create `lib/math.ts`:

```ts
export function feeTierToPercent(feeTierBps: number) {
  // 3000 -> 0.3%
  return `${(feeTierBps / 1e4).toFixed(1)}%`;
}

export function priceFromTick(tick: number, token0Decimals: number, token1Decimals: number) {
  // price of token1 per 1 token0
  const ratio = Math.pow(1.0001, tick);
  const decimalAdj = Math.pow(10, token0Decimals - token1Decimals);
  return ratio * decimalAdj;
}
```

> Some pools may not have an initialized `tick`. We’ll fall back to `token1Price` if needed.

---

## 4) Implement the list page (Part 1)

Create `app/page.tsx`:

```tsx
import Link from "next/link";
import { gqlFetch } from "@/lib/graphql";
import { feeTierToPercent, priceFromTick } from "@/lib/math";

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
```

**Notes**

* We link each row to `/markets/{poolAddress}` where `poolAddress` is `panopticPool.id`.
* `cache: "no-store"` in the fetch helper ensures fresh data in dev.

---

## 5) Pool details page (Part 2 skeleton)

Create `app/markets/[pool]/page.tsx`:

```tsx
import { gqlFetch } from "@/lib/graphql";
import { feeTierToPercent, priceFromTick } from "@/lib/math";

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
```

**Test addresses from prompt** (paste after `/markets/`):

* Unichain: `0x000003493cb99a8c1e4f103d2b6333e4d195df7d`
* Sepolia:  `0x0000ccd558655523091abbf63032d6265cc25673`

---

## 6) (Optional) API proxy if you hit CORS locally

Create `app/api/subgraph/route.ts`:

```ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_PANOPTIC_SUBGRAPH!;
  const body = await req.text();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body,
  });
  return new Response(await res.text(), { status: res.status, headers: { "content-type": "application/json" } });
}
```

Then point your client fetches to `/api/subgraph` instead of the Goldsky URL.

---

## 7) Scripts & run

Add to `package.json` (if missing):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

Run locally:

```bash
npm run dev
```

---

## 8) Deployment

* Push to GitHub and connect the repo to **Vercel** (free tier is fine).
* Add the env var `NEXT_PUBLIC_PANOPTIC_SUBGRAPH` in Vercel Project Settings → Environment Variables.
* Redeploy.

Share:

* GitHub repo URL
* Live app URL

---

## 9) Troubleshooting checklist

* **Error: “No value provided for required variable `first`”** → ensure your POST body includes a `variables` object or inline `first: 50` in the query.
* **HTML instead of JSON** → you’re likely doing a GET; ensure `method: "POST"` and `content-type: application/json`.
* **CORS in browser** → use the `/api/subgraph` proxy.
* **Price shows `-`** → pool may have `tick = null`; fallback uses `token1Price`.
* **Fee tier 3000 → 0.3%** → divide by 10,000 and format.

---

## 10) Stretch goals (nice-to-haves)

* Client-side search/filter by token symbols.
* Pagination (fetch next 50).
* Loading/skeleton states and error toasts.
* Persist selected network (mainnet, Sepolia, Unichain) via query param.
* Wallet connect + approve/deposit flows (Part 2 fully implemented):

  * `approve(underlyingToken, spender=collateralTrackerAddress, amount)`
  * `deposit(amount, receiver)`
  * Show tx hash + confirmations.

---

## 11) README snippet for your repo

Copy this section into your repo’s `README.md`:

````md
## Getting Started

1. Create `.env.local`:

   ```env
   NEXT_PUBLIC_PANOPTIC_SUBGRAPH=YOUR_SUBGRAPH_URL
````

2. Run dev server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

```

Good luck, and have fun! 🎯

```

## Updated Integration Guide

### Integration of Liquidity Pool List into MarketDetail Page

We have integrated the functionality from `app/page.tsx` into `src/pages/MarketDetail.tsx`. This allows the MarketDetail page to display a list of liquidity pools along with their details.

#### Steps Taken:
1. **Logic Extraction**: The logic for fetching and displaying the list of liquidity pools was moved from `app/page.tsx` to `MarketDetail.tsx`.
2. **Component Updates**: The `MarketDetail.tsx` file was updated to include the necessary imports and state management for displaying the pools.
3. **Interface Update**: The `PoolRow` interface was updated to include a `price` property to store the calculated price of each pool.

#### Notes:
- Ensure that the paths for `graphql` and `math` utilities are correctly set relative to the `src` directory.
- The list of pools is displayed using the existing styles from the project, maintaining a consistent look and feel.

This integration allows for a more cohesive user experience by consolidating the pool listing and detail views into a single page.
