import Link from "next/link";
import type { ReactNode } from "react";

const navigationItems = [
  {
    href: "/sensor-readings",
    label: "Sensor Readings",
    description: "Live soil moisture telemetry",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950/5 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-background lg:block">
        <div className="flex h-16 items-center border-b px-6 text-lg font-semibold">
          Karsu Monitor
        </div>
        <nav className="space-y-1 px-4 py-6 text-sm">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 font-medium text-foreground transition hover:bg-slate-100"
            >
              <div>{item.label}</div>
              <p className="text-xs font-normal text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-600">
              KM
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
              <h1 className="text-lg font-semibold text-foreground">Sensor Operations</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/40 px-4 py-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
