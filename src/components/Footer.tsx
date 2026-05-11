import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";

const Footer = () => {
  const t = useT();
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
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{t("footer.forCustomers")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/post-task" className="hover:text-foreground transition-colors">{t("nav.postTask")}</Link></li>
              <li><Link to="/browse" className="hover:text-foreground transition-colors">{t("nav.findTasks")}</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">{t("nav.howItWorks")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{t("footer.forTaskers")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/browse" className="hover:text-foreground transition-colors">{t("footer.findTasks")}</Link></li>
              <li><Link to="/become-tasker" className="hover:text-foreground transition-colors">{t("footer.becomeTasker")}</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">{t("footer.earnMoney")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{t("footer.company")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">{t("footer.about")}</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">{t("footer.terms")}</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">{t("footer.privacy")}</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">{t("footer.contact")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
