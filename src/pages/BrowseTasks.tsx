import Layout from "@/components/Layout";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, SWEDISH_CITIES } from "@/lib/constants";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;
type TaskWithOffers = Task & { offers_count: number; poster?: Profile };

const BrowseTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(initialCategory !== "all");
  const [tasks, setTasks] = useState<TaskWithOffers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = searchParams.get("category") || "all";
    setSelectedCategory(c);
  }, [searchParams]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      // Using type assertion since instant_open was added to enum
      .in("status", ["published", "instant_open", "in_bidding"] as any)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const taskIds = data.map((t) => t.id);
      const customerIds = Array.from(new Set(data.map((t) => t.customer_user_id)));
      const [{ data: offerCounts }, { data: posters }] = await Promise.all([
        supabase.from("offers").select("task_id").in("task_id", taskIds),
        supabase.from("public_profiles" as any).select("*").in("id", customerIds) as any,
      ]);

      const countsMap: Record<string, number> = {};
      offerCounts?.forEach((o) => {
        countsMap[o.task_id] = (countsMap[o.task_id] || 0) + 1;
      });
      const posterMap: Record<string, Profile> = {};
      posters?.forEach((p) => (posterMap[p.id] = p));

      setTasks(
        data.map((t) => ({
          ...t,
          offers_count: countsMap[t.id] || 0,
          poster: posterMap[t.customer_user_id],
        }))
      );
    }
    setLoading(false);
  };

  const filtered = tasks.filter((task) => {
    const matchesSearch = !search || 
      task.title.toLowerCase().includes(search.toLowerCase()) || 
      (task.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === "all" || task.category === CATEGORIES.find(c => c.id === selectedCategory)?.name;
    const matchesCity = selectedCity === "all" || task.city === selectedCity;
    return matchesSearch && matchesCategory && matchesCity;
  });

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedCity("all");
  };

  const hasActiveFilters = search || selectedCategory !== "all" || selectedCity !== "all";

  return (
    <Layout>
      <div className="bg-secondary/50 border-b border-border">
        <div className="container py-8">
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">
            Hitta uppdrag
          </h1>
          <p className="text-muted-foreground mb-6">
            {loading ? "Laddar..." : `${filtered.length} uppdrag tillgängliga`}
          </p>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Sök uppdrag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 bg-card"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-3 items-end">
              <div className="w-48">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Kategori</label>
                <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); const next = new URLSearchParams(searchParams); if (v === "all") next.delete("category"); else next.set("category", v); setSearchParams(next, { replace: true }); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alla kategorier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla kategorier</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Stad</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alla städer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla städer</SelectItem>
                    {SWEDISH_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {city}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X size={14} /> Rensa
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container py-8">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Laddar uppdrag...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-2">Inga uppdrag matchade din sökning</p>
            <Button variant="outline" onClick={clearFilters}>Rensa filter</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  description: task.description || "",
                  category: task.category,
                  location: task.city,
                  date: task.preferred_date || "",
                  budget: task.budget_max_sek || task.budget_min_sek || 0,
                  budgetType: "fixed",
                  status: (task.status as string) === "instant_open" ? "instant" : "open",
                  isRemote: false,
                  postedBy: task.poster?.name || "Kund",
                  postedAt: new Date(task.created_at).toLocaleDateString("sv-SE"),
                  offersCount: task.offers_count,
                  posterTrust: task.poster
                    ? {
                        rating_avg: task.poster.rating_avg,
                        rating_count: task.poster.rating_count,
                        completed_tasks: task.poster.completed_tasks,
                        completion_rate: task.poster.completion_rate,
                        bankid_verified: task.poster.bankid_verified,
                        id_verified: task.poster.id_verified,
                        phone_verified: task.poster.phone_verified,
                        email_verified: task.poster.email_verified,
                        google_connected: task.poster.google_connected,
                      }
                    : undefined,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BrowseTasks;
