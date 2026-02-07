import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StatusTimeline from "@/components/StatusTimeline";
import { MapPin, Calendar, Clock, Wifi, ArrowLeft, Star, MessageSquare, User, Send, CreditCard, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type Offer = Tables<"offers"> & {
  tasker_profile?: Tables<"tasker_profiles">;
  profile?: Tables<"profiles">;
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isTasker } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerData, setOfferData] = useState({
    price: "",
    message: "",
    duration: "",
  });

  const isOwner = user?.id === task?.customer_user_id;
  const hasOffered = offers.some((o) => o.tasker_user_id === user?.id);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    if (!id) return;

    const { data: taskData, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !taskData) {
      setLoading(false);
      return;
    }

    setTask(taskData);

    // Fetch offers if owner
    if (user) {
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("task_id", id)
        .order("created_at", { ascending: false });

      if (offersData) {
        // Fetch tasker profiles and user profiles for offers
        const taskerIds = offersData.map((o) => o.tasker_user_id);
        const [taskerProfiles, profiles] = await Promise.all([
          supabase.from("tasker_profiles").select("*").in("user_id", taskerIds),
          supabase.from("profiles").select("*").in("id", taskerIds),
        ]);

        const enrichedOffers = offersData.map((offer) => ({
          ...offer,
          tasker_profile: taskerProfiles.data?.find((tp) => tp.user_id === offer.tasker_user_id),
          profile: profiles.data?.find((p) => p.id === offer.tasker_user_id),
        }));

        setOffers(enrichedOffers);
      }
    }

    setLoading(false);
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !task) return;

    setSubmittingOffer(true);
    try {
      const { error } = await supabase.from("offers").insert({
        task_id: task.id,
        tasker_user_id: user.id,
        price_sek: parseInt(offerData.price),
        message: offerData.message,
        estimated_duration: offerData.duration,
      });

      if (error) throw error;

      toast.success("Bud skickat!");
      setShowOfferForm(false);
      fetchTask();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte skicka bud");
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleAcceptOffer = async (offerId: string, taskerId: string) => {
    try {
      // Update offer status
      await supabase
        .from("offers")
        .update({ status: "accepted" })
        .eq("id", offerId);

      // Update task status and assign tasker
      await supabase
        .from("tasks")
        .update({ status: "assigned", assigned_tasker_id: taskerId })
        .eq("id", task!.id);

      // Create chat thread
      await supabase.from("chat_threads").insert({
        task_id: task!.id,
        customer_user_id: user!.id,
        tasker_user_id: taskerId,
      });

      toast.success("Bud accepterat! Du kan nu chatta med taskern.");
      fetchTask();
    } catch (error: any) {
      toast.error("Kunde inte acceptera bud");
    }
  };

  const startChat = async (taskerId: string) => {
    // Check if thread exists
    const { data: existingThread } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("task_id", task!.id)
      .eq("customer_user_id", isOwner ? user!.id : taskerId)
      .eq("tasker_user_id", isOwner ? taskerId : user!.id)
      .maybeSingle();

    if (!existingThread) {
      await supabase.from("chat_threads").insert({
        task_id: task!.id,
        customer_user_id: isOwner ? user!.id : taskerId,
        tasker_user_id: isOwner ? taskerId : user!.id,
      });
    }

    navigate("/messages");
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

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Uppdraget hittades inte</h1>
          <Button variant="outline" asChild>
            <Link to="/browse"><ArrowLeft size={16} /> Tillbaka</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={14} /> Tillbaka till uppdrag
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary">{task.category}</Badge>
                {task.is_remote_possible && (
                  <Badge variant="muted" className="gap-1"><Wifi size={10} /> Distans möjligt</Badge>
                )}
                <Badge variant="success">{getStatusLabel(task.status)}</Badge>
              </div>
              <h1 className="text-2xl font-bold font-display text-foreground mb-4">
                {task.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1"><MapPin size={14} /> {task.city}</span>
                {task.preferred_date && (
                  <span className="flex items-center gap-1"><Calendar size={14} /> {task.preferred_date}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {new Date(task.created_at).toLocaleDateString("sv-SE")}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-2">Beskrivning</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {task.description || "Ingen beskrivning angiven."}
                </p>
              </div>
            </motion.div>

            {/* Offers section */}
            {(isOwner || hasOffered) && (
              <div>
                <h2 className="text-xl font-bold font-display text-foreground mb-4">
                  Bud ({offers.length})
                </h2>
                {offers.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <p className="text-muted-foreground">Inga bud ännu</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.map((offer, i) => (
                      <motion.div
                        key={offer.id}
                        className="rounded-xl border border-border bg-card p-5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-foreground">
                              {offer.profile?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{offer.profile?.name || "Tasker"}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <Star size={11} className="text-warning fill-warning" />
                                  {offer.tasker_profile?.avg_rating || "0"}
                                </span>
                                <span>({offer.tasker_profile?.completed_tasks_count || 0} uppdrag)</span>
                                {offer.status === "accepted" && (
                                  <Badge variant="success" className="text-xs">Accepterad</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {offer.price_sek.toLocaleString("sv-SE")} kr
                            </p>
                            {offer.estimated_duration && (
                              <p className="text-xs text-muted-foreground">{offer.estimated_duration}</p>
                            )}
                          </div>
                        </div>
                        {offer.message && (
                          <p className="mt-3 text-sm text-muted-foreground">{offer.message}</p>
                        )}
                        {isOwner && offer.status === "sent" && task.status !== "assigned" && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="hero"
                              className="gap-1"
                              asChild
                            >
                              <Link to={`/checkout/${task.id}/${offer.id}`}>
                                <CreditCard size={13} /> Acceptera och betala
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => startChat(offer.tasker_user_id)}
                            >
                              <MessageSquare size={13} /> Chatta
                            </Button>
                          </div>
                        )}
                        {offer.status === "accepted" && (
                          <div className="mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => navigate("/messages")}
                            >
                              <MessageSquare size={13} /> Gå till chatt
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Offer form for taskers */}
            {!isOwner && isTasker && !hasOffered && task.status === "published" && (
              <div className="rounded-xl border border-border bg-card p-5">
                {showOfferForm ? (
                  <form onSubmit={handleSubmitOffer} className="space-y-4">
                    <h3 className="font-semibold text-foreground mb-2">Skicka ett bud</h3>
                    <div>
                      <Label htmlFor="price">Pris (SEK) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder={task.budget_max_sek?.toString() || "1000"}
                        value={offerData.price}
                        onChange={(e) => setOfferData({ ...offerData, price: e.target.value })}
                        className="mt-1.5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Uppskattad tid</Label>
                      <Input
                        id="duration"
                        placeholder="T.ex. 2-3 timmar"
                        value={offerData.duration}
                        onChange={(e) => setOfferData({ ...offerData, duration: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Meddelande</Label>
                      <Textarea
                        id="message"
                        placeholder="Beskriv varför du är rätt person för uppdraget..."
                        value={offerData.message}
                        onChange={(e) => setOfferData({ ...offerData, message: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowOfferForm(false)}>
                        Avbryt
                      </Button>
                      <Button type="submit" variant="hero" disabled={submittingOffer || !offerData.price}>
                        {submittingOffer ? "Skickar..." : "Skicka bud"}
                        <Send size={14} />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-3">Intresserad av detta uppdrag?</p>
                    <Button variant="hero" onClick={() => setShowOfferForm(true)}>
                      Lägg ett bud
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!isOwner && !isTasker && user && (
              <div className="rounded-xl border border-border bg-card p-5 text-center">
                <p className="text-muted-foreground mb-3">Vill du lägga bud på uppdrag?</p>
                <Button variant="hero" asChild>
                  <Link to="/become-tasker">Bli tasker</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card sticky top-24">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-foreground">
                  {task.budget_min_sek && task.budget_max_sek
                    ? `${task.budget_min_sek.toLocaleString("sv-SE")} - ${task.budget_max_sek.toLocaleString("sv-SE")}`
                    : (task.budget_max_sek || task.budget_min_sek || 0).toLocaleString("sv-SE")
                  } kr
                </p>
                <p className="text-sm text-muted-foreground">
                  {task.budget_type === "fixed" ? "Fast pris" : "Per timme"}
                </p>
              </div>

              {!user && (
                <Button variant="hero" size="lg" className="w-full mb-3" asChild>
                  <Link to="/auth">Logga in för att lägga bud</Link>
                </Button>
              )}

              {user && !isOwner && isTasker && !hasOffered && task.status === "published" && (
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mb-3"
                  onClick={() => setShowOfferForm(true)}
                >
                  Lägg ett bud
                </Button>
              )}

              {user && hasOffered && (
                <p className="text-center text-sm text-success font-medium mb-3">
                  ✓ Du har lagt ett bud
                </p>
              )}

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Kategori</span>
                  <span className="text-foreground font-medium">{task.category}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Plats</span>
                  <span className="text-foreground font-medium">{task.city}</span>
                </div>
                {task.preferred_date && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Datum</span>
                    <span className="text-foreground font-medium">{task.preferred_date}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bud</span>
                  <span className="text-foreground font-medium">{offers.length} st</span>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <StatusTimeline currentStatus={task.status} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskDetail;
