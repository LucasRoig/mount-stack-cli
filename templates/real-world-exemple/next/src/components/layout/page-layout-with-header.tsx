import type { ReactNode } from "react";
import { Navbar } from "./navbar";

export function PageLayoutWithHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh h-dvh">
      <header className="w-full sticky top-0 z-10 bg-header-background h-(--header-height) shrink-0 border-b">
        <Navbar />
      </header>

      <main className="grow max-h-full overflow-auto flex flex-col">{children}</main>
    </div>
  )
}
