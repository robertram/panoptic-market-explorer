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