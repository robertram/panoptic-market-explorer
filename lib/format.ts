export const fmtNum = (n: number, d = 4) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: d }).format(n);

export const fmtCompact = (n: number) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n); 