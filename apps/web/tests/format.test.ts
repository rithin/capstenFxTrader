import { describe, expect, it } from "vitest";

import { formatMoney, formatNumber, formatQuantity, formatSignedMoney, formatSignedPercent, tone } from "@/lib/format";

describe("format", () => {
  it("formats INR with lakh grouping", () => {
    expect(formatMoney("1004821.50")).toBe("₹10,04,821.50");
    expect(formatQuantity("100000")).toBe("1,00,000");
  });

  it("formats USD and USDT", () => {
    expect(formatMoney("1234.5", "USD")).toBe("$1,234.50");
    expect(formatMoney("152.75", "USDT")).toBe("152.75 USDT");
  });

  it("always signs P&L with + or a real minus", () => {
    expect(formatSignedMoney("2010.00")).toBe("+₹2,010.00");
    expect(formatSignedMoney("-311.00")).toBe("−₹311.00");
    expect(formatSignedMoney("0")).toBe("₹0.00");
    expect(formatSignedPercent("0.48")).toBe("+0.48%");
    expect(formatSignedPercent("-1.2")).toBe("−1.20%");
  });

  it("keeps decimal strings exact (no float rounding)", () => {
    expect(formatNumber("0.1", 1)).toBe("0.1");
    expect(formatMoney("12345678901234567.89", "USD")).toBe("$12,345,678,901,234,567.89");
  });

  it("derives tone from the sign", () => {
    expect(tone("5")).toBe("gain");
    expect(tone("-0.01")).toBe("loss");
    expect(tone("-0.00")).toBe("neutral");
    expect(tone("0")).toBe("neutral");
  });
});
