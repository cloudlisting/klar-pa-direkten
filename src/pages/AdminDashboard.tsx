import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ClipboardList, Flag, AlertTriangle, Star, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import TrustBadges from "@/components/TrustBadges";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Task = Tables<"tasks">;
type Report = Tables<"reports">;
type Review = Tables<"reviews">;

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    const [usersRes, tasksRes, reportsRes, reviewsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("reports").select("*").order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (reportsRes.data) setReports(reportsRes.data);
    if (reviewsRes.data) setReviews(reviewsRes.data);
    setLoadingData(false);
  };

  const toggleVerification = async (
    userId: string,
    field: "bankid_verified" | "id_verified" | "phone_verified" | "email_verified",
    value: boolean
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: !value })
      .eq("id", userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verifiering uppdaterad");
      fetchData();
    }
  };

  const toggleReviewHidden = async (reviewId: string, current: boolean) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_hidden: !current })
      .eq("id", reviewId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(current ? "Recension visas igen" : "Recension dold");
      fetchData();
    }
  };

  const toggleUserDeactivation = async (userId: string, currentStatus: boolean) => {
    await supabase
      .from("profiles")
      .update({ is_deactivated: !currentStatus })
      .eq("id", userId);
    fetchData();
  };

  const toggleTaskHidden = async (taskId: string, currentStatus: boolean) => {
    await supabase
      .from("tasks")
      .update({ is_hidden: !currentStatus })
      .eq("id", taskId);
    fetchData();
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    await supabase
      .from("reports")
      .update({ status: status as any })
      .eq("id", reportId);
    fetchData();
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

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Åtkomst nekad</h1>
          <p className="text-muted-foreground">Du har inte behörighet att se denna sida.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-foreground">
        <div className="container py-8">
          <h1 className="text-2xl font-bold font-display text-background mb-1">
            Admin Dashboard
          </h1>
          <p className="text-background/70">Hantera användare, uppdrag och rapporter</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { label: "Användare", value: users.length, icon: <Users size={20} />, color: "bg-primary/10 text-primary" },
            { label: "Uppdrag", value: tasks.length, icon: <ClipboardList size={20} />, color: "bg-accent/10 text-accent" },
            { label: "Öppna rapporter", value: reports.filter((r) => r.status === "open").length, icon: <Flag size={20} />, color: "bg-destructive/10 text-destructive" },
            { label: "Tvister", value: tasks.filter((t) => t.status === "disputed").length, icon: <AlertTriangle size={20} />, color: "bg-warning/10 text-warning" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Användare</TabsTrigger>
            <TabsTrigger value="tasks">Uppdrag</TabsTrigger>
            <TabsTrigger value="reports">Rapporter</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Namn</th>
                    <th className="text-left p-3 font-medium">E-post</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Registrerad</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="p-3">{u.name}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        <Badge variant={u.is_deactivated ? "destructive" : "success"}>
                          {u.is_deactivated ? "Inaktiverad" : "Aktiv"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("sv-SE")}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant={u.is_deactivated ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => toggleUserDeactivation(u.id, u.is_deactivated)}
                        >
                          {u.is_deactivated ? "Aktivera" : "Inaktivera"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Titel</th>
                    <th className="text-left p-3 font-medium">Kategori</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Dold</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-3 max-w-xs truncate">{t.title}</td>
                      <td className="p-3 text-muted-foreground">{t.category}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{t.status}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={t.is_hidden ? "destructive" : "success"}>
                          {t.is_hidden ? "Ja" : "Nej"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant={t.is_hidden ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => toggleTaskHidden(t.id, t.is_hidden)}
                        >
                          {t.is_hidden ? "Visa" : "Dölj"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Typ</th>
                    <th className="text-left p-3 font-medium">Anledning</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Datum</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Inga rapporter ännu
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3">{r.target_type}</td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{r.reason}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              r.status === "open" ? "destructive" : r.status === "reviewing" ? "warning" : "success"
                            }
                          >
                            {r.status === "open" ? "Öppen" : r.status === "reviewing" ? "Granskas" : "Stängd"}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("sv-SE")}
                        </td>
                        <td className="p-3 text-right">
                          {r.status !== "closed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateReportStatus(r.id, r.status === "open" ? "reviewing" : "closed")}
                            >
                              {r.status === "open" ? "Granska" : "Stäng"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
