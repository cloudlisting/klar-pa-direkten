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
import TaskActions from "@/components/TaskActions";
import ReviewForm from "@/components/ReviewForm";
import ReviewsList from "@/components/ReviewsList";
import TrustProfileCard from "@/components/TrustProfileCard";
import TrustBadges from "@/components/TrustBadges";
import { MapPin, Calendar, Clock, ArrowLeft, Star, MessageSquare, Send, CreditCard, Zap, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { TASK_STATUS_LABELS, calculateFees, CUSTOMER_FEE_PERCENT } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks"> & { auto_accept_price_sek?: number | null };
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
  const [instantAccepting, setInstantAccepting] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerData, setOfferData] = useState({
    price: "",
    message: "",
    duration: "",
  });
  const [taskerProfile, setTaskerProfile] = useState<Tables<"tasker_profiles"> | null>(null);
  const [customerProfile, setCustomerProfile] = useState<Tables<"profiles"> | null>(null);
  const [taskerUserProfile, setTaskerUserProfile] = useState<Tables<"profiles"> | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const isOwner = user?.id === task?.customer_user_id;
  const isAssignedTasker = user?.id === task?.assigned_tasker_id;
  const hasOffered = offers.some((o) => o.tasker_user_id === user?.id);
  const taskStatus = task?.status as string;
  const canInstantAccept = taskStatus === "instant_open" && 
    task?.auto_accept_price_sek && 
    isTasker && 
    !isOwner &&
    !hasOffered &&
    taskerProfile?.service_area_city === task?.city;
  const canReview = taskStatus === "paid" && !hasReviewed && user;

  useEffect(() => {
    fetchTask();
  }, [id]);

  useEffect(() => {
    if (user && isTasker) {
      fetchTaskerProfile();
    }
  }, [user, isTasker]);

  useEffect(() => {
    if (task && user && taskStatus === "paid") {
      checkIfReviewed();
      fetchProfilesForReview();
    }
  }, [task, user, taskStatus]);

  const checkIfReviewed = async () => {
    if (!user || !task) return;
    const { data } = await supabase
      .from("reviews")
      .select("id")
      .eq("task_id", task.id)
      .eq("reviewer_user_id", user.id)
      .maybeSingle();
    setHasReviewed(!!data);
  };

  const fetchProfilesForReview = async () => {
    if (!task) return;
    // Fetch customer profile (for tasker to review)
    const { data: custProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", task.customer_user_id)
      .maybeSingle();
    if (custProfile) setCustomerProfile(custProfile);

    // Fetch assigned tasker profile (for customer to review)
    if (task.assigned_tasker_id) {
      const { data: taskerProf } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", task.assigned_tasker_id)
        .maybeSingle();
      if (taskerProf) setTaskerUserProfile(taskerProf);
    }
  };

  const fetchTaskerProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasker_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setTaskerProfile(data);
  };

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

    setTask(taskData as Task);

    // Always fetch customer profile for trust display
    const { data: custProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", taskData.customer_user_id)
      .maybeSingle();
    if (custProfile) setCustomerProfile(custProfile);

    // Fetch offers if logged in
    if (user) {
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("task_id", id)
        .order("created_at", { ascending: false });

      if (offersData) {
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

  const handleInstantAccept = async () => {
    if (!user || !task || !task.auto_accept_price_sek) return;

    setInstantAccepting(true);
    try {
      // Create an offer at the auto-accept price
      const { data: offerData, error: offerError } = await supabase
        .from("offers")
        .insert({
          task_id: task.id,
          tasker_user_id: user.id,
          price_sek: task.auto_accept_price_sek,
          message: "Direktbokning accepterad",
          status: "accepted",
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Update task to assigned
      await supabase
        .from("tasks")
        .update({
          status: "assigned",
          assigned_tasker_id: user.id,
        })
        .eq("id", task.id);

      // Create chat thread
      await supabase.from("chat_threads").insert({
        task_id: task.id,
        customer_user_id: task.customer_user_id,
        tasker_user_id: user.id,
      });

      toast.success("Du har accepterat uppdraget!", {
        description: "Du kan nu chatta med kunden.",
      });
      fetchTask();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte acceptera");
    } finally {
      setInstantAccepting(false);
    }
  };

  const startChat = async (taskerId: string) => {
    if (!task || !user) return;

    const customerId = isOwner ? user.id : task.customer_user_id;
    const taskerUserId = isOwner ? taskerId : user.id;

    try {
      const { data: existingThread, error: lookupError } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("task_id", task.id)
        .eq("customer_user_id", customerId)
        .eq("tasker_user_id", taskerUserId)
        .maybeSingle();

      if (lookupError) {
        console.error("Thread lookup failed:", lookupError);
        toast.error("Kunde inte hämta konversation: " + lookupError.message);
        return;
      }

      let threadId = existingThread?.id;

      if (!threadId) {
        const { data: newThread, error: insertError } = await supabase
          .from("chat_threads")
          .insert({
            task_id: task.id,
            customer_user_id: customerId,
            tasker_user_id: taskerUserId,
          })
          .select("id")
          .single();

        if (insertError || !newThread) {
          console.error("Thread create failed:", insertError);
          toast.error(
            "Kunde inte starta chatt: " + (insertError?.message || "okänt fel")
          );
          return;
        }
        threadId = newThread.id;
      }

      toast.success("Chatt öppnad");
      navigate(`/messages?thread=${threadId}`);
    } catch (err: any) {
      console.error("startChat error:", err);
      toast.error("Något gick fel: " + (err?.message || "okänt fel"));
    }
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

  const price = task.budget_max_sek || task.budget_min_sek || 0;
  const autoAcceptPrice = task.auto_accept_price_sek;

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
                {taskStatus === "instant_open" && (
                  <Badge variant="accent" className="gap-1"><Zap size={10} /> Direktbokning</Badge>
                )}
                <Badge variant="success">{TASK_STATUS_LABELS[task.status] || task.status}</Badge>
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

              {customerProfile && (
                <div className="rounded-xl border border-border bg-card p-5 mt-4">
                  <h3 className="font-semibold text-foreground mb-3">Postad av</h3>
                  <TrustProfileCard
                    userId={customerProfile.id}
                    name={customerProfile.name}
                    avatarUrl={customerProfile.avatar_url}
                    trust={customerProfile}
                    subtitle={
                      customerProfile.rating_count
                        ? `${customerProfile.rating_count} recensioner`
                        : "Ny på Taskly"
                    }
                  />
                </div>
              )}
            </motion.div>

            {/* Instant Accept for Taskers */}
            {canInstantAccept && autoAcceptPrice && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border-2 border-accent bg-accent/5 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Zap className="text-accent" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">Direktbokning tillgänglig!</h3>
                    <p className="text-muted-foreground mb-4">
                      Acceptera detta uppdrag direkt för {autoAcceptPrice.toLocaleString("sv-SE")} kr. 
                      Du får {calculateFees(autoAcceptPrice).totalTaskerPayout.toLocaleString("sv-SE")} kr efter avgift.
                    </p>
                    <Button 
                      variant="accent" 
                      size="lg" 
                      className="gap-2"
                      onClick={handleInstantAccept}
                      disabled={instantAccepting}
                    >
                      {instantAccepting ? "Accepterar..." : (
                        <>
                          <CheckCircle size={18} />
                          Acceptera nu för {autoAcceptPrice.toLocaleString("sv-SE")} kr
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

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
                          <div className="flex-1 min-w-0">
                            <TrustProfileCard
                              userId={offer.tasker_user_id}
                              name={offer.profile?.name || "Tasker"}
                              avatarUrl={offer.profile?.avatar_url}
                              trust={offer.profile || {}}
                              subtitle={offer.tasker_profile?.service_area_city || undefined}
                            />
                            {offer.status === "accepted" && (
                              <Badge variant="success" className="text-xs mt-2">Accepterad</Badge>
                            )}
                          </div>
                          <div className="text-right shrink-0">
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
            {!isOwner && isTasker && !hasOffered && (taskStatus === "published" || taskStatus === "instant_open") && (
              <div className="rounded-xl border border-border bg-card p-5">
                {showOfferForm ? (
                  <form onSubmit={handleSubmitOffer} className="space-y-4">
                    <h3 className="font-semibold text-foreground mb-2">Skicka ett bud</h3>
                    <div>
                      <Label htmlFor="price">Ditt pris (SEK) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder={price.toString()}
                        value={offerData.price}
                        onChange={(e) => setOfferData({ ...offerData, price: e.target.value })}
                        className="mt-1.5"
                        required
                      />
                      {offerData.price && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Du får {calculateFees(parseInt(offerData.price)).totalTaskerPayout.toLocaleString("sv-SE")} kr efter avgift
                        </p>
                      )}
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
                    <Button variant="outline" onClick={() => setShowOfferForm(true)}>
                      Lägg ett eget bud
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Message button for taskers who want to ask questions before bidding */}
            {!isOwner && isTasker && user && (taskStatus === "published" || taskStatus === "instant_open") && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => startChat(user.id)}
                >
                  <MessageSquare size={16} />
                  Skicka meddelande till kunden
                </Button>
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

            {/* Review prompt after task is paid */}
            {canReview && !showReviewForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border-2 border-warning/30 bg-warning/5 p-5"
              >
                <h3 className="font-semibold text-foreground mb-2">🎉 Uppdraget är klart!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isOwner 
                    ? "Hur var din upplevelse med taskern? Lämna en recension för att hjälpa andra."
                    : "Hur var din upplevelse med kunden? Lämna en recension."}
                </p>
                <Button variant="hero" onClick={() => setShowReviewForm(true)}>
                  Lämna recension
                </Button>
              </motion.div>
            )}

            {showReviewForm && task && (
              <>
                {isOwner && task.assigned_tasker_id && taskerUserProfile && (
                  <ReviewForm
                    task={task}
                    revieweeId={task.assigned_tasker_id}
                    revieweeName={taskerUserProfile.name}
                    onComplete={() => {
                      setShowReviewForm(false);
                      setHasReviewed(true);
                    }}
                  />
                )}
                {isAssignedTasker && customerProfile && (
                  <ReviewForm
                    task={task}
                    revieweeId={task.customer_user_id}
                    revieweeName={customerProfile.name}
                    onComplete={() => {
                      setShowReviewForm(false);
                      setHasReviewed(true);
                    }}
                  />
                )}
              </>
            )}

            {hasReviewed && (
              <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-center">
                <p className="text-success font-medium">✓ Tack för din recension!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card sticky top-24">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-foreground">
                  {price.toLocaleString("sv-SE")} kr
                </p>
                <p className="text-sm text-muted-foreground">Fast pris</p>
                
                {autoAcceptPrice && taskStatus === "instant_open" && (
                  <div className="mt-2 inline-flex items-center gap-1 text-sm text-accent font-medium">
                    <Zap size={14} />
                    Direktbokning: {autoAcceptPrice.toLocaleString("sv-SE")} kr
                  </div>
                )}
              </div>

              {!user && (
                <Button variant="hero" size="lg" className="w-full mb-3" asChild>
                  <Link to="/auth">Logga in för att lägga bud</Link>
                </Button>
              )}

              {canInstantAccept && autoAcceptPrice && (
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full mb-3 gap-2"
                  onClick={handleInstantAccept}
                  disabled={instantAccepting}
                >
                  <Zap size={16} />
                  Acceptera direkt
                </Button>
              )}

              {user && !isOwner && isTasker && !hasOffered && !canInstantAccept && (taskStatus === "published" || taskStatus === "instant_open") && (
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

            {/* Task Actions (status progression, cancel, dispute) */}
            {user && task && (
              <TaskActions
                task={task}
                isOwner={isOwner}
                isAssignedTasker={isAssignedTasker}
                onUpdate={fetchTask}
              />
            )}

            {/* Status Timeline */}
            <StatusTimeline currentStatus={task.status} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskDetail;
