import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, MessageSquare, User, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDDEN_PATHS = [/^\/auth/, /^\/onboarding/, /^\/checkout\//];

const items = [
  { to: "/", icon: Home, label: "Hem", match: (p: string) => p === "/" },
  { to: "/browse", icon: Search, label: "Uppdrag", match: (p: string) => p.startsWith("/browse") || p.startsWith("/task/") },
  { to: "/post-task", icon: Plus, label: "Skapa", center: true, match: (p: string) => p.startsWith("/post-task") },
  { to: "/messages", icon: MessageSquare, label: "Meddelanden", match: (p: string) => p.startsWith("/messages") },
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
      <ul className="grid grid-cols-6 items-end px-1 pt-1.5 pb-1">
        {items.map((item) => {
          const active = item.match(location.pathname);
          const Icon = item.icon;
          if (item.center) {
            return (
              <li key={item.to} className="flex flex-col items-center -mt-7">
                <Link
                  to={item.to}
                  aria-label={item.label}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl ring-4 ring-card transition-transform active:scale-95"
                >
                  <Icon size={30} strokeWidth={2.6} />
                </Link>
                <span className="text-[10px] font-semibold text-accent mt-1 leading-none">{item.label}</span>
              </li>
            );
          }
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-2.5 min-h-[60px] text-[10px] font-medium transition-colors",
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
