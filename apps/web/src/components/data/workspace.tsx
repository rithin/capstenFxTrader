import type { ReactNode } from "react";

/**
 * Main content + right rail. The rail sits beside the content on wide screens and stacks below it
 * under ~1100 px (flex-wrap: content basis 640 px + rail basis 340 px + gap).
 */
export function Workspace({ main, rail }: { main: ReactNode; rail?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-5">{main}</div>
      {rail && (
        <aside aria-label="Side panel" className="flex min-w-[min(300px,100%)] flex-[1_1_340px] flex-col gap-5">
          {rail}
        </aside>
      )}
    </div>
  );
}
