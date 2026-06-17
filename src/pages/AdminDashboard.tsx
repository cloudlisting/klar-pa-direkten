import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ClipboardList,
  Flag,
  AlertTriangle,
  Star,
  CreditCard,
  TrendingUp,
  Gavel,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Task = Tables<"tasks">;
type Report = Tables<"reports">;
type Review = Tables<"reviews">;
type Payment = Tables<"payments">;
type Dispute = Tables<"disputes">;
type Bid = Tables<"bids">;

const TASK_STATUSES = [
  "draft",
  "published",
  "in_bidding",
  "instant_open",
  "assigned",
  "in_progress",
  "completed_pending_release",
  "paid",
  "disputed",
];
const BOOKED_STATUSES = new Set([
  "assigned",
  "in_progress",
  "completed_pending_release",
  "paid",
]);
const CLOSED_STATUSES = new Set(["paid", "completed_pending_release"]);

const fmtSEK = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("sv-SE") + " kr";
const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("sv-SE");

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // filters
  const [userQuery, setUserQuery] = useState("");
  const [taskQuery, setTaskQuery] = useState("");
  const [taskStatus, setTaskStatus] = useState<string>("all");
  const [paymentQuery, setPaymentQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && user && !isAdmin) navigate("/dashboard");
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    const [u, t, rep, rev, pay, dis, bi] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("reports").select("*").order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("disputes").select("*").order("created_at", { ascending: false }),
      supabase.from("bids").select("*").order("created_at", { ascending: true }),
    ]);
    if (u.data) setUsers(u.data);
    if (t.data) setTasks(t.data);
    if (rep.data) setReports(rep.data);
    if (rev.data) setReviews(rev.data);
    if (pay.data) setPayments(pay.data);
    if (dis.data) setDisputes(dis.data);
    if (bi.data) setBids(bi.data);
    setLoadingData(false);
  };

  const userById = useMemo(() => {
    const m = new Map<string, Profile>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  // -------- KPIs --------
  const kpis = useMemo(() => {
    const totalTasks = tasks.length;
    const tasksWithBids = new Set(bids.map((b) => b.task_id));
    const bidCoverage = totalTasks ? tasksWithBids.size / totalTasks : 0;
    const tasksWithoutBids = totalTasks - tasksWithBids.size;
    const bookedStatuses = new Set(["assigned", "active", "completed", "paid"]);
    const bookedCount = tasks.filter((t) => bookedStatuses.has(t.status)).length;
    const bookingRate = totalTasks ? bookedCount / totalTasks : 0;

    const succeededPayments = payments.filter((p) =>
      ["captured", "released", "succeeded", "paid"].includes(String(p.status))
    );
    const gmv = succeededPayments.reduce((s, p) => s + (p.amount_sek || 0), 0);
    const revenue = succeededPayments.reduce(
      (s, p) =>
        s +
        (p.platform_fee_sek || 0) +
        (p.customer_fee_sek || 0) +
        (p.tasker_fee_sek || 0),
      0
    );
    const avgPrice = succeededPayments.length
      ? Math.round(gmv / succeededPayments.length)
      : 0;
    const avgRevenuePerTask = succeededPayments.length
      ? Math.round(revenue / succeededPayments.length)
      : 0;
    const takeRate = gmv ? revenue / gmv : 0;

    // Repeat rate (customers with >1 task / customers with ≥1)
    const customerCounts = new Map<string, number>();
    tasks.forEach((t) =>
      customerCounts.set(t.customer_user_id, (customerCounts.get(t.customer_user_id) || 0) + 1)
    );
    const repeatCustomers = [...customerCounts.values()].filter((c) => c > 1).length;
    const repeatRate = customerCounts.size ? repeatCustomers / customerCounts.size : 0;

    // Active taskers = taskers with ≥1 bid in last 30d
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeTaskers = new Set(
      bids
        .filter((b) => new Date(b.created_at).getTime() >= cutoff)
        .map((b) => b.bidder_id)
    );

    // Active taskers per city (using profile city of bidder)
    const perCity = new Map<string, number>();
    activeTaskers.forEach((id) => {
      const city = userById.get(id)?.city || "Okänd";
      perCity.set(city, (perCity.get(city) || 0) + 1);
    });
    const activeTaskersPerCity = [...perCity.entries()].sort((a, b) => b[1] - a[1]);

    // Avg time-to-first-bid (minutes)
    const firstBidByTask = new Map<string, string>();
    bids.forEach((b) => {
      if (!firstBidByTask.has(b.task_id)) firstBidByTask.set(b.task_id, b.created_at);
    });
    const taskById = new Map(tasks.map((t) => [t.id, t] as const));
    const deltas: number[] = [];
    firstBidByTask.forEach((bidAt, tid) => {
      const t = taskById.get(tid);
      if (!t) return;
      deltas.push((new Date(bidAt).getTime() - new Date(t.created_at).getTime()) / 60000);
    });
    const avgTtfbMin = deltas.length
      ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
      : 0;

    return {
      totalTasks,
      bidCoverage,
      tasksWithoutBids,
      bookingRate,
      avgPrice,
      revenue,
      avgRevenuePerTask,
      takeRate,
      repeatRate,
      activeTaskersCount: activeTaskers.size,
      gmv,
      avgTtfbMin,
      activeTaskersPerCity,
    };
  }, [tasks, bids, payments, userById]);

  const kpiCards = [
    { label: "Skapade uppdrag", value: kpis.totalTasks, icon: <ClipboardList size={18} /> },
    { label: "Andel med ≥1 bud", value: fmtPct(kpis.bidCoverage), icon: <Gavel size={18} /> },
    { label: "Andel bokade", value: fmtPct(kpis.bookingRate), icon: <CheckCircle2 size={18} /> },
    { label: "Snittpris/uppdrag", value: fmtSEK(kpis.avgPrice), icon: <CreditCard size={18} /> },
    { label: "Moas intäkt/uppdrag", value: fmtSEK(kpis.avgRevenuePerTask), icon: <TrendingUp size={18} /> },
    { label: "Take rate", value: fmtPct(kpis.takeRate), icon: <TrendingUp size={18} /> },
    { label: "Repeat rate", value: fmtPct(kpis.repeatRate), icon: <Users size={18} /> },
    { label: "Aktiva utförare (30d)", value: kpis.activeTaskersCount, icon: <Users size={18} /> },
    { label: "GMV", value: fmtSEK(kpis.gmv), icon: <TrendingUp size={18} /> },
    { label: "Snittid till 1:a bud", value: kpis.avgTtfbMin ? `${kpis.avgTtfbMin} min` : "—", icon: <Gavel size={18} /> },
    { label: "Uppdrag utan bud", value: kpis.tasksWithoutBids, icon: <AlertTriangle size={18} /> },
    { label: "Öppna tvister", value: disputes.filter((d) => d.status === "open").length, icon: <AlertTriangle size={18} /> },
  ];

  // ---- filtered lists ----
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.city || "").toLowerCase().includes(q)
    );
  }, [users, userQuery]);

  const filteredTasks = useMemo(() => {
    const q = taskQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (taskStatus !== "all" && t.status !== taskStatus) return false;
      if (!q) return true;
      return (
        (t.title || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.city || "").toLowerCase().includes(q)
      );
    });
  }, [tasks, taskQuery, taskStatus]);

  const filteredPayments = useMemo(() => {
    const q = paymentQuery.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        (p.provider_reference_id || "").toLowerCase().includes(q) ||
        p.task_id.toLowerCase().includes(q) ||
        (userById.get(p.payer_user_id)?.name || "").toLowerCase().includes(q) ||
        (userById.get(p.payee_user_id)?.name || "").toLowerCase().includes(q)
    );
  }, [payments, paymentQuery, userById]);

  const cancelledOrCompleted = useMemo(
    () => tasks.filter((t) => CLOSED_STATUSES.has(t.status)),
    [tasks]
  );

  const reportedUserIds = useMemo(() => {
    return reports
      .filter((r) => r.target_type === "user")
      .map((r) => r.target_id);
  }, [reports]);

  // ---- actions ----
  const toggleUserDeactivation = async (userId: string, current: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_deactivated: !current })
      .eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Användare aktiverad" : "Användare blockerad");
      fetchData();
    }
  };

  const toggleTaskHidden = async (taskId: string, current: boolean) => {
    await supabase.from("tasks").update({ is_hidden: !current }).eq("id", taskId);
    fetchData();
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    await supabase.from("reports").update({ status: status as any }).eq("id", reportId);
    fetchData();
  };

  const resolveDispute = async (d: Dispute) => {
    const { error } = await supabase
      .from("disputes")
      .update({ status: "resolved" })
      .eq("id", d.id);
    if (error) return toast.error(error.message);
    // Reset task status if it was disputed
    await supabase.from("tasks").update({ status: "active" as any }).eq("id", d.task_id).eq("status", "disputed");
    toast.success("Tvist markerad som löst");
    fetchData();
  };

  const openDisputeChat = (d: Dispute) => {
    if (d.thread_id) navigate(`/messages?thread=${d.thread_id}`);
    else navigate(`/task/${d.task_id}`);
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
          <h1 className="text-2xl font-bold font-display text-background mb-1">Admin Dashboard</h1>
          <p className="text-background/70">Nyckeltal och hantering av Moas</p>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* KPI grid */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {kpiCards.map((k, i) => (
            <motion.div
              key={k.label}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                {k.icon}
                <span className="text-xs">{k.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{k.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Active taskers per city */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">Aktiva utförare per stad (30d)</h3>
          {kpis.activeTaskersPerCity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen aktivitet ännu.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kpis.activeTaskersPerCity.map(([city, n]) => (
                <Badge key={city} variant="secondary">
                  {city}: {n}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="users">Användare</TabsTrigger>
            <TabsTrigger value="tasks">Uppdrag</TabsTrigger>
            <TabsTrigger value="payments">Betalningar</TabsTrigger>
            <TabsTrigger value="disputes">Tvister</TabsTrigger>
            <TabsTrigger value="reports">Rapporter</TabsTrigger>
            <TabsTrigger value="closed">Avbrutna/Slutförda</TabsTrigger>
            <TabsTrigger value="reviews">Recensioner</TabsTrigger>
          </TabsList>

          {/* USERS */}
          <TabsContent value="users">
            <div className="mb-3">
              <Input
                placeholder="Sök namn, e-post eller stad..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Namn</th>
                    <th className="text-left p-3 font-medium">E-post</th>
                    <th className="text-left p-3 font-medium">Stad</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Registrerad</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isReported = reportedUserIds.includes(u.id);
                    return (
                      <tr key={u.id} className="border-t border-border">
                        <td className="p-3">
                          <Link to={`/profile/${u.id}`} className="font-medium hover:underline">
                            {u.name}
                          </Link>
                          {isReported && (
                            <Badge variant="destructive" className="ml-2">
                              Rapporterad
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{u.email}</td>
                        <td className="p-3 text-muted-foreground">{u.city || "—"}</td>
                        <td className="p-3">
                          <Badge variant={u.is_deactivated ? "destructive" : "success"}>
                            {u.is_deactivated ? "Blockerad" : "Aktiv"}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{fmtDate(u.created_at)}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant={u.is_deactivated ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => toggleUserDeactivation(u.id, u.is_deactivated)}
                          >
                            {u.is_deactivated ? "Avblockera" : "Blockera"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TASKS */}
          <TabsContent value="tasks">
            <div className="mb-3 flex flex-wrap gap-2">
              <Input
                placeholder="Sök titel, kategori, stad..."
                value={taskQuery}
                onChange={(e) => setTaskQuery(e.target.value)}
                className="max-w-md"
              />
              <Select value={taskStatus} onValueChange={setTaskStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla status</SelectItem>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Titel</th>
                    <th className="text-left p-3 font-medium">Kategori</th>
                    <th className="text-left p-3 font-medium">Stad</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Budget</th>
                    <th className="text-left p-3 font-medium">Bud</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => {
                    const bidCount = bids.filter((b) => b.task_id === t.id).length;
                    return (
                      <tr key={t.id} className="border-t border-border">
                        <td className="p-3 max-w-xs">
                          <Link to={`/task/${t.id}`} className="font-medium hover:underline">
                            {t.title}
                          </Link>
                        </td>
                        <td className="p-3 text-muted-foreground">{t.category}</td>
                        <td className="p-3 text-muted-foreground">{t.city || "—"}</td>
                        <td className="p-3">
                          <Badge variant="secondary">{t.status}</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {t.budget_min_sek ? fmtSEK(t.budget_min_sek) : "—"}
                        </td>
                        <td className="p-3">{bidCount}</td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* PAYMENTS */}
          <TabsContent value="payments">
            <div className="mb-3">
              <Input
                placeholder="Sök referens, uppdrag eller användare..."
                value={paymentQuery}
                onChange={(e) => setPaymentQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Datum</th>
                    <th className="text-left p-3 font-medium">Betalare</th>
                    <th className="text-left p-3 font-medium">Mottagare</th>
                    <th className="text-left p-3 font-medium">Belopp</th>
                    <th className="text-left p-3 font-medium">Moas avgift</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Referens</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Inga transaktioner
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const fee =
                        (p.platform_fee_sek || 0) +
                        (p.customer_fee_sek || 0) +
                        (p.tasker_fee_sek || 0);
                      return (
                        <tr key={p.id} className="border-t border-border">
                          <td className="p-3 text-muted-foreground">{fmtDate(p.created_at)}</td>
                          <td className="p-3">{userById.get(p.payer_user_id)?.name || "—"}</td>
                          <td className="p-3">{userById.get(p.payee_user_id)?.name || "—"}</td>
                          <td className="p-3 font-medium">{fmtSEK(p.amount_sek)}</td>
                          <td className="p-3 text-muted-foreground">{fmtSEK(fee)}</td>
                          <td className="p-3">
                            <Badge variant="secondary">{p.status}</Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground truncate max-w-[160px]">
                            {p.provider_reference_id || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* DISPUTES */}
          <TabsContent value="disputes">
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Datum</th>
                    <th className="text-left p-3 font-medium">Uppdrag</th>
                    <th className="text-left p-3 font-medium">Anmäld av</th>
                    <th className="text-left p-3 font-medium">Anledning</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Inga tvister
                      </td>
                    </tr>
                  ) : (
                    disputes.map((d) => {
                      const task = tasks.find((t) => t.id === d.task_id);
                      return (
                        <tr key={d.id} className="border-t border-border">
                          <td className="p-3 text-muted-foreground">{fmtDate(d.created_at)}</td>
                          <td className="p-3">
                            <Link to={`/task/${d.task_id}`} className="font-medium hover:underline">
                              {task?.title || d.task_id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="p-3">{userById.get(d.raised_by)?.name || "—"}</td>
                          <td className="p-3 text-muted-foreground max-w-xs">
                            <div className="font-medium text-foreground">{d.reason}</div>
                            {d.details && <div className="text-xs">{d.details}</div>}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                d.status === "open"
                                  ? "destructive"
                                  : d.status === "under_review"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {d.status === "open"
                                ? "Öppen"
                                : d.status === "under_review"
                                ? "Granskas"
                                : "Löst"}
                            </Badge>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openDisputeChat(d)}>
                              Öppna chatt
                            </Button>
                            {d.status !== "resolved" && (
                              <Button size="sm" onClick={() => resolveDispute(d)}>
                                Markera löst
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* REPORTS */}
          <TabsContent value="reports">
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Typ</th>
                    <th className="text-left p-3 font-medium">Mål</th>
                    <th className="text-left p-3 font-medium">Anledning</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Datum</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Inga rapporter
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3">{r.target_type}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {r.target_type === "user" ? (
                            <Link to={`/profile/${r.target_id}`} className="hover:underline">
                              {userById.get(r.target_id)?.name || r.target_id.slice(0, 8)}
                            </Link>
                          ) : (
                            r.target_id.slice(0, 8)
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{r.reason}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              r.status === "open"
                                ? "destructive"
                                : r.status === "reviewing"
                                ? "warning"
                                : "success"
                            }
                          >
                            {r.status === "open"
                              ? "Öppen"
                              : r.status === "reviewing"
                              ? "Granskas"
                              : "Stängd"}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                        <td className="p-3 text-right">
                          {r.status !== "closed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateReportStatus(r.id, r.status === "open" ? "reviewing" : "closed")
                              }
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

          {/* CLOSED / CANCELLED */}
          <TabsContent value="closed">
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Titel</th>
                    <th className="text-left p-3 font-medium">Kund</th>
                    <th className="text-left p-3 font-medium">Utförare</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Stad</th>
                    <th className="text-left p-3 font-medium">Avslutad</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledOrCompleted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Inga avslutade uppdrag
                      </td>
                    </tr>
                  ) : (
                    cancelledOrCompleted.map((t) => (
                      <tr key={t.id} className="border-t border-border">
                        <td className="p-3">
                          <Link to={`/task/${t.id}`} className="font-medium hover:underline">
                            {t.title}
                          </Link>
                        </td>
                        <td className="p-3">{userById.get(t.customer_user_id)?.name || "—"}</td>
                        <td className="p-3">
                          {t.assigned_tasker_id
                            ? userById.get(t.assigned_tasker_id)?.name || "—"
                            : "—"}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              t.status === "cancelled" ? "destructive" : "success"
                            }
                          >
                            {t.status === "cancelled" ? (
                              <span className="inline-flex items-center gap-1">
                                <XCircle size={12} /> Avbrutet
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> Slutfört
                              </span>
                            )}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{t.city || "—"}</td>
                        <td className="p-3 text-muted-foreground">{fmtDate(t.updated_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* REVIEWS */}
          <TabsContent value="reviews">
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Betyg</th>
                    <th className="text-left p-3 font-medium">Kommentar</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Datum</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Inga recensioner ännu
                      </td>
                    </tr>
                  ) : (
                    reviews.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Star size={14} className="text-warning fill-warning" />
                            {r.rating}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-md">
                          {r.text || <em>Ingen kommentar</em>}
                        </td>
                        <td className="p-3">
                          <Badge variant={r.is_hidden ? "destructive" : "success"}>
                            {r.is_hidden ? "Dold" : "Synlig"}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant={r.is_hidden ? "outline" : "destructive"}
                            size="sm"
                            onClick={async () => {
                              await supabase
                                .from("reviews")
                                .update({ is_hidden: !r.is_hidden })
                                .eq("id", r.id);
                              fetchData();
                            }}
                          >
                            {r.is_hidden ? "Visa" : "Dölj"}
                          </Button>
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
