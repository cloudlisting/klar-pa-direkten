import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, Lock, CheckCircle, AlertCircle, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type Offer = Tables<"offers">;
type Profile = Tables<"profiles">;

const PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee

const Checkout = () => {
  const { taskId, offerId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [taskerProfile, setTaskerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (taskId && offerId && user) {
      fetchData();
    }
  }, [taskId, offerId, user]);

  const fetchData = async () => {
    try {
      // Fetch task
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (taskError || !taskData) {
        toast.error("Kunde inte hitta uppdraget");
        navigate("/my-tasks");
        return;
      }

      // Verify user is task owner
      if (taskData.customer_user_id !== user?.id) {
        toast.error("Du har inte behörighet");
        navigate("/my-tasks");
        return;
      }

      setTask(taskData);

      // Fetch offer
      const { data: offerData, error: offerError } = await supabase
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (offerError || !offerData) {
        toast.error("Kunde inte hitta budet");
        navigate(`/task/${taskId}`);
        return;
      }

      setOffer(offerData);

      // Fetch tasker profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", offerData.tasker_user_id)
        .single();

      if (profileData) {
        setTaskerProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching checkout data:", error);
      toast.error("Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = () => {
    if (!offer) return { subtotal: 0, platformFee: 0, total: 0 };
    const subtotal = offer.price_sek;
    const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT);
    const total = subtotal + platformFee;
    return { subtotal, platformFee, total };
  };

  const handleConfirmPayment = async () => {
    if (!task || !offer || !user) return;

    setProcessing(true);
    try {
      const { subtotal, platformFee, total } = calculateFees();

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        task_id: task.id,
        payer_user_id: user.id,
        payee_user_id: offer.tasker_user_id,
        amount_sek: subtotal,
        platform_fee_sek: platformFee,
        status: "held_in_escrow",
        provider: "stripe",
      });

      if (paymentError) throw paymentError;

      // Update offer status
      await supabase
        .from("offers")
        .update({ status: "accepted" })
        .eq("id", offer.id);

      // Reject other offers
      await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("task_id", task.id)
        .neq("id", offer.id);

      // Update task status
      await supabase
        .from("tasks")
        .update({
          status: "assigned",
          assigned_tasker_id: offer.tasker_user_id,
        })
        .eq("id", task.id);

      // Create chat thread if not exists
      const { data: existingThread } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("task_id", task.id)
        .eq("customer_user_id", user.id)
        .eq("tasker_user_id", offer.tasker_user_id)
        .maybeSingle();

      if (!existingThread) {
        await supabase.from("chat_threads").insert({
          task_id: task.id,
          customer_user_id: user.id,
          tasker_user_id: offer.tasker_user_id,
        });
      }

      toast.success("Betalning genomförd!", {
        description: "Beloppet hålls i escrow tills uppdraget är klart.",
      });
      navigate(`/task/${task.id}`);
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Betalningen misslyckades");
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </Layout>
    );
  }

  if (!task || !offer) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="mx-auto mb-4 text-destructive" size={48} />
          <h1 className="text-xl font-bold text-foreground mb-2">Något gick fel</h1>
          <Button variant="outline" asChild>
            <Link to="/my-tasks">
              <ArrowLeft size={16} /> Tillbaka till mina uppdrag
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const { subtotal, platformFee, total } = calculateFees();

  return (
    <Layout>
      <div className="container max-w-2xl py-8 md:py-12">
        <Link
          to={`/task/${task.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Tillbaka till uppdraget
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="text-success" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display text-foreground">
                  Säker betalning
                </h1>
                <p className="text-sm text-muted-foreground">
                  Pengarna hålls i escrow tills du godkänner uppdraget
                </p>
              </div>
            </div>

            {/* Task summary */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-1">Uppdrag</p>
              <p className="font-semibold text-foreground">{task.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {task.city} • {task.category}
              </p>
            </div>

            {/* Tasker info */}
            <div className="flex items-center gap-3 mb-6 p-4 rounded-lg border border-border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                {taskerProfile?.name?.charAt(0) || "T"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{taskerProfile?.name || "Tasker"}</p>
                <p className="text-sm text-muted-foreground">
                  Bud accepterat
                </p>
              </div>
              <Badge variant="success">Vald tasker</Badge>
            </div>

            <Separator className="my-6" />

            {/* Price breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taskers pris</span>
                <span className="text-foreground font-medium">
                  {subtotal.toLocaleString("sv-SE")} kr
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  Plattformsavgift (10%)
                  <span className="text-xs">(serviceavgift)</span>
                </span>
                <span className="text-foreground font-medium">
                  {platformFee.toLocaleString("sv-SE")} kr
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-foreground">Totalt</span>
                <span className="font-bold text-foreground">
                  {total.toLocaleString("sv-SE")} kr
                </span>
              </div>
            </div>

            {/* Escrow info */}
            <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 mb-6">
              <div className="flex items-start gap-3">
                <Lock className="text-accent mt-0.5" size={18} />
                <div>
                  <p className="font-medium text-foreground text-sm">Escrow-skydd</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pengarna hålls säkert av plattformen och släpps till taskern först när du bekräftar att uppdraget är klart.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <Button
              variant="hero"
              size="lg"
              className="w-full gap-2"
              onClick={handleConfirmPayment}
              disabled={processing}
            >
              {processing ? (
                "Behandlar..."
              ) : (
                <>
                  <CreditCard size={18} />
                  Bekräfta och betala {total.toLocaleString("sv-SE")} kr
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Genom att klicka godkänner du våra{" "}
              <Link to="/terms" className="underline hover:text-foreground">
                användarvillkor
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <Shield size={14} /> Säker betalning
            </span>
            <span className="flex items-center gap-1">
              <Lock size={14} /> Escrow-skydd
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle size={14} /> Pengarna tillbaka-garanti
            </span>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Checkout;
