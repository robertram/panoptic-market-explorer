"use client";
import { useEffect, useMemo, useState } from "react";
import { Address, MarketDetail } from "../../lib/types";
import { fmtNum } from "../../lib/format";
import { approve, deposit, getAllowance, getBalance } from "../../lib/mocks";
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