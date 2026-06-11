import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "sv" | "en";

type Dict = Record<string, string>;

const sv: Dict = {
  // Nav
  "nav.findTasks": "Hitta uppdrag",
  "nav.postTask": "Publicera uppdrag",
  "nav.howItWorks": "Så fungerar det",
  "nav.login": "Logga in",
  "nav.getStarted": "Kom igång",
  "nav.account": "Konto",
  "nav.dashboard": "Dashboard",
  "nav.messages": "Meddelanden",
  "nav.settings": "Inställningar",
  "nav.admin": "Admin",
  "nav.logout": "Logga ut",
  // Hero
  "hero.badge": "🇸🇪 Sveriges trygga marknadsplats för uppdrag",
  "hero.title1": "Få saker gjorda",
  "hero.title2": "nära dig",
  "hero.subtitle": "Moas är en svensk marknadsplats där du kan lägga upp uppdrag och få hjälp av verifierade personer och företag i ditt område.",
  "hero.cta.post": "Publicera ett uppdrag",
  "hero.cta.browse": "Bläddra uppdrag",
  // Live feed
  "feed.title": "Uppdrag nära dig just nu",
  "feed.live": "Live",
  "feed.updating": "Uppdateras löpande",
  "feed.viewAll": "Se alla uppdrag",
  "feed.empty": "Inga uppdrag nära dig just nu. Publicera ett uppdrag eller kom tillbaka snart.",
  "feed.bids": "bud",
  "feed.urgent": "Brådskande",
  "feed.justNow": "Just nu",
  "feed.minAgo": "min sedan",
  "feed.hAgo": "tim sedan",
  "feed.dAgo": "dgr sedan",
  // Sections
  "sections.howTitle": "Så fungerar det",
  "sections.howSub": "Tre enkla steg till ett utfört uppdrag",
  "sections.categories": "Populära kategorier",
  "sections.categoriesSub": "Hitta rätt hjälp för varje behov",
  "sections.viewAll": "Visa alla",
  "sections.trustTitle": "Tryggt & säkert",
  "sections.trustText": "Betalningen hålls säker tills uppdraget är klart. Betyg, omdömen och verifierade profiler ger extra trygghet.",
  "sections.trustCta": "Kom igång gratis",
  // Steps
  "step1.title": "1. Publicera ditt uppdrag",
  "step1.desc": "Beskriv vad du behöver hjälp med, sätt en budget och välj plats.",
  "step2.title": "2. Få bud från taskers",
  "step2.desc": "Lokala taskers skickar sina bud. Jämför pris, betyg och erfarenhet.",
  "step3.title": "3. Välj och få det gjort",
  "step3.desc": "Acceptera ett bud, betala säkert via plattformen och lämna ett omdöme.",
  // Footer
  "footer.tagline": "Få saker gjorda nära dig. Moas är en svensk marknadsplats för lokala uppdrag, ärenden, hemtjänster, återvinning, hämtningar och vardagsjobb.",
  "footer.forCustomers": "För kunder",
  "footer.forTaskers": "För taskers",
  "footer.company": "Företag",
  "footer.findTasks": "Hitta uppdrag",
  "footer.becomeTasker": "Bli tasker",
  "footer.earnMoney": "Hur du tjänar pengar",
  "footer.about": "Om oss",
  "footer.terms": "Villkor",
  "footer.privacy": "Integritetspolicy",
  "footer.contact": "Kontakta oss",
  "footer.rights": "© 2026 Moas. Alla rättigheter förbehållna.",
  // Common
  "common.loading": "Laddar...",
  "common.open": "Öppen",
  "common.instant": "Direkt",
  "common.fixedPrice": "fast pris",
  "common.by": "av",
};

const en: Dict = {
  "nav.findTasks": "Find tasks",
  "nav.postTask": "Post a task",
  "nav.howItWorks": "How it works",
  "nav.login": "Log in",
  "nav.getStarted": "Get started",
  "nav.account": "Account",
  "nav.dashboard": "Dashboard",
  "nav.messages": "Messages",
  "nav.settings": "Settings",
  "nav.admin": "Admin",
  "nav.logout": "Log out",
  "hero.badge": "🇸🇪 Sweden's trust-first marketplace for tasks",
  "hero.title1": "Get things done",
  "hero.title2": "near you",
  "hero.subtitle": "Moas is a Swedish marketplace where you can post tasks and get help from verified people and companies nearby.",
  "hero.cta.post": "Post a task",
  "hero.cta.browse": "Browse tasks",
  "feed.title": "Tasks near you right now",
  "feed.live": "Live",
  "feed.updating": "Updated continuously",
  "feed.viewAll": "See all tasks",
  "feed.empty": "No tasks near you right now. Post a task or check back soon.",
  "feed.bids": "bids",
  "feed.urgent": "Urgent",
  "feed.justNow": "Just now",
  "feed.minAgo": "min ago",
  "feed.hAgo": "h ago",
  "feed.dAgo": "d ago",
  "sections.howTitle": "How it works",
  "sections.howSub": "Three simple steps to a completed task",
  "sections.categories": "Popular categories",
  "sections.categoriesSub": "Find the right help for every need",
  "sections.viewAll": "View all",
  "sections.trustTitle": "Safe & secure",
  "sections.trustText": "Payment is held securely until the task is complete. Ratings, reviews and verified profiles add extra trust.",
  "sections.trustCta": "Get started for free",
  "step1.title": "1. Post your task",
  "step1.desc": "Describe what you need help with, set a budget and choose a location.",
  "step2.title": "2. Get offers from taskers",
  "step2.desc": "Local taskers send their offers. Compare price, ratings and experience.",
  "step3.title": "3. Choose and get it done",
  "step3.desc": "Accept an offer, pay securely on the platform, and leave a review.",
  "footer.tagline": "Get things done near you. Moas is a Swedish marketplace for local tasks, errands, home services, recycling, pickups and everyday jobs.",
  "footer.forCustomers": "For customers",
  "footer.forTaskers": "For taskers",
  "footer.company": "Company",
  "footer.findTasks": "Find tasks",
  "footer.becomeTasker": "Become a tasker",
  "footer.earnMoney": "How to earn money",
  "footer.about": "About us",
  "footer.terms": "Terms",
  "footer.privacy": "Privacy policy",
  "footer.contact": "Contact us",
  "footer.rights": "© 2026 Taskly. All rights reserved.",
  "common.loading": "Loading...",
  "common.open": "Open",
  "common.instant": "Instant",
  "common.fixedPrice": "fixed price",
  "common.by": "by",
};

const dictionaries: Record<Lang, Dict> = { sv, en };

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "taskly_lang";

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "sv";
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return stored === "en" || stored === "sv" ? stored : "sv";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (key: string) => dictionaries[lang][key] ?? dictionaries.sv[key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};

export const useT = () => useI18n().t;
