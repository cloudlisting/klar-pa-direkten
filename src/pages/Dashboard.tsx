import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, MessageSquare, Settings, TrendingUp, CreditCard, Star, User as UserIcon, LogOut, ChevronRight } from "lucide-react";
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
      .or(`customer_user_id.eq.${user!.id},assigned_tasker_id.eq.${user!.id}`)
      .order("created_at", { ascending: false })
      .limit(20);

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

  const accountLinks = [
    { to: "/settings", icon: UserIcon, label: "Mitt konto" },
    { to: "/my-tasks", icon: ClipboardList, label: "Mina uppdrag" },
    { to: "/messages", icon: MessageSquare, label: "Mina förfrågningar" },
    { to: "/settings", icon: CreditCard, label: "Betalningar" },
    { to: "/dashboard", icon: Star, label: "Recensioner" },
    { to: "/settings", icon: Settings, label: "Inställningar" },
  ];

  return (
    <Layout>
      {/* ===== MOBILE ACCOUNT VIEW ===== */}
      <div className="md:hidden">
        <div className="bg-primary text-primary-foreground px-5 pt-6 pb-8 rounded-b-3xl">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-foreground/15 flex items-center justify-center text-2xl font-semibold">
              {(user?.email?.[0] ?? "M").toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold font-display truncate">{user?.email}</h1>
              <p className="text-sm text-primary-foreground/80">
                {isTasker ? "Beställare & Tasker" : "Beställare"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <Button variant="accent" size="sm" asChild>
              <Link to="/post-task"><Plus size={16} /> Skapa uppdrag</Link>
            </Button>
            {isTasker ? (
              <Button variant="hero-outline" size="sm" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/tasker-dashboard"><TrendingUp size={16} /> Tasker-vy</Link>
              </Button>
            ) : (
              <Button variant="hero-outline" size="sm" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/become-tasker">Bli tasker</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 py-5">
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {accountLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-3 px-4 py-4 hover:bg-secondary/50 transition-colors min-h-[56px]"
              >
                <item.icon size={20} className="text-muted-foreground" />
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                <ChevronRight size={18} className="text-muted-foreground" />
              </Link>
            ))}
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-secondary/50 transition-colors min-h-[56px] text-destructive"
            >
              <LogOut size={20} />
              <span className="flex-1 text-left font-medium">Logga ut</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== DESKTOP DASHBOARD ===== */}
      <div className="hidden md:block">
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
      </div>
    </Layout>
  );
};

export default Dashboard;
