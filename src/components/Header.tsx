import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, LayoutDashboard, Shield, MessageSquare, MapPin, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const t = useT();

  const navLinks = [
    { to: "/browse", label: t("nav.findTasks") },
    { to: "/services", label: "Tjänster" },
    { to: "/post-task", label: t("nav.postTask") },
    { to: "/how-it-works", label: t("nav.howItWorks") },
  ];

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      {/* Mobile app header */}
      <div className="md:hidden">
        <div className="flex h-[68px] items-center justify-between px-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/apple-touch-icon.png"
              alt="Moas"
              className="h-10 w-10 rounded-2xl object-cover"
            />
            <span className="text-[22px] font-bold font-display text-foreground tracking-tight">Moas</span>
          </Link>

          {/* City selector */}
          <button className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-[13px] font-medium text-foreground shadow-sm">
            <MapPin size={14} className="text-primary" />
            <span>Jönköping</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          <div className="flex items-center gap-2">
            {/* Admin shortcut (admins only) */}
            {isAdmin && (
              <Link
                to="/admin"
                aria-label="Admin"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 active:scale-95 transition-transform"
              >
                <Shield size={18} />
              </Link>
            )}

            {/* Profile avatar */}
            <Link
              to={user ? "/dashboard" : "/auth"}
              className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-[12px] font-bold text-primary border border-primary/20">
                {userInitials || "M"}
              </div>
              <span className="text-[10px] text-muted-foreground leading-none">Min profil</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/apple-touch-icon.png"
              alt="Moas"
              className="h-9 w-9 rounded-xl object-cover"
            />
            <span className="text-xl font-bold font-display text-foreground">Moas</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User size={16} />
                    {t("nav.account")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard size={14} />
                      {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center gap-2">
                      <MessageSquare size={14} />
                      {t("nav.messages")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings size={14} />
                      {t("nav.settings")}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 text-destructive">
                          <Shield size={14} />
                          {t("nav.admin")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2">
                    <LogOut size={14} />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">{t("nav.login")}</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth">{t("nav.getStarted")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
