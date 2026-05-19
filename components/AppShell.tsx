import { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-6">{children}</div>
  );
}
