import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryGrid from "@/components/CategoryGrid";
import HeroTaskFeed from "@/components/HeroTaskFeed";
import ServiceMarquee from "@/components/ServiceMarquee";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Zap, Star, CheckCircle, Plus, MapPin, Heart, Clock } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-interior.png";
import { useT } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
          supabase.from("task_photos").select("task_id, url").in("task_id", ids).limit(1, { foreignTable: "task_photos" }),
        ]);
        const counts: Record<string, number> = {};
        offerCounts?.forEach((o) => {
          counts[o.task_id] = (counts[o.task_id] || 0) + 1;
        });
        const photoMap: Record<string, string> = {};
        photos?.forEach((p) => {
          if (!photoMap[p.task_id]) photoMap[p.task_id] = p.url;
        });
        setNearbyTasks(
          data.map((d) => ({ ...d, offers_count: counts[d.id] || 0, photo_url: photoMap[d.id] }))
        );
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
      <section className="md:hidden">
        <div className="px-5 pt-4 pb-6">
          {/* Hero text + image */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <h1 className="text-[28px] font-bold font-display text-foreground leading-[1.15] mb-3">
                Vad behöver du hjälp med idag?
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Skapa ett uppdrag på mindre än en minut och få svar från lokala utförare.
              </p>
            </div>
            <div className="shrink-0 w-[140px] h-[140px] relative">
              <img
                src={heroImage}
                alt="Inredning"
                className="w-full h-full object-cover rounded-2xl"
                width={140}
                height={140}
              />
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 mb-8">
            <Button
              variant="hero"
              size="lg"
              className="flex-1 h-12 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
              onClick={() => navigate("/post-task")}
            >
              <Plus size={20} strokeWidth={2.5} />
              Skapa uppdrag
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 gap-2 rounded-xl border-border"
              onClick={() => navigate("/browse")}
            >
              <MapPin size={18} />
              Se uppdrag nära dig
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Shield size={16} className="text-primary" />
              </div>
              <p className="text-[11px] font-semibold text-foreground leading-tight">Verifierade profiler</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Endast kontrollerade utförare.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Zap size={16} className="text-primary" />
              </div>
              <p className="text-[11px] font-semibold text-foreground leading-tight">Säker betalning</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Betala tryggt direkt i appen.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Star size={16} className="text-primary" />
              </div>
              <p className="text-[11px] font-semibold text-foreground leading-tight">Omdömen efter varje uppdrag</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Riktiga betyg från riktiga kunder.</p>
            </div>
          </div>

          {/* Popular services */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold font-display">Populära tjänster</h2>
              <Link to="/browse" className="text-sm text-primary font-medium flex items-center gap-1">
                Visa alla <ArrowRight size={14} />
              </Link>
            </div>
            <CategoryGrid />
          </div>

          {/* Nearby tasks - horizontal cards */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold font-display">Uppdrag nära dig</h2>
              <Link to="/browse" className="text-sm text-primary font-medium flex items-center gap-1">
                Visa alla <ArrowRight size={14} />
              </Link>
            </div>

            {loadingTasks ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-w-[260px] h-[280px] rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : nearbyTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">Inga uppdrag hittades.</p>
                <Button variant="hero" size="sm" onClick={() => navigate("/post-task")}>
                  Skapa uppdrag
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2 snap-x snap-mandatory">
                {nearbyTasks.slice(0, 6).map((task) => {
                  const budget = task.budget_max_sek || task.budget_min_sek || 0;
                  const isUrgent =
                    task.preferred_date &&
                    new Date(task.preferred_date).getTime() - Date.now() < 1000 * 60 * 60 * 48;
                  const catColor = CATEGORY_BG_COLORS[task.category?.toLowerCase() || "other"] || "bg-gray-100";

                  return (
                    <Link
                      key={task.id}
                      to={`/task/${task.id}`}
                      className="min-w-[260px] max-w-[260px] snap-start block rounded-2xl border border-border bg-card overflow-hidden shadow-card transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                    >
                      {/* Image area */}
                      <div className={`relative h-[140px] ${task.photo_url ? "" : catColor} flex items-center justify-center`}>
                        {task.photo_url ? (
                          <img
                            src={task.photo_url}
                            alt={task.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-4xl">
                            {
                              {
                                "Avfall & återvinning": "🗑️",
                                "Inköp & ärenden": "🛍️",
                                "Flytt & transport": "📦",
                                "Möbelmontering": "🪛",
                                "Småfix i hemmet": "🔧",
                                Städning: "🧹",
                                "Trädgård & utemiljö": "🌿",
                                "IT- & teknikhjälp": "💻",
                                Djur: "🐶",
                                Övrigt: "✨",
                              }[task.category] || "📋"
                            }
                          </span>
                        )}
                        {/* Timing badge */}
                        <div className="absolute top-2.5 left-2.5">
                          <Badge
                            className={`text-[10px] font-semibold px-2 py-0.5 ${
                              isUrgent
                                ? "bg-accent text-accent-foreground border-0"
                                : "bg-white/90 text-foreground border-0"
                            }`}
                          >
                            {isUrgent ? "Snabbt" : "Flexibelt"}
                          </Badge>
                        </div>
                        {/* Distance badge */}
                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="text-[10px] font-medium bg-white/90 px-2 py-0.5 rounded-full">
                            {(Math.random() * 2 + 0.3).toFixed(1)} km
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1.5 min-h-[38px]">
                          {task.title}
                        </h3>
                        <p className="text-base font-bold text-accent mb-2">
                          {budget.toLocaleString("sv-SE")} kr
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {task.city}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => e.preventDefault()}
                            className="p-1 rounded-full hover:bg-secondary transition-colors"
                            aria-label="Spara uppdrag"
                          >
                            <Heart size={16} className="text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
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
                  {t("hero.title1")}{" "}
                  <span className="text-accent">{t("hero.title2")}</span>
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
        <div className="lg:hidden">
          {/* Already covered by mobile section above */}
        </div>

        {/* How it works */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-display text-foreground mb-3">
                {t("sections.howTitle")}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("sections.howSub")}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: <Zap className="text-accent" size={28} />, title: t("step1.title"), desc: t("step1.desc") },
                { icon: <Star className="text-accent" size={28} />, title: t("step2.title"), desc: t("step2.desc") },
                { icon: <CheckCircle className="text-accent" size={28} />, title: t("step3.title"), desc: t("step3.desc") },
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
                <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                  {t("sections.categories")}
                </h2>
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
            <h2 className="text-3xl font-bold font-display text-primary-foreground mb-3">
              {t("sections.trustTitle")}
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">
              {t("sections.trustText")}
            </p>
            <Button variant="accent" size="lg" asChild>
              <Link to="/post-task">{t("sections.trustCta")}</Link>
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
