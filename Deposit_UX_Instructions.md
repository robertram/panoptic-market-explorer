# Cursor Prompt — Deposit UX (No Web3 Integration)

## Goal
Implement the Deposit into Collateral Trackers feature on `/markets/[poolAddress]` using Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + lucide-react. No wallet connection, wagmi, rainbowkit, or on-chain calls. Use mock data + fake async actions.

## File Structure

### 1. `lib/types.ts` — Minimal Types
Define types for addresses, tokens, and market details.

```typescript
export type Address = `0x${string}`;

export type TokenMeta = {
  address: Address;
  symbol: string;
  name?: string;
  decimals: number; // WBTC=8, WETH=18
};

export type TrackerMeta = {
  address: Address;         // collateral tracker address
  token: TokenMeta;         // underlying ERC-20 for this tracker
  totalAssets?: string;     // optional subgraph stats (string to avoid precision issues)
  totalShares?: string;
  poolUtilization?: string; // "0.38"
};

export type MarketDetail = {
  poolAddress: Address;
  token0: TokenMeta;
  token1: TokenMeta;
  collateral0: TrackerMeta;
  collateral1: TrackerMeta;
};
```

### 2. `lib/format.ts` — Helpers
Provide helper functions for formatting numbers.

```typescript
export const fmtNum = (n: number, d = 4) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: d }).format(n);

export const fmtCompact = (n: number) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n);
```

### 3. `lib/mocks.ts` — Mock Market + Fake Wallet State and Fake Async Actions
Create mock data and fake async actions to simulate wallet interactions.

```typescript
import { MarketDetail, Address } from "./types";

export const mockMarket: MarketDetail = {
  poolAddress: "0x000003493cb99a8c1e4f103d2b6333e4d195df7d",
  token0: { address: "0x2260fac5e5542a773aa44fbcfefd7c193bc2c599", symbol: "WBTC", name: "Wrapped BTC", decimals: 8 },
  token1: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
  collateral0: {
    address: "0xb310c6f625f519da965c587e22ff6ecb49809ed09" as Address,
    token: { address: "0x2260fac5e5542a773aa44fbcfefd7c193bc2c599", symbol: "WBTC", decimals: 8 },
    totalAssets: "760708942", totalShares: "74798258714992", poolUtilization: "0.38"
  },
  collateral1: {
    address: "0x1f8d600a0211dd76a8c1ac6065bc0816afd118ef" as Address,
    token: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", symbol: "WETH", decimals: 18 },
    totalAssets: "179496608855755003574", totalShares: "17576676480897053102684927", poolUtilization: "0.52"
  },
};

// Fake wallet state (in-memory)
export const fakeWallet = {
  balances: new Map<Address, bigint>([
    [mockMarket.token0.address as Address,  5_00000000n],          // 5 WBTC (8 decimals)
    [mockMarket.token1.address as Address, 20_00000000000000000n], // 20 WETH (18 decimals)
  ]),
  allowances: new Map<Address, bigint>(), // key = tokenAddr|spender concat
};

const key = (token: Address, spender: Address) => `${token.toLowerCase()}|${spender.toLowerCase()}`;

export async function getBalance(token: Address): Promise<bigint> {
  await new Promise(r => setTimeout(r, 150));
  return fakeWallet.balances.get(token) ?? 0n;
}

export async function getAllowance(token: Address, spender: Address): Promise<bigint> {
  await new Promise(r => setTimeout(r, 150));
  return fakeWallet.allowances.get(key(token, spender) as Address) ?? 0n;
}

// Fake approve: set allowance = amount
export async function approve(token: Address, spender: Address, amount: bigint) {
  await new Promise(r => setTimeout(r, 650));
  fakeWallet.allowances.set(key(token, spender) as Address, amount);
  return { hash: "0xmock-approve" };
}

// Fake deposit: deduct balance, noop shares
export async function deposit(token: Address, tracker: Address, amount: bigint) {
  await new Promise(r => setTimeout(r, 950));
  const cur = fakeWallet.balances.get(token) ?? 0n;
  if (amount > cur) throw new Error("Insufficient balance");
  fakeWallet.balances.set(token, cur - amount);
  return { hash: "0xmock-deposit" };
}
```

### 4. `components/DepositPanel.tsx` — The UX (Approve → Deposit Stepper with Mocks)
Implement the user interface for the deposit process.

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { Address, MarketDetail } from "@/lib/types";
import { fmtNum } from "@/lib/format";
import { approve, deposit, getAllowance, getBalance } from "@/lib/mocks";
import { Check, Copy, Info, Loader2 } from "lucide-react";

type Side = "token0" | "token1";

function toBigInt(amount: string, decimals: number): bigint {
  if (!amount) return 0n;
  const [i, f = ""] = amount.split(".");
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(i || "0") * BigInt(10) ** BigInt(decimals) + BigInt(frac || "0");
}
function fromBigInt(v: bigint, decimals: number): string {
  const s = v.toString().padStart(decimals + 1, "0");
  const i = s.slice(0, -decimals);
  const f = s.slice(-decimals).replace(/0+$/, "");
  return f ? `${i}.${f}` : i;
}

export default function DepositPanel({
  market, side,
}: { market: MarketDetail; side: Side }) {
  const meta = useMemo(() => {
    const t = side === "token0" ? market.token0 : market.token1;
    const c = side === "token0" ? market.collateral0 : market.collateral1;
    return { token: t, tracker: c };
  }, [market, side]);

  const [amount, setAmount] = useState<string>("");
  const [balance, setBalance] = useState<bigint>(0n);
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [busy, setBusy] = useState<"idle"|"approving"|"depositing">("idle");
  const [toast, setToast] = useState<string>("");

  // load balance/allowance on mount & when amount changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [b, a] = await Promise.all([
        getBalance(meta.token.address as Address),
        getAllowance(meta.token.address as Address, meta.tracker.address as Address),
      ]);
      if (!cancelled) { setBalance(b); setAllowance(a); }
    })();
    return () => { cancelled = true; }
  }, [meta.token.address, meta.tracker.address]);

  const parsed = toBigInt(amount, meta.token.decimals);
  const needsApprove = parsed > allowance;
  const insuff = parsed === 0n || parsed > balance;

  async function onApprove() {
    try {
      setBusy("approving");
      await approve(meta.token.address as Address, meta.tracker.address as Address, parsed);
      setToast("Allowance updated");
      const a = await getAllowance(meta.token.address as Address, meta.tracker.address as Address);
      setAllowance(a);
    } catch (e:any) {
      setToast(e.message || "Approve failed");
    } finally {
      setBusy("idle");
    }
  }
  async function onDeposit() {
    try {
      setBusy("depositing");
      await deposit(meta.token.address as Address, meta.tracker.address as Address, parsed);
      setToast("Deposit successful");
      const b = await getBalance(meta.token.address as Address);
      setBalance(b);
      setAmount("");
    } catch (e:any) {
      setToast(e.message || "Deposit failed");
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold">{side === "token0" ? "Collateral 0" : "Collateral 1"}</div>
        <div className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">{meta.token.symbol}</div>
        <button
          onClick={() => navigator.clipboard.writeText(meta.tracker.address)}
          className="ml-auto text-xs inline-flex items-center gap-1 opacity-70 hover:opacity-100"
          title="Copy tracker address"
        >
          <Copy size={14}/> Copy
        </button>
      </div>

      <div className="text-sm text-muted-foreground flex items-center gap-1">
        <Info size={14}/> Deposit the underlying token to receive tracker shares (simulated).
      </div>

      <div className="flex gap-2">
        <input
          type="number" inputMode="decimal" min={0} step="any"
          className="w-full rounded-xl border px-3 py-2 tabular-nums"
          placeholder={`Amount in ${meta.token.symbol}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="rounded-xl border px-3 py-2 text-sm"
          onClick={() => setAmount(fromBigInt(balance, meta.token.decimals))}
        >
          Max
        </button>
      </div>

      <div className="text-xs text-muted-foreground flex gap-6">
        <span>Balance: <span className="tabular-nums">{fmtNum(Number(fromBigInt(balance, meta.token.decimals)))}</span> {meta.token.symbol}</span>
        <span>Allowance → Tracker: <span className="tabular-nums">{fmtNum(Number(fromBigInt(allowance, meta.token.decimals)))}</span> {meta.token.symbol}</span>
      </div>

      <div className="flex gap-2">
        {needsApprove ? (
          <button
            disabled={busy!=="idle" || parsed===0n}
            onClick={onApprove}
            className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2"
          >
            {busy==="approving" && <Loader2 className="animate-spin" size={16}/>} 
            {busy==="approving" ? "Approving…" : `Approve ${meta.token.symbol}`}
          </button>
        ) : (
          <button
            disabled={busy!=="idle" || insuff}
            onClick={onDeposit}
            className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2"
          >
            {busy==="depositing" && <Loader2 className="animate-spin" size={16}/>} 
            {busy==="depositing" ? "Depositing…" : "Deposit"}
          </button>
        )}
        {!needsApprove && insuff && <div className="text-xs text-rose-600 self-center">Enter amount ≤ balance</div>}
      </div>

      {!!toast && (
        <div className="text-xs text-emerald-600 inline-flex items-center gap-1">
          <Check size={14}/> {toast}
        </div>
      )}
    </div>
  );
}
```

### 5. `app/markets/[pool]/page.tsx` — Render Two Panels with Mock Market
Render the deposit panels using mock data.

```tsx
import DepositPanel from "@/components/DepositPanel";
import { mockMarket } from "@/lib/mocks";

export default async function Page({ params }: { params: { pool: string } }) {
  const market = mockMarket; // ignore params for now; mock only
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Deposit — {market.token0.symbol}/{market.token1.symbol}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <DepositPanel market={market} side="token0" />
        <DepositPanel market={market} side="token1" />
      </div>
      <p className="text-xs text-muted-foreground">
        This is a UX-only simulation. Replace mocks with wagmi (approve + deposit) later.
      </p>
    </main>
  );
}
```

## UX Requirements

- Show two panels (Collateral 0 / Collateral 1) with token badge, amount input, Max, Allowance, Balance.
- Primary flow: Approve → Deposit with fake async spinners and success messages.
- Disable actions on invalid amount or while pending.
- Copy-address button on each panel.
- Numbers use tabular-nums and compact formatting.

## Acceptance Criteria

- Navigating to `/markets/anything` renders both deposit panels using mocks.
- Typing an amount larger than allowance shows Approve; after Approve, button flips to Deposit.
- Deposit reduces mock balance and clears the input.
- No blockchain libs are imported; all actions are simulated. 