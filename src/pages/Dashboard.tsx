import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, MessageSquare, Settings, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

const Dashboard = () => {
  const { user, loading, isTasker, signOut } = useAuth();
  const navigate = useNavigate();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMyTasks();
    }
  }, [user]);

  const fetchMyTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("customer_user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (!error && data) {
      setMyTasks(data);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground mb-1">
                Välkommen tillbaka!
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              {isTasker && (
                <Button variant="outline" asChild>
                  <Link to="/tasker-dashboard">
                    <TrendingUp size={16} />
                    Tasker-vy
                  </Link>
                </Button>
              )}
              {!isTasker && (
                <Button variant="outline" asChild>
                  <Link to="/become-tasker">Bli tasker</Link>
                </Button>
              )}
              <Button variant="ghost" onClick={signOut}>
                Logga ut
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick actions */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-semibold text-foreground mb-4">Snabbåtgärder</h2>
              <div className="space-y-2">
                <Button variant="hero" className="w-full justify-start gap-2" asChild>
                  <Link to="/post-task">
                    <Plus size={16} /> Skapa nytt uppdrag
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link to="/my-tasks">
                    <ClipboardList size={16} /> Mina uppdrag
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link to="/messages">
                    <MessageSquare size={16} /> Meddelanden
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link to="/settings">
                    <Settings size={16} /> Inställningar
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* My tasks */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Mina senaste uppdrag</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/my-tasks">Visa alla</Link>
                </Button>
              </div>
              
              {loadingTasks ? (
                <p className="text-muted-foreground text-sm">Laddar uppdrag...</p>
              ) : myTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Du har inga uppdrag ännu</p>
                  <Button variant="hero" asChild>
                    <Link to="/post-task">Skapa ditt första uppdrag</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => (
                    <Link
                      key={task.id}
                      to={`/task/${task.id}`}
                      className="block rounded-lg border border-border p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{task.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {task.city} • {task.category}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(task.status) as any}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                    </Link>
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

export default Dashboard;
