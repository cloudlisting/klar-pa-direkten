import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryGrid from "@/components/CategoryGrid";
import HeroTaskFeed from "@/components/HeroTaskFeed";
import ServiceMarquee from "@/components/ServiceMarquee";
import NearbyServicesRow from "@/components/NearbyServicesRow";
import PaymentMethods from "@/components/PaymentMethods";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Zap, Star, CheckCircle, Plus, MapPin, Heart, Clock } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-interior.png";
import { useT } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getCategoryFallbackImage } from "@/lib/categoryImages";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

type Task = Tables<"tasks">;
type FeedTask = Task & { offers_count: number; photo_url?: string };

const STORAGE_CITY_KEY = "taskly_user_city";

const CATEGORY_BG_COLORS: Record<string, string> = {
  waste: "bg-emerald-100",
  errands: "bg-orange-100",
  moving: "bg-blue-100",
  assembly: "bg-rose-100",
  handyman: "bg-amber-100",
  cleaning: "bg-sky-100",
  gardening: "bg-green-100",
  tech: "bg-violet-100",
  pets: "bg-pink-100",
  other: "bg-gray-100",
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Nyss";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `${days} d`;
};

const Index = () => {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nearbyTasks, setNearbyTasks] = useState<FeedTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const userCity = typeof window !== "undefined" ? localStorage.getItem(STORAGE_CITY_KEY) : null;

  useEffect(() => {
    let mounted = true;

    const fetchFeed = async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .in("status", ["published", "instant_open", "in_bidding"] as any)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(8);

      if (userCity) {
        query = query.eq("city", userCity);
      }

      let { data, error } = await query;

      if (!error && (!data || data.length === 0) && userCity) {
        const fallback = await supabase
          .from("tasks")
          .select("*")
          .in("status", ["published", "instant_open", "in_bidding"] as any)
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .limit(8);
        data = fallback.data;
        error = fallback.error;
      }

      if (!error && data && mounted) {
        const ids = data.map((d) => d.id);
        const [{ data: offerCounts }, { data: photos }] = await Promise.all([
          supabase.from("offers").select("task_id").in("task_id", ids),
          supabase
            .from("task_photos")
            .select("task_id, url")
            .in("task_id", ids)
            .limit(1, { foreignTable: "task_photos" }),
        ]);
        const counts: Record<string, number> = {};
        offerCounts?.forEach((o) => {
          counts[o.task_id] = (counts[o.task_id] || 0) + 1;
        });
        const photoMap: Record<string, string> = {};
        photos?.forEach((p) => {
          if (!photoMap[p.task_id]) photoMap[p.task_id] = p.url;
        });
        setNearbyTasks(data.map((d) => ({ ...d, offers_count: counts[d.id] || 0, photo_url: photoMap[d.id] })));
      }
      if (mounted) setLoadingTasks(false);
    };

    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userCity]);

  return (
    <Layout>
      {/* ============ MOBILE APP HOME ============ */}
      <section className="md:hidden bg-background">
        <div className="px-4 pt-3 pb-28">
          {/* Hero card */}
          <div className="mb-4 rounded-[28px] border border-border bg-gradient-to-br from-white via-white to-primary/5 shadow-sm px-4 py-5">
            <div className="grid grid-cols-[1.1fr_0.9fr] gap-3 items-center mb-4">
              <div>
                <h1 className="text-[24px] font-bold font-display text-foreground leading-[1.05] tracking-tight mb-2">
                  Vad behöver du hjälp med idag?
                </h1>
                <p className="text-[12.5px] text-muted-foreground leading-snug">
                  Skapa ett uppdrag på mindre än en minut och få svar från lokala utförare.
                </p>
              </div>

              <div className="relative h-[120px] overflow-hidden rounded-[22px] bg-primary/5">
                <img src={heroImage} alt="Inredning" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate("/post-task")}
                className="flex items-center justify-center gap-1.5 h-[44px] rounded-2xl bg-accent text-accent-foreground text-[13px] font-semibold shadow-md active:scale-[0.98] transition-transform"
              >
                <Plus size={16} strokeWidth={3} />
                <span className="whitespace-nowrap">Skapa uppdrag</span>
              </button>

              <button
                onClick={() => navigate("/browse")}
                className="flex items-center justify-center gap-1.5 h-[44px] rounded-2xl bg-card border border-border text-[13px] font-semibold text-foreground shadow-sm active:scale-[0.98] transition-transform"
              >
                <MapPin size={14} className="text-primary" />
                <span className="whitespace-nowrap">Se uppdrag nära dig</span>
              </button>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mb-5 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="flex flex-col items-center px-2 text-center">
                <Shield size={16} className="mb-1 text-primary" />
                <p className="text-[10.5px] font-semibold text-foreground leading-tight">Verifierade</p>
                <p className="text-[8.5px] text-muted-foreground leading-tight">BankID</p>
              </div>
              <div className="flex flex-col items-center px-2 text-center">
                <CheckCircle size={16} className="mb-1 text-primary" />
                <p className="text-[10.5px] font-semibold text-foreground leading-tight">Säker betalning</p>
                <PaymentMethods showUpcoming className="mt-1 justify-center gap-1" />
              </div>
              <div className="flex flex-col items-center px-2 text-center">
                <Star size={16} className="mb-1 text-primary" />
                <p className="text-[10.5px] font-semibold text-foreground leading-tight">Omdömen</p>
                <p className="text-[8.5px] text-muted-foreground leading-tight">Efter jobb</p>
              </div>
            </div>
          </div>

          {/* Nearby tasks - horizontal cards (moved above popular) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[19px] font-bold font-display text-foreground">Uppdrag nära dig</h2>
              <Link to="/browse" className="text-[13px] text-primary font-semibold flex items-center gap-1">
                Visa alla <ArrowRight size={14} />
              </Link>
            </div>

            {loadingTasks ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-w-[180px] h-[260px] rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : nearbyTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">Inga uppdrag hittades.</p>
                <Button variant="hero" size="sm" onClick={() => navigate("/post-task")}>
                  Skapa uppdrag
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x">
                {nearbyTasks.slice(0, 6).map((task) => {
                  const budget = task.budget_max_sek || task.budget_min_sek || 0;
                  const isUrgent =
                    task.preferred_date && new Date(task.preferred_date).getTime() - Date.now() < 1000 * 60 * 60 * 48;
                  const catColor = CATEGORY_BG_COLORS[task.category?.toLowerCase() || "other"] || "bg-gray-100";

                  return (
                    <Link
                      key={task.id}
                      to={`/task/${task.id}`}
                      className="min-w-[180px] max-w-[180px] snap-start block rounded-2xl border border-border bg-card overflow-hidden shadow-card transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                    >
                      <div
                        className={`relative h-[125px] ${task.photo_url ? "" : catColor} flex items-center justify-center overflow-hidden`}
                      >
                        <img
                          src={task.photo_url || getCategoryFallbackImage(task.category, task.title)}
                          alt={task.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={`text-[10px] font-semibold px-2 py-0.5 ${
                              isUrgent
                                ? "bg-accent text-accent-foreground border-0"
                                : "bg-primary text-primary-foreground border-0"
                            }`}
                          >
                            {isUrgent ? "Snabbt" : "Flexibelt"}
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <span className="text-[10px] font-semibold bg-white/95 text-foreground px-2 py-0.5 rounded-md shadow-sm">
                            {(Math.random() * 2 + 0.3).toFixed(1)} km
                          </span>
                        </div>
                      </div>

                      <div className="p-3">
                        <h3 className="text-[13px] font-semibold text-foreground line-clamp-2 mb-1.5 min-h-[34px] leading-snug">
                          {task.title}
                        </h3>
                        <p className="text-[15px] font-bold text-accent mb-1.5">{budget.toLocaleString("sv-SE")} kr</p>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={11} />
                            {task.city}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => e.preventDefault()}
                            className="p-1 rounded-full hover:bg-secondary transition-colors shrink-0"
                            aria-label="Spara uppdrag"
                          >
                            <Heart size={15} className="text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          {/* Offered services row */}
          <NearbyServicesRow city={userCity ?? null} />


          {/* Popular services */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[19px] font-bold font-display text-foreground">Populära tjänster</h2>
              <Link to="/browse" className="text-[13px] text-primary font-semibold flex items-center gap-1">
                Visa alla <ArrowRight size={14} />
              </Link>
            </div>
            <CategoryGrid />
          </div>
        </div>
      </section>

      {/* ============ DESKTOP HOME ============ */}
      <div className="hidden md:block">
        {/* Hero */}
        <section className="relative overflow-hidden bg-primary">
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/70" />
          </div>
          <div className="container relative py-16 md:py-20 lg:py-24">
            {/* Two-column layout: text left, feed right */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Left: Hero text */}
              <div className="max-w-xl pt-4">
                <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                  <Badge variant="accent" className="mb-4 text-sm px-3 py-1">
                    {t("hero.badge")}
                  </Badge>
                </motion.div>
                <motion.h1
                  className="text-4xl font-bold text-primary-foreground md:text-5xl lg:text-6xl font-display leading-tight mb-5"
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={1}
                >
                  {t("hero.title1")} <span className="text-accent">{t("hero.title2")}</span>
                </motion.h1>
                <motion.p
                  className="text-lg text-primary-foreground/80 mb-8 max-w-lg"
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={2}
                >
                  {t("hero.subtitle")}
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3"
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={3}
                >
                  <Button variant="accent" size="xl" asChild>
                    <Link to="/post-task">
                      {t("hero.cta.post")}
                      <ArrowRight size={18} />
                    </Link>
                  </Button>
                  <Button
                    variant="hero-outline"
                    size="xl"
                    className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    asChild
                  >
                    <Link to="/browse">{t("hero.cta.browse")}</Link>
                  </Button>
                </motion.div>
              </div>

              {/* Right: Vertical live feed (desktop only) */}
              <div className="hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                >
                  <HeroTaskFeed />
                </motion.div>
              </div>
            </div>

            {/* Bottom: Horizontal service marquee */}
            <ServiceMarquee />
          </div>
        </section>

        {/* Mobile: standalone live feed */}
        <div className="lg:hidden">{/* Already covered by mobile section above */}</div>

        {/* How it works */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-display text-foreground mb-3">{t("sections.howTitle")}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">{t("sections.howSub")}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: <Zap className="text-accent" size={28} />, title: t("step1.title"), desc: t("step1.desc") },
                { icon: <Star className="text-accent" size={28} />, title: t("step2.title"), desc: t("step2.desc") },
                {
                  icon: <CheckCircle className="text-accent" size={28} />,
                  title: t("step3.title"),
                  desc: t("step3.desc"),
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl border border-border bg-card p-6 text-center shadow-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                    {step.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" asChild>
                <Link to="/how-it-works" className="gap-2">
                  {t("nav.howItWorks")} <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold font-display text-foreground mb-2">{t("sections.categories")}</h2>
                <p className="text-muted-foreground">{t("sections.categoriesSub")}</p>
              </div>
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link to="/browse">
                  {t("sections.viewAll")} <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
            <CategoryGrid />
          </div>
        </section>

        {/* Trust */}
        <section className="py-16 bg-primary">
          <div className="container text-center">
            <Shield className="mx-auto mb-4 text-primary-foreground/80" size={36} />
            <h2 className="text-3xl font-bold font-display text-primary-foreground mb-3">{t("sections.trustTitle")}</h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-6">{t("sections.trustText")}</p>
            {/* Säker betalning med kort, Swish och Klarna */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2">
              <span className="text-sm font-medium text-primary-foreground/90">Säker betalning</span>
              <PaymentMethods showUpcoming />
            </div>
            <div>
              <Button variant="accent" size="lg" asChild>
                <Link to="/post-task">{t("sections.trustCta")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
