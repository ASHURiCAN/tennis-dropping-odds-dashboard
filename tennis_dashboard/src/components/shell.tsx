import { NavLink } from "react-router-dom";
import { Compass, Layers, TrendingUp, SlidersHorizontal, Table2, Grid3x3, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Découverte", end: true, icon: Compass },
  { to: "/oos", label: "OOS", end: false, icon: Layers },
  { to: "/favorite-roi", label: "Favori-ROI", end: false, icon: TrendingUp },
  { to: "/params", label: "Params", end: false, icon: SlidersHorizontal },
];

const NAV_ANALYSIS = [
  { to: "/signals", label: "Signaux explorer", icon: Table2 },
  { to: "/heatmap", label: "Heatmap", icon: Grid3x3 },
  { to: "/lab", label: "Lab", icon: FlaskConical },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 md:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-5 py-5">
          <div className="font-display text-lg tracking-tight">Tennis BT</div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">dropping-odds lab</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4 opacity-70" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-border px-3 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          Analyse
        </div>
        <nav className="flex-1 space-y-1 px-3 pb-3">
          {NAV_ANALYSIS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4 opacity-70" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-border px-5 py-4 text-[11px] text-muted-foreground">
          Visualisation seule · données figées été 2026
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-card/95 backdrop-blur md:hidden">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-5 w-5", isActive && "opacity-100")} />
                {item.label}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-border px-6 py-4">
      <h1 className="font-display text-xl tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
