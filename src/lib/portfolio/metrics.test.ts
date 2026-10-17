import { describe, expect, it } from "vitest";
import { computeBenchmark, computePortfolio, xirr, type AssetSeries } from "./metrics";

const usd = (a: number) => a;

function series(points: [string, number][]): AssetSeries {
  return { currency: "USD", prices: points.map(([date, close]) => ({ date, close })), dividends: [] };
}

describe("xirr", () => {
  it("returns 10% for a one-year 10% gain", () => {
    const r = xirr([
      { date: "2023-01-01", amount: -1000 },
      { date: "2024-01-01", amount: 1100 },
    ]);
    expect(r).toBeCloseTo(0.1, 2);
  });

  it("returns null when all flows have the same sign", () => {
    expect(xirr([{ date: "2023-01-01", amount: -1 }, { date: "2023-02-01", amount: -1 }])).toBeNull();
  });
});

describe("computePortfolio", () => {
  const calendar = ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"];

  it("TWR ignores the timing of contributions while MWR does not", () => {
    // Price: 100 -> 200 -> 100 -> 100. Buy 1 at 100, then buy 9 more at the top.
    const assets = new Map([["X", series([["2024-01-01", 100], ["2024-01-02", 200], ["2024-01-03", 100], ["2024-01-04", 100]])]]);
    const res = computePortfolio(
      [
        { symbol: "X", type: "BUY", date: "2024-01-01", quantity: 1, price: 100, fee: 0 },
        { symbol: "X", type: "BUY", date: "2024-01-02", quantity: 9, price: 200, fee: 0 },
      ],
      assets,
      usd,
      calendar,
    );
    // Asset went 100 -> 100: time-weighted return is 0.
    expect(res.twr).toBeCloseTo(0, 10);
    // Invested 1900, worth 1000: money-weighted return is deeply negative.
    expect(res.totalValue).toBe(1000);
    expect(res.netInvested).toBe(1900);
    expect(res.mwr!).toBeLessThan(-0.4);
    expect(res.holdings[0]).toMatchObject({ symbol: "X", quantity: 10, avgCost: 190 });
  });

  it("treats sells as withdrawals and records realized P&L", () => {
    const assets = new Map([["X", series([["2024-01-01", 100], ["2024-01-02", 150], ["2024-01-03", 150], ["2024-01-04", 150]])]]);
    const res = computePortfolio(
      [
        { symbol: "X", type: "BUY", date: "2024-01-01", quantity: 2, price: 100, fee: 0 },
        { symbol: "X", type: "SELL", date: "2024-01-03", quantity: 1, price: 150, fee: 0 },
      ],
      assets,
      usd,
      calendar,
    );
    expect(res.twr).toBeCloseTo(0.5, 10);
    expect(res.realizedPnl).toBeCloseTo(50, 10);
    expect(res.totalValue).toBe(150);
    expect(res.netInvested).toBe(50);
  });

  it("counts dividends as return", () => {
    const asset = series([["2024-01-01", 100], ["2024-01-02", 100], ["2024-01-03", 100], ["2024-01-04", 100]]);
    asset.dividends = [{ date: "2024-01-03", amount: 5 }];
    const res = computePortfolio(
      [{ symbol: "X", type: "BUY", date: "2024-01-01", quantity: 1, price: 100, fee: 0 }],
      new Map([["X", asset]]),
      usd,
      calendar,
    );
    expect(res.dividendsReceived).toBe(5);
    expect(res.twr).toBeCloseTo(0.05, 10);
  });

  it("converts foreign-currency assets to the base currency", () => {
    const asset: AssetSeries = { currency: "ILS", prices: [{ date: "2024-01-01", close: 10 }], dividends: [] };
    const res = computePortfolio(
      [{ symbol: "Y", type: "BUY", date: "2024-01-01", quantity: 4, price: 10, fee: 0 }],
      new Map([["Y", asset]]),
      (a, c) => (c === "ILS" ? a / 4 : a),
      ["2024-01-01"],
    );
    expect(res.totalValue).toBe(10);
  });
});

describe("computeBenchmark", () => {
  it("replays the portfolio cash flows into the index", () => {
    const calendar = ["2024-01-01", "2024-01-02"];
    const asset = series([["2024-01-01", 100], ["2024-01-02", 100]]);
    const index = series([["2024-01-01", 1000], ["2024-01-02", 1100]]);
    const p = computePortfolio(
      [{ symbol: "X", type: "BUY", date: "2024-01-01", quantity: 1, price: 100, fee: 0 }],
      new Map([["X", asset]]),
      usd,
      calendar,
    );
    const b = computeBenchmark("IDX", "Index", index, p.series, usd)!;
    expect(b.twr).toBeCloseTo(0.1, 10);
    expect(b.value).toBeCloseTo(110, 10);
  });
});
