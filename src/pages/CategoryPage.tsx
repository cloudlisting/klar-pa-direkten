import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

// Map URL slugs to category names
const CATEGORY_SLUG_MAP: Record<string, string> = {
  "stadning": "Städning",
  "flytt": "Flytt & transport",
  "hantverkare": "Hantverkare",
  "tradgard": "Trädgård",
  "montering": "Montering",
  "leverans": "Leverans",
  "malning": "Målning",
  "ovrigt": "Övrigt",
};

const CategoryPage = () => {
  const { slug } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryName = slug ? CATEGORY_SLUG_MAP[slug] : null;
  const category = CATEGORIES.find((c) => c.name === categoryName);

  useEffect(() => {
    if (categoryName) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [categoryName]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("category", categoryName)
      .in("status", ["published", "instant_open"])
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  if (!categoryName || !category) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Kategori hittades inte</h1>
          <Button variant="outline" asChild>
            <Link to="/browse"><ArrowLeft size={16} /> Till alla uppdrag</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* SEO meta tags are handled in the component */}
      <title>{`${categoryName} | Hitta hjälp med ${categoryName.toLowerCase()} | Taskly`}</title>
      <meta name="description" content={`Hitta kvalificerade taskers för ${categoryName.toLowerCase()} i Sverige. Jämför priser och recensioner. Boka enkelt online.`} />

      <div className="bg-secondary/50 border-b border-border">
        <div className="container py-8">
          <Link
            to="/browse"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Alla kategorier
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{category.icon}</span>
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">
                {categoryName}
              </h1>
              <p className="text-muted-foreground">
                {tasks.length} {tasks.length === 1 ? "uppdrag" : "uppdrag"} tillgängliga
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {loading ? (
          <p className="text-muted-foreground">Laddar uppdrag...</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Inga uppdrag i denna kategori just nu</p>
            <Button variant="hero" asChild>
              <Link to="/post-task">Skapa det första uppdraget</Link>
            </Button>
          </div>
        ) : (
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
        )}
      </div>
    </Layout>
  );
};

export default CategoryPage;
