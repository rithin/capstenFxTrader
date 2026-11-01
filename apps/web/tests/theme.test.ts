import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { colors, textPairs } from "@/lib/theme";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("theme tokens", () => {
  it.each(textPairs)("%s text on %s reaches WCAG AA 4.5:1", (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("globals.css defines every token with the same value as theme.ts", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    for (const [name, value] of Object.entries(colors)) {
      const cssName = name === "border" ? "border" : kebab(name);
      const match = css.match(new RegExp(`--${cssName}:\\s*(#[0-9A-Fa-f]{6})`));
      expect(match?.[1]?.toUpperCase(), `--${cssName}`).toBe(value.toUpperCase());
    }
  });

  it("has no dark theme", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).not.toMatch(/\.dark\s*\{/);
  });
});
