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
  ShieldCheck,
  BadgeCheck,
  FileText,
  Settings as SettingsIcon,
  StickyNote,
  Clock,
  UserPlus,
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
type Verification = Tables<"verifications">;

type AdminNote = {
  id: string;
  entity_type: string;
  entity_id: string;
  note: string;
  author_id: string;
  created_at: string;
};

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
const ACTIVE_STATUSES = new Set([
  "published",
  "in_bidding",
  "instant_open",
  "assigned",
  "in_progress",
]);
const BOOKED_STATUSES = new Set([
  "assigned",
  "in_progress",
  "completed_pending_release",
  "paid",
]);
const CLOSED_STATUSES = new Set(["paid", "completed_pending_release"]);
const COMPLETED_STATUSES = new Set(["paid"]);
// payment buckets
const PAYMENT_PENDING = new Set(["not_started", "authorized"]);
const PAYOUT_PENDING = new Set(["held_in_escrow"]);

const PAYMENT_STATUS_OPTIONS = [
  "not_started",
  "authorized",
  "held_in_escrow",
  "released",
  "refunded",
  "failed",
];

const fmtSEK = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("sv-SE") + " kr";
const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("sv-SE");
const isToday = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

// Verification label — Google login is NEVER treated as BankID.
const verifInfo = (p: Profile): { label: string; variant: any } => {
  const a = p as any;
  if (a.manually_verified) return { label: "Manuellt verifierad", variant: "success" };
  if (p.bankid_verified) return { label: "BankID verifierad", variant: "success" };
  if (p.google_connected) return { label: "Google anslutet", variant: "secondary" };
  if (p.email_verified) return { label: "E-post verifierad", variant: "secondary" };
  return { label: "Ej verifierad", variant: "destructive" };
};

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
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loadingData, setLoadingData] = useState(true);

  // filters
  const [userQuery, setUserQuery] = useState("");
  const [taskQuery, setTaskQuery] = useState("");
  const [taskStatus, setTaskStatus] = useState<string>("all");
  const [paymentQuery, setPaymentQuery] = useState("");
  const [verifQuery, setVerifQuery] = useState("");

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

    // Optional sources — degrade gracefully if table/columns not yet migrated.
    const ver = await supabase.from("verifications").select("*");
    if (!ver.error && ver.data) setVerifications(ver.data);

    const nt = await supabase
      .from("admin_notes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (!nt.error && nt.data) setNotes(nt.data as any);

    const st = await supabase.from("admin_settings" as any).select("*");
    if (!st.error && st.data) {
      const obj: Record<string, any> = {};
      (st.data as any[]).forEach((row) => (obj[row.key] = row.value));
      setSettings(obj);
    }

    setLoadingData(false);
  };

  const userById = useMemo(() => {
    const m = new Map<string, Profile>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const notesByEntity = useMemo(() => {
    const m = new Map<string, AdminNote[]>();
    notes.forEach((n) => {
      const key = `${n.entity_type}:${n.entity_id}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(n);
    });
    return m;
  }, [notes]);

  const notesFor = (type: string, id: string) => notesByEntity.get(`${type}:${id}`) || [];

  // -------- Operational overview metrics (Översikt) --------
  const overview = useMemo(() => {
    const newTasksToday = tasks.filter((t) => isToday(t.created_at)).length;
    const activeTasks = tasks.filter((t) => ACTIVE_STATUSES.has(t.status)).length;
    const completedTasks = tasks.filter((t) => COMPLETED_STATUSES.has(t.status)).length;
    const newUsersToday = users.filter((u) => isToday(u.created_at)).length;
    const pendingVerifications = verifications.filter((v) => v.status === "pending").length;
    const pendingPayments = payments.filter((p) => PAYMENT_PENDING.has(String(p.status))).length;
    const pendingPayouts = payments.filter((p) => PAYOUT_PENDING.has(String(p.status))).length;
    const openReports = reports.filter((r) => r.status === "open").length;
    const openDisputes = disputes.filter((d) => d.status === "open").length;
    return {
      newTasksToday,
      activeTasks,
      completedTasks,
      newUsersToday,
      pendingVerifications,
      pendingPayments,
      pendingPayouts,
      openIssues: openReports + openDisputes,
      hasVerificationData: verifications.length > 0,
    };
  }, [tasks, users, verifications, payments, reports, disputes]);

  const overviewCards = [
    { label: "Nya uppdrag idag", value: overview.newTasksToday, icon: <ClipboardList size={18} /> },
    { label: "Aktiva uppdrag", value: overview.activeTasks, icon: <TrendingUp size={18} /> },
    { label: "Slutförda uppdrag", value: overview.completedTasks, icon: <CheckCircle2 size={18} /> },
    { label: "Nya användare idag", value: overview.newUsersToday, icon: <UserPlus size={18} /> },
    {
      label: "Väntande verifieringar",
      value: overview.hasVerificationData ? overview.pendingVerifications : "Saknar data",
      icon: <BadgeCheck size={18} />,
    },
    { label: "Betalningar som väntar", value: overview.pendingPayments, icon: <CreditCard size={18} /> },
    { label: "Utbetalningar som väntar", value: overview.pendingPayouts, icon: <CreditCard size={18} /> },
    { label: "Öppna rapporter/tvister", value: overview.openIssues, icon: <AlertTriangle size={18} /> },
  ];

  // -------- Rich KPIs (kept inside Översikt) --------
  const kpis = useMemo(() => {
    const totalTasks = tasks.length;
    const tasksWithBids = new Set(bids.map((b) => b.task_id));
    const bidCoverage = totalTasks ? tasksWithBids.size / totalTasks : 0;
    const tasksWithoutBids = totalTasks - tasksWithBids.size;
    const bookedCount = tasks.filter((t) => BOOKED_STATUSES.has(t.status)).length;
    const bookingRate = totalTasks ? bookedCount / totalTasks : 0;

    const succeededPayments = payments.filter((p) =>
      ["captured", "released", "succeeded", "paid"].includes(String(p.status))
    );
    const gmv = succeededPayments.reduce((s, p) => s + (p.amount_sek || 0), 0);
    const revenue = succeededPayments.reduce(
      (s, p) =>
        s + (p.platform_fee_sek || 0) + (p.customer_fee_sek || 0) + (p.tasker_fee_sek || 0),
      0
    );
    const avgPrice = succeededPayments.length ? Math.round(gmv / succeededPayments.length) : 0;
    const avgRevenuePerTask = succeededPayments.length
      ? Math.round(revenue / succeededPayments.length)
      : 0;
    const takeRate = gmv ? revenue / gmv : 0;

    const customerCounts = new Map<string, number>();
    tasks.forEach((t) =>
      customerCounts.set(t.customer_user_id, (customerCounts.get(t.customer_user_id) || 0) + 1)
    );
    const repeatCustomers = [...customerCounts.values()].filter((c) => c > 1).length;
    const repeatRate = customerCounts.size ? repeatCustomers / customerCounts.size : 0;

    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeTaskers = new Set(
      bids.filter((b) => new Date(b.created_at).getTime() >= cutoff).map((b) => b.bidder_id)
    );

    const perCity = new Map<string, number>();
    activeTaskers.forEach((id) => {
      const city = userById.get(id)?.city || "Okänd";
      perCity.set(city, (perCity.get(city) || 0) + 1);
    });
    const activeTaskersPerCity = [...perCity.entries()].sort((a, b) => b[1] - a[1]);

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
    { label: "GMV", value: fmtSEK(kpis.gmv), icon: <TrendingUp size={18} /> },
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

  const filteredVerifUsers = useMemo(() => {
    const q = verifQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    );
  }, [users, verifQuery]);

  const cancelledOrCompleted = useMemo(
    () => tasks.filter((t) => CLOSED_STATUSES.has(t.status) || (t as any).cancelled_by_admin),
    [tasks]
  );

  const reportedUserIds = useMemo(
    () => reports.filter((r) => r.target_type === "user").map((r) => r.target_id),
    [reports]
  );

  // ---- actions ----
  const stampAdmin = () => ({ admin_updated_at: new Date().toISOString() });

  const toggleUserDeactivation = async (userId: string, current: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_deactivated: !current, ...stampAdmin() } as any)
      .eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Användare avblockerad" : "Användare blockerad");
      fetchData();
    }
  };

  const toggleUserFlag = async (userId: string, current: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_flagged: !current, ...stampAdmin() } as any)
      .eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Flagga borttagen" : "Användare flaggad");
      fetchData();
    }
  };

  const toggleManualVerify = async (userId: string, current: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ manually_verified: !current, ...stampAdmin() } as any)
      .eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Manuell verifiering borttagen" : "Markerad som manuellt verifierad");
      fetchData();
    }
  };

  const toggleTaskHidden = async (taskId: string, current: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ is_hidden: !current, ...stampAdmin() } as any)
      .eq("id", taskId);
    if (error) toast.error(error.message);
    else fetchData();
  };

  const toggleTaskFlag = async (taskId: string, current: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ is_flagged: !current, ...stampAdmin() } as any)
      .eq("id", taskId);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Flagga borttagen" : "Uppdrag flaggat");
      fetchData();
    }
  };

  const cancelTaskByAdmin = async (taskId: string) => {
    if (!confirm("Avbryt detta uppdrag som admin?")) return;
    const { error } = await supabase
      .from("tasks")
      .update({ status: "cancelled", cancelled_by_admin: true, ...stampAdmin() } as any)
      .eq("id", taskId);
    if (error) toast.error(error.message);
    else {
      toast.success("Uppdrag avbrutet");
      fetchData();
    }
  };

  const setPaymentStatus = async (paymentId: string, status: string) => {
    const { error } = await supabase
      .from("payments")
      .update({ status: status as any })
      .eq("id", paymentId);
    if (error) toast.error(error.message);
    else {
      toast.success("Betalningsstatus uppdaterad");
      fetchData();
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    const { error } = await supabase.from("reports").update({ status: status as any }).eq("id", reportId);
    if (error) toast.error(error.message);
    else fetchData();
  };

  const resolveDispute = async (d: Dispute) => {
    const { error } = await supabase.from("disputes").update({ status: "resolved" }).eq("id", d.id);
    if (error) return toast.error(error.message);
    await supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", d.task_id)
      .eq("status", "disputed");
    toast.success("Tvist markerad som löst");
    fetchData();
  };

  const openDisputeChat = (d: Dispute) => {
    if (d.thread_id) navigate(`/messages?thread=${d.thread_id}`);
    else navigate(`/task/${d.task_id}`);
  };

  const addNote = async (entityType: string, entityId: string) => {
    const note = window.prompt("Intern anteckning (syns endast för admin):");
    if (!note || !note.trim()) return;
    const { error } = await supabase
      .from("admin_notes" as any)
      .insert({ entity_type: entityType, entity_id: entityId, note: note.trim() } as any);
    if (error) toast.error("Kunde inte spara anteckning: " + error.message);
    else {
      toast.success("Anteckning sparad");
      fetchData();
    }
  };

  const saveSetting = async (key: string, value: any) => {
    const { error } = await supabase
      .from("admin_settings" as any)
      .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: user?.id } as any);
    if (error) toast.error("Kunde inte spara: " + error.message);
    else {
      toast.success("Inställning sparad");
      setSettings((s) => ({ ...s, [key]: value }));
    }
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

  const NoteCell = ({ type, id }: { type: string; id: string }) => {
    const list = notesFor(type, id);
    return (
      <Button variant="ghost" size="sm" className="gap-1" onClick={() => addNote(type, id)}>
        <StickyNote size={14} />
        {list.length > 0 ? list.length : "Anteckna"}
      </Button>
    );
  };

  return (
    <Layout>
      <div className="bg-foreground">
        <div className="container py-8">
          <h1 className="text-2xl font-bold font-display text-background mb-1">Admin Dashboard</h1>
          <p className="text-background/70">Internt kontrollcenter för Moas</p>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="tasks">Uppdrag</TabsTrigger>
            <TabsTrigger value="users">Användare</TabsTrigger>
            <TabsTrigger value="payments">Betalningar</TabsTrigger>
            <TabsTrigger value="verifications">Verifieringar</TabsTrigger>
            <TabsTrigger value="disputes">Tvister</TabsTrigger>
            <TabsTrigger value="reports">Rapporter</TabsTrigger>
            <TabsTrigger value="closed">Avbrutna/Slutförda</TabsTrigger>
            <TabsTrigger value="reviews">Recensioner</TabsTrigger>
            <TabsTrigger value="settings">Inställningar</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {overviewCards.map((k, i) => (
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

            <div>
              <h3 className="font-semibold mb-3">Nyckeltal</h3>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {kpiCards.map((k) => (
                  <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      {k.icon}
                      <span className="text-xs">{k.label}</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{k.value}</p>
                  </div>
                ))}
              </div>
            </div>

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
                    const flagged = (t as any).is_flagged;
                    return (
                      <tr key={t.id} className="border-t border-border">
                        <td className="p-3 max-w-xs">
                          <Link to={`/task/${t.id}`} className="font-medium hover:underline">
                            {t.title}
                          </Link>
                          {flagged && (
                            <Badge variant="destructive" className="ml-2">
                              Flaggat
                            </Badge>
                          )}
                          {t.is_hidden && (
                            <Badge variant="outline" className="ml-2">
                              Dold
                            </Badge>
                          )}
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
                        <td className="p-3 text-right whitespace-nowrap space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleTaskFlag(t.id, flagged)}>
                            <Flag size={14} className={flagged ? "text-destructive" : ""} />
                          </Button>
                          <Button
                            variant={t.is_hidden ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => toggleTaskHidden(t.id, t.is_hidden)}
                          >
                            {t.is_hidden ? "Visa" : "Dölj"}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => cancelTaskByAdmin(t.id)}>
                            Avbryt
                          </Button>
                          <NoteCell type="task" id={t.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

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
                    <th className="text-left p-3 font-medium">Verifiering</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isReported = reportedUserIds.includes(u.id);
                    const flagged = (u as any).is_flagged;
                    const v = verifInfo(u);
                    return (
                      <tr key={u.id} className="border-t border-border">
                        <td className="p-3">
                          <Link to={`/profile/${u.id}`} className="font-medium hover:underline">
                            {u.name}
                          </Link>
                          {flagged && (
                            <Badge variant="destructive" className="ml-2">
                              Flaggad
                            </Badge>
                          )}
                          {isReported && (
                            <Badge variant="warning" className="ml-2">
                              Rapporterad
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{u.email}</td>
                        <td className="p-3 text-muted-foreground">{u.city || "—"}</td>
                        <td className="p-3">
                          <Badge variant={v.variant}>{v.label}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={u.is_deactivated ? "destructive" : "success"}>
                            {u.is_deactivated ? "Blockerad" : "Aktiv"}
                          </Badge>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleUserFlag(u.id, flagged)}>
                            <Flag size={14} className={flagged ? "text-destructive" : ""} />
                          </Button>
                          <Button
                            variant={u.is_deactivated ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => toggleUserDeactivation(u.id, u.is_deactivated)}
                          >
                            {u.is_deactivated ? "Avblockera" : "Blockera"}
                          </Button>
                          <NoteCell type="user" id={u.id} />
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
            <p className="text-xs text-muted-foreground mb-3">
              Obs: betalningar hanteras manuellt i denna version (ingen live-integration än).
              Statusändringar nedan är manuella adminkontroller.
            </p>
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
                    <th className="text-right p-3 font-medium">Åtgärd</th>
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
                        (p.platform_fee_sek || 0) + (p.customer_fee_sek || 0) + (p.tasker_fee_sek || 0);
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
                          <td className="p-3 text-right">
                            <Select value={String(p.status)} onValueChange={(v) => setPaymentStatus(p.id, v)}>
                              <SelectTrigger className="w-[170px] ml-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAYMENT_STATUS_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* VERIFICATIONS */}
          <TabsContent value="verifications">
            <div className="mb-3">
              <Input
                placeholder="Sök namn eller e-post..."
                value={verifQuery}
                onChange={(e) => setVerifQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Användare</th>
                    <th className="text-left p-3 font-medium">E-post</th>
                    <th className="text-left p-3 font-medium">Telefon</th>
                    <th className="text-left p-3 font-medium">Google</th>
                    <th className="text-left p-3 font-medium">BankID</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVerifUsers.map((u) => {
                    const v = verifInfo(u);
                    const manual = (u as any).manually_verified;
                    const yesNo = (b: boolean) =>
                      b ? (
                        <CheckCircle2 size={16} className="text-success" />
                      ) : (
                        <XCircle size={16} className="text-muted-foreground" />
                      );
                    return (
                      <tr key={u.id} className="border-t border-border">
                        <td className="p-3 font-medium">{u.name}</td>
                        <td className="p-3 text-muted-foreground">{u.email}</td>
                        <td className="p-3">{yesNo(u.phone_verified)}</td>
                        <td className="p-3">{yesNo(u.google_connected)}</td>
                        <td className="p-3">{yesNo(u.bankid_verified)}</td>
                        <td className="p-3">
                          <Badge variant={v.variant}>{v.label}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant={manual ? "outline" : "secondary"}
                            size="sm"
                            className="gap-1"
                            onClick={() => toggleManualVerify(u.id, manual)}
                          >
                            <ShieldCheck size={14} />
                            {manual ? "Ta bort manuell" : "Verifiera manuellt"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <Button variant="outline" size="sm" onClick={() => openDisputeChat(d)}>
                              Öppna chatt
                            </Button>
                            {d.status !== "resolved" && (
                              <Button size="sm" onClick={() => resolveDispute(d)}>
                                Markera löst
                              </Button>
                            )}
                            <NoteCell type="task" id={d.task_id} />
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
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {r.status !== "closed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateReportStatus(r.id, r.status === "open" ? "reviewing" : "closed")
                              }
                            >
                              {r.status === "open" ? "Granska" : "Markera löst"}
                            </Button>
                          )}
                          <NoteCell type="report" id={r.id} />
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
                    cancelledOrCompleted.map((t) => {
                      const cancelled = (t as any).cancelled_by_admin || t.status === "cancelled";
                      return (
                        <tr key={t.id} className="border-t border-border">
                          <td className="p-3">
                            <Link to={`/task/${t.id}`} className="font-medium hover:underline">
                              {t.title}
                            </Link>
                          </td>
                          <td className="p-3">{userById.get(t.customer_user_id)?.name || "—"}</td>
                          <td className="p-3">
                            {t.assigned_tasker_id ? userById.get(t.assigned_tasker_id)?.name || "—" : "—"}
                          </td>
                          <td className="p-3">
                            <Badge variant={cancelled ? "destructive" : "success"}>
                              <span className="inline-flex items-center gap-1">
                                {cancelled ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                                {cancelled ? "Avbruten" : "Slutfört"}
                              </span>
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{t.city || "—"}</td>
                          <td className="p-3 text-muted-foreground">{fmtDate(t.updated_at)}</td>
                        </tr>
                      );
                    })
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
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <Button
                            variant={r.is_hidden ? "outline" : "destructive"}
                            size="sm"
                            onClick={async () => {
                              const { error } = await supabase
                                .from("reviews")
                                .update({ is_hidden: !r.is_hidden })
                                .eq("id", r.id);
                              if (error) toast.error(error.message);
                              else fetchData();
                            }}
                          >
                            {r.is_hidden ? "Återställ" : "Dölj"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserFlag(r.reviewer_user_id, false)}
                          >
                            <Flag size={14} /> Flagga recensent
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="space-y-4 max-w-2xl">
            <SettingRow
              label="Support-e-post"
              keyName="support_email"
              value={settings.support_email || ""}
              placeholder="support@moas.se"
              onSave={saveSetting}
            />
            <SettingRow
              label="Underhållsmeddelande"
              keyName="maintenance_message"
              value={settings.maintenance_message || ""}
              placeholder="Lämna tomt om ingen underhåll pågår"
              onSave={saveSetting}
            />
            <SettingRow
              label="Plattformsstatus-meddelande"
              keyName="platform_status_message"
              value={settings.platform_status_message || ""}
              placeholder="T.ex. driftinformation till användare"
              onSave={saveSetting}
            />
            <SettingRow
              label="Dolda kategorier (kommaseparerat)"
              keyName="hidden_categories"
              value={Array.isArray(settings.hidden_categories) ? settings.hidden_categories.join(", ") : ""}
              placeholder="T.ex. Djur, Övrigt"
              transform={(s) => s.split(",").map((x) => x.trim()).filter(Boolean)}
              onSave={saveSetting}
            />
            <SettingRow
              label="Blockerade nyckelord (kommaseparerat)"
              keyName="blocked_keywords"
              value={Array.isArray(settings.blocked_keywords) ? settings.blocked_keywords.join(", ") : ""}
              placeholder="Ord som inte tillåts i uppdrag"
              transform={(s) => s.split(",").map((x) => x.trim()).filter(Boolean)}
              onSave={saveSetting}
            />
            <p className="text-xs text-muted-foreground">
              Inställningar sparas i tabellen <code>admin_settings</code>. Om sparning misslyckas är
              migrationen ännu inte körd.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Small editable setting row
const SettingRow = ({
  label,
  keyName,
  value,
  placeholder,
  transform,
  onSave,
}: {
  label: string;
  keyName: string;
  value: string;
  placeholder?: string;
  transform?: (s: string) => any;
  onSave: (key: string, value: any) => void;
}) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <div className="flex gap-2">
        <Input value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} />
        <Button onClick={() => onSave(keyName, transform ? transform(draft) : draft)}>Spara</Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
