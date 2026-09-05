import { describe, expect, it } from "vitest";
import { formatPrice } from "@/src/lib/money";

describe("formatPrice", () => {
  it("always shows two decimals", () => {
    expect(formatPrice(155.5)).toBe("155.50");
    expect(formatPrice(153.61)).toBe("153.61");
    expect(formatPrice(50000)).toBe("50000.00");
  });

  it("rounds to the nearest cent", () => {
    expect(formatPrice(33.836)).toBe("33.84");
    expect(formatPrice(33.834)).toBe("33.83");
  });
});