import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, MessageSquare, Clock, Zap, ArrowRight } from "lucide-react";
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

const HeroTaskFeed = () => {
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
        .limit(6);

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
          .limit(6);
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
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[480px] border border-white/20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            {t("feed.live")}
          </span>
          <span className="text-[11px] text-muted-foreground">{t("feed.updating")}</span>
        </div>
        {userCity && (
          <span className="text-[11px] font-medium text-foreground truncate max-w-[80px]">
            {userCity}
          </span>
        )}
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto p-3 space-y-2 scrollbar-hide">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-lg border border-border bg-muted/50 animate-pulse" />
          ))
        ) : tasks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">{t("feed.empty")}</p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/post-task">{t("hero.cta.post")}</Link>
            </Button>
          </div>
        ) : (
          tasks.map((task) => {
            const isInstant = (task.status as string) === "instant_open";
            const budget = task.budget_max_sek || task.budget_min_sek || 0;
            const isUrgent =
              task.preferred_date &&
              new Date(task.preferred_date).getTime() - Date.now() < 1000 * 60 * 60 * 48;
            return (
              <Link
                key={task.id}
                to={`/task/${task.id}`}
                className="group block rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {task.category}
                    </Badge>
                    {isInstant && (
                      <Badge variant="accent" className="text-[10px] h-4 px-1 gap-0.5">
                        <Zap size={8} />
                        {t("common.instant")}
                      </Badge>
                    )}
                    {isUrgent && (
                      <Badge variant="destructive" className="text-[10px] h-4 px-1">
                        {t("feed.urgent")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground leading-none">
                    {budget.toLocaleString("sv-SE")} kr
                  </p>
                </div>
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
                  {task.title}
                </h4>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5 truncate max-w-[80px]">
                    <MapPin size={10} />
                    {task.city}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MessageSquare size={10} />
                    {task.offers_count} {t("feed.bids")}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock size={10} />
                    {timeAgo(task.created_at, lang, t)}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-card shrink-0">
        <Button variant="ghost" size="sm" className="w-full text-xs gap-1 h-8" asChild>
          <Link to="/browse">
            {t("feed.viewAll")}
            <ArrowRight size={12} />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default HeroTaskFeed;
