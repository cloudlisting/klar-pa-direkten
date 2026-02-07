import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

const MyTasks = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("customer_user_id", user!.id)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setTasks(data);
    }
    setLoadingTasks(false);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Utkast",
      published: "Publicerad",
      in_bidding: "Tar emot bud",
      assigned: "Tilldelad",
      in_progress: "Pågår",
      completed_pending_release: "Väntar på betalning",
      paid: "Betald",
      cancelled: "Avbruten",
      disputed: "Tvist",
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    if (["draft"].includes(status)) return "secondary";
    if (["published", "in_bidding"].includes(status)) return "success";
    if (["assigned", "in_progress"].includes(status)) return "accent";
    if (["paid", "completed_pending_release"].includes(status)) return "default";
    if (["cancelled", "disputed"].includes(status)) return "destructive";
    return "muted";
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "active") return ["published", "in_bidding", "assigned", "in_progress"].includes(t.status);
    if (filter === "completed") return ["paid", "completed_pending_release"].includes(t.status);
    if (filter === "draft") return t.status === "draft";
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-secondary/50 border-b border-border">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground mb-1">
                Mina uppdrag
              </h1>
              <p className="text-muted-foreground">{tasks.length} uppdrag totalt</p>
            </div>
            <Button variant="hero" asChild>
              <Link to="/post-task">
                <Plus size={16} /> Nytt uppdrag
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {[
              { key: "all", label: "Alla" },
              { key: "active", label: "Aktiva" },
              { key: "completed", label: "Slutförda" },
              { key: "draft", label: "Utkast" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {loadingTasks ? (
          <p className="text-muted-foreground">Laddar uppdrag...</p>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {filter === "all" ? "Du har inga uppdrag ännu" : "Inga uppdrag matchar filtret"}
            </p>
            <Button variant="hero" asChild>
              <Link to="/post-task">Skapa ditt första uppdrag</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/task/${task.id}`}
                  className="block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {task.category}
                        </Badge>
                        <Badge variant={getStatusVariant(task.status) as any} className="text-xs">
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.city} • {task.preferred_date || "Flexibelt datum"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">
                        {task.budget_max_sek?.toLocaleString("sv-SE") || task.budget_min_sek?.toLocaleString("sv-SE") || "?"} kr
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.budget_type === "fixed" ? "fast pris" : "per timme"}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyTasks;
