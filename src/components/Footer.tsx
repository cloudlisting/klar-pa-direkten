import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">T</span>
              </div>
              <span className="text-lg font-bold font-display text-foreground">Taskly</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sveriges marknadsplats för vardagstjänster. Hitta hjälp eller hjälp andra.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">För kunder</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/post-task" className="hover:text-foreground transition-colors">Publicera uppdrag</Link></li>
              <li><Link to="/browse" className="hover:text-foreground transition-colors">Bläddra uppdrag</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">Så fungerar det</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">För taskers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/browse" className="hover:text-foreground transition-colors">Hitta uppdrag</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Bli tasker</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Hur du tjänar pengar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Företag</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-foreground transition-colors">Om oss</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Villkor</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Integritetspolicy</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Kontakta oss</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 Taskly. Alla rättigheter förbehållna.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
