import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TaskCard from "@/components/TaskCard";
import { Briefcase, DollarSign, Star, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type TaskerProfile = Tables<"tasker_profiles">;

const TaskerDashboard = () => {
  const { user, loading, isTasker } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TaskerProfile | null>(null);
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
  const [activeJobs, setActiveJobs] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isTasker) {
      navigate("/become-tasker");
    }
  }, [user, loading, isTasker, navigate]);

  useEffect(() => {
    if (user && isTasker) {
      fetchData();
    }
  }, [user, isTasker]);

  const fetchData = async () => {
    // Fetch tasker profile
    const { data: profileData } = await supabase
      .from("tasker_profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    
    if (profileData) setProfile(profileData);

    // Fetch suggested tasks (published tasks in tasker's city)
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .in("status", ["published", "in_bidding"])
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(6);
    
    if (tasksData) setSuggestedTasks(tasksData);

    // Fetch active jobs (tasks assigned to this tasker)
    const { data: jobsData } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_tasker_id", user!.id)
      .in("status", ["assigned", "in_progress"])
      .order("created_at", { ascending: false });
    
    if (jobsData) setActiveJobs(jobsData);

    setLoadingData(false);
  };

  if (loading || loadingData) {
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
      <div className="bg-primary">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display text-primary-foreground mb-1">
                Tasker Dashboard
              </h1>
              <div className="flex items-center gap-3 text-primary-foreground/80">
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-current" />
                  {profile?.avg_rating || "0.0"}
                </span>
                <span>{profile?.completed_tasks_count || 0} slutförda uppdrag</span>
                <Badge variant="accent" className="text-xs">
                  {profile?.verification_status === "verified" ? "Verifierad" : "Ej verifierad"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="hero-outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/dashboard">Kundvy</Link>
              </Button>
              <Button variant="accent" asChild>
                <Link to="/browse">
                  <Search size={16} /> Hitta uppdrag
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Stats */}
          <motion.div
            className="lg:col-span-1 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="text-success" size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Intjänat denna månad</p>
                  <p className="text-xl font-bold text-foreground">0 kr</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Betalningar kommer snart</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Briefcase className="text-accent" size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aktiva jobb</p>
                  <p className="text-xl font-bold text-foreground">{activeJobs.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-semibold text-foreground mb-3">Din profil</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timpris</span>
                  <span className="text-foreground font-medium">{profile?.hourly_rate_sek || "Ej satt"} kr/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Område</span>
                  <span className="text-foreground font-medium">{profile?.service_area_city || "Ej satt"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Färdigheter</span>
                  <span className="text-foreground font-medium">{profile?.skills?.length || 0} st</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link to="/tasker-profile/edit">Redigera profil</Link>
              </Button>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Active jobs */}
            {activeJobs.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-semibold text-foreground mb-4">Dina aktiva jobb</h2>
                <div className="space-y-3">
                  {activeJobs.map((task) => (
                    <Link
                      key={task.id}
                      to={`/task/${task.id}`}
                      className="block rounded-lg border border-border p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{task.title}</p>
                          <p className="text-sm text-muted-foreground">{task.city}</p>
                        </div>
                        <Badge variant="accent">
                          {task.status === "assigned" ? "Tilldelad" : "Pågår"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested tasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Föreslagna uppdrag</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/browse">
                    <Filter size={14} /> Filtrera
                  </Link>
                </Button>
              </div>
              {suggestedTasks.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-border bg-card">
                  <p className="text-muted-foreground">Inga nya uppdrag just nu</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestedTasks.map((task) => (
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
                        postedBy: "Kund",
                        postedAt: new Date(task.created_at).toLocaleDateString("sv-SE"),
                        offersCount: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskerDashboard;
