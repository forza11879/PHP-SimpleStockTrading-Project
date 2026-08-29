import { beforeEach, describe, expect, it } from "vitest";
import { count, query } from "@/src/lib/db";
import { freshDb } from "@/src/test/db";

beforeEach(() => freshDb());

describe("in-memory database", () => {
  it("is seeded like production", () => {
    expect(count("users")).toBe(3);
    expect(count("symbols")).toBe(12);
    expect(count("portfolios")).toBe(6);
    expect(count("transactions")).toBe(8);
  });

  it("runs queries against the seeded data", () => {
    const rows = query("SELECT symbol, name FROM symbols WHERE id = 1");
    expect(rows).toEqual([{ symbol: "AAPL", name: "Apple Inc." }]);
  });
});