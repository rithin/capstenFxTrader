import type { ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Render cell text in the tabular monospace number font. */
  numeric?: boolean;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Shown when rows is empty. */
  empty?: ReactNode;
  /** Max height before the body scrolls (header stays sticky). */
  maxHeight?: number;
  caption?: string;
};

/** Table with a sticky header that scrolls horizontally inside its own box (never the page). */
export function DataTable<T>({ columns, rows, rowKey, empty, maxHeight, caption }: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="min-w-0 overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader className="sticky top-0 z-10 bg-panel">
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead
                key={c.key}
                className={cn("h-9 px-4 text-xs font-medium text-ink-muted", c.align === "right" && "text-right", c.className)}
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} className="border-border-soft hover:bg-ivory">
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  className={cn("px-4 py-3 text-[13px]", c.align === "right" && "text-right", c.numeric && "num", c.className)}
                >
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
