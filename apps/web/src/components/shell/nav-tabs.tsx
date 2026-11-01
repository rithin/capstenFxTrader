"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/", label: "Live" },
  { href: "/trades", label: "Trades" },
  { href: "/backtests", label: "Backtests" },
  { href: "/strategies", label: "Strategies" },
  { href: "/risk", label: "Risk" },
  { href: "/brokers", label: "Brokers" },
  { href: "/alerts", label: "Alerts" },
] as const;

export function NavTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="order-last -mx-1 flex w-full flex-nowrap gap-1 overflow-x-auto px-1 pb-0.5 lg:order-none lg:mx-0 lg:w-auto lg:flex-auto lg:flex-wrap lg:overflow-visible lg:px-0"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center rounded-lg px-3.5 text-sm text-ink-muted transition-colors hover:bg-panel/70 hover:text-ink",
              active && "bg-panel font-medium text-ink ring-1 ring-border",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
