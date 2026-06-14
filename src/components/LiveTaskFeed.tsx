import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, MessageSquare, ArrowRight, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useT, useI18n } from "@/lib/i18n";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type FeedTask = Task & { offers_count: number };

const STORAGE_CITY_KEY = "taskly_user_city";

const timeAgo = (iso: string, lang: "sv" | "en", t: (k: string) => string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t("feed.justNow");
  if (mins < 60) return `${mins} ${t("feed.minAgo")}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${t("feed.hAgo")}`;
  const days = Math.floor(hrs / 24);
  return `${days} ${t("feed.dAgo")}`;
};

const LiveTaskFeed = () => {
  const t = useT();
  const { lang } = useI18n();
  const [tasks, setTasks] = useState<FeedTask[]>([]);
  const [loading, setLoading] = useState(true);
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

      // Fallback: if city filter returned nothing, get newest across Sweden
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
        const { data: offerCounts } = await supabase
          .from("offers")
          .select("task_id")
          .in("task_id", ids);
        const counts: Record<string, number> = {};
        offerCounts?.forEach((o) => {
          counts[o.task_id] = (counts[o.task_id] || 0) + 1;
        });
        setTasks(data.map((d) => ({ ...d, offers_count: counts[d.id] || 0 })));
      }
      if (mounted) setLoading(false);
    };

    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userCity]);

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                {t("feed.live")}
              </span>
              <span className="text-xs text-muted-foreground">{t("feed.updating")}</span>
            </div>
            <h2 className="text-3xl font-bold font-display text-foreground">
              {t("feed.title")}
              {userCity ? <span className="text-primary"> · {userCity}</span> : null}
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/browse" className="gap-2">
              {t("feed.viewAll")} <ArrowRight size={16} />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground mb-4">{t("feed.empty")}</p>
            <Button variant="hero" asChild>
              <Link to="/post-task">{t("hero.cta.post")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tasks.map((task, i) => {
              const isInstant = (task.status as string) === "instant_open";
              const budget = task.budget_max_sek || task.budget_min_sek || 0;
              const isUrgent =
                task.preferred_date &&
                new Date(task.preferred_date).getTime() - Date.now() < 1000 * 60 * 60 * 48;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                >
                  <Link
                    to={`/task/${task.id}`}
                    className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {task.category}
                        </Badge>
                        {/* instant badge removed for MVP */}
                        {isUrgent && (
                          <Badge variant="destructive" className="text-[10px]">
                            {t("feed.urgent")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-foreground leading-none">
                          {budget.toLocaleString("sv-SE")} kr
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t("common.fixedPrice")}
                        </p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3 flex-1">
                      {task.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={11} /> {task.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={11} /> {task.offers_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {timeAgo(task.created_at, lang, t)}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default LiveTaskFeed;
