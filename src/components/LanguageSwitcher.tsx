import { useI18n } from "@/lib/i18n";

const LanguageSwitcher = () => {
  const { lang, setLang } = useI18n();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <button
        type="button"
        onClick={() => setLang("sv")}
        aria-label="Svenska"
        title="Svenska"
        className={`flex h-7 w-7 items-center justify-center rounded-full text-base transition-all ${
          lang === "sv" ? "bg-secondary scale-110 ring-1 ring-primary/30" : "opacity-60 hover:opacity-100"
        }`}
      >
        🇸🇪
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-label="English"
        title="English"
        className={`flex h-7 w-7 items-center justify-center rounded-full text-base transition-all ${
          lang === "en" ? "bg-secondary scale-110 ring-1 ring-primary/30" : "opacity-60 hover:opacity-100"
        }`}
      >
        🇬🇧
      </button>
    </div>
  );
};

export default LanguageSwitcher;
