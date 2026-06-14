import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, MessageSquare, User, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDDEN_PATHS = [/^\/auth/, /^\/onboarding/, /^\/checkout\//];

const items = [
  { to: "/", icon: Home, label: "Hem", match: (p: string) => p === "/" },
  { to: "/browse", icon: Search, label: "Uppdrag", match: (p: string) => p.startsWith("/browse") || p.startsWith("/task/") },
  { to: "/post-task", icon: Plus, label: "Skapa", center: true, match: (p: string) => p.startsWith("/post-task") },
  { to: "/my-tasks", icon: ClipboardList, label: "Mina uppdrag", match: (p: string) => p.startsWith("/my-tasks") },
  { to: "/dashboard", icon: User, label: "Profil", match: (p: string) => p.startsWith("/dashboard") || p.startsWith("/settings") },
];

const MobileBottomNav = () => {
  const location = useLocation();
  if (HIDDEN_PATHS.some((r) => r.test(location.pathname))) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-lg pb-safe"
      aria-label="Mobilnavigation"
    >
      <ul className="grid grid-cols-5 items-end">
        {items.map((item) => {
          const active = item.match(location.pathname);
          const Icon = item.icon;
          if (item.center) {
            return (
              <li key={item.to} className="flex justify-center -mt-5">
                <Link
                  to={item.to}
                  aria-label={item.label}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-card transition-transform active:scale-95"
                >
                  <Icon size={26} strokeWidth={2.4} />
                </Link>
              </li>
            );
          }
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
