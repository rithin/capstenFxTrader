import type { ReactNode } from "react";

export const metadata = { title: "Capsten FX Trader", description: "Automated trading dashboard" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0f1724", color: "#e6ebf2" }}>
        {children}
      </body>
    </html>
  );
}
