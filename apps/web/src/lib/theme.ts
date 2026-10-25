// Design tokens from the approved UI design (docs/ARCHITECTURE.md §7).
// globals.css holds the same values as CSS variables; tests/theme.test.ts keeps the two in sync
// and checks text contrast.

export const colors = {
  ivory: "#FAF9F5", // page ground
  panel: "#FFFFFF", // cards and panels
  surface: "#F3F1EA", // top bar, footer, subtle fills
  border: "#E6E2D8",
  borderSoft: "#EFECE4",
  ink: "#141413", // primary text
  inkSoft: "#3D3D3A", // secondary text
  inkMuted: "#5E5D59", // labels, captions
  clay: "#D97757", // accent: charts, meters, decoration (not for small text)
  clayStrong: "#B35838", // primary buttons, avatar (design had #C15F3C: 4.2:1 with white text, below AA)
  clayBg: "#F6E3D9",
  gain: "#2F6F9F",
  gainStrong: "#1F4E73",
  gainBg: "#E4EEF6",
  loss: "#A9502F",
  lossStrong: "#8A3F22",
  lossBg: "#F6E3D9",
  neutralDot: "#8E8B82",
} as const;

export type ColorToken = keyof typeof colors;

/** Text/background pairs used by components. Each must reach WCAG AA (4.5:1). */
export const textPairs: Array<[ColorToken, ColorToken]> = [
  ["ink", "ivory"],
  ["ink", "panel"],
  ["ink", "surface"],
  ["inkSoft", "panel"],
  ["inkMuted", "ivory"],
  ["inkMuted", "panel"],
  ["inkMuted", "surface"],
  ["gain", "panel"],
  ["gain", "ivory"],
  ["loss", "panel"],
  ["loss", "ivory"],
  ["gainStrong", "gainBg"],
  ["lossStrong", "lossBg"],
  ["lossStrong", "clayBg"],
  ["panel", "clayStrong"],
  ["ivory", "clayStrong"],
];
