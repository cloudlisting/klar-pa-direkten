import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import TaskCard from "@/components/TaskCard";
import CategoryGrid from "@/components/CategoryGrid";
import { Button } from "@/components/ui/button";
import { SWEDISH_CITIES, CATEGORIES } from "@/lib/constants";
import { ArrowLeft, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

// Map URL slugs to city names
const CITY_SLUG_MAP: Record<string, string> = {
  "stockholm": "Stockholm",
  "goteborg": "Göteborg",
  "malmo": "Malmö",
  "uppsala": "Uppsala",
  "linkoping": "Linköping",
  "vasteras": "Västerås",
  "orebro": "Örebro",
  "norrkoping": "Norrköping",
  "helsingborg": "Helsingborg",
  "jonkoping": "Jönköping",
  "umea": "Umeå",
  "lund": "Lund",
};

const CityPage = () => {
  const { slug } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  const cityName = slug ? CITY_SLUG_MAP[slug] : null;

  useEffect(() => {
    if (cityName) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [cityName]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("city", cityName)
      .in("status", ["published", "instant_open"])
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setTasks(data);
      
      // Count by category
      const counts: Record<string, number> = {};
      data.forEach((task) => {
        counts[task.category] = (counts[task.category] || 0) + 1;
      });
      setCategoryCounts(counts);
    }
    setLoading(false);
  };

  if (!cityName) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Stad hittades inte</h1>
          <Button variant="outline" asChild>
            <Link to="/browse"><ArrowLeft size={16} /> Till alla uppdrag</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* SEO meta tags */}
      <title>{`Uppdrag i ${cityName} | Hitta hjälp lokalt | Moas`}</title>
      <meta name="description" content={`Hitta lokala taskers i ${cityName}. Städning, flytt, hantverkare och mer. Jämför priser och boka enkelt online.`} />

      <div className="bg-secondary/50 border-b border-border">
        <div className="container py-8">
          <Link
            to="/browse"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Alla städer
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="text-primary" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">
                Uppdrag i {cityName}
              </h1>
              <p className="text-muted-foreground">
                {tasks.length} {tasks.length === 1 ? "uppdrag" : "uppdrag"} tillgängliga
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Category quick links */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Populära kategorier i {cityName}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                to={`/browse?category=${cat.name}&city=${cityName}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryCounts[cat.name] || 0} uppdrag
                </span>
              </Link>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Laddar uppdrag...</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Inga uppdrag i {cityName} just nu</p>
            <Button variant="hero" asChild>
              <Link to="/post-task">Skapa det första uppdraget</Link>
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Alla uppdrag i {cityName}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TaskCard
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
                      postedBy: "Kund",
                      postedAt: new Date(task.created_at).toLocaleDateString("sv-SE"),
                      offersCount: 0,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Other cities */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Andra städer</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CITY_SLUG_MAP)
              .filter(([, name]) => name !== cityName)
              .map(([citySlug, name]) => (
                <Link
                  key={citySlug}
                  to={`/stad/${citySlug}`}
                  className="px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {name}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CityPage;
