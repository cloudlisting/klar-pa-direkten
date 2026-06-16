import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OrderServiceButton from "@/components/OrderServiceButton";
import { CATEGORIES } from "@/lib/constants";
import { ArrowLeft, MapPin, Star, Edit, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<any>(null);
  const [tasker, setTasker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("service_listings").select("*").eq("id", id).maybeSingle();
      if (data) {
        setService(data);
        const { data: p } = await supabase
          .from("public_profiles" as any)
          .select("*")
          .eq("id", (data as any).tasker_user_id)
          .maybeSingle();
        setTasker(p);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <Layout><div className="container py-16 text-center text-muted-foreground">Laddar…</div></Layout>;
  if (!service) return <Layout><div className="container py-16 text-center"><p className="mb-4">Tjänsten finns inte.</p><Button asChild variant="outline"><Link to="/services"><ArrowLeft size={14} /> Tillbaka</Link></Button></div></Layout>;

  const isOwner = user?.id === service.tasker_user_id;
  const category = CATEGORIES.find((c) => c.name === service.category);

  const toggleStatus = async () => {
    const next = service.status === "active" ? "paused" : "active";
    const { error } = await supabase.from("service_listings").update({ status: next }).eq("id", service.id);
    if (error) toast.error(error.message);
    else { setService({ ...service, status: next }); toast.success(next === "active" ? "Annonsen är aktiv" : "Annonsen pausad"); }
  };

  const remove = async () => {
    if (!confirm("Ta bort annonsen?")) return;
    const { error } = await supabase.from("service_listings").delete().eq("id", service.id);
    if (error) toast.error(error.message);
    else { toast.success("Borttagen"); navigate("/services"); }
  };

  return (
    <Layout>
      <div className="container max-w-3xl py-6 md:py-10">
        <Button variant="ghost" size="sm" asChild className="mb-3"><Link to="/services"><ArrowLeft size={14} /> Alla tjänster</Link></Button>

        <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-card">
          <div className="aspect-[16/9] bg-secondary">
            {service.cover_image_url ? (
              <img src={service.cover_image_url} alt={service.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-7xl bg-gradient-to-br from-primary/10 to-accent/10">{category?.icon ?? "✨"}</div>
            )}
          </div>
          <div className="p-5 md:p-7">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="accent">Erbjuder</Badge>
              <Badge variant="secondary">{service.category}</Badge>
              {service.status !== "active" && <Badge variant="outline">{service.status === "paused" ? "Pausad" : "Arkiverad"}</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">{service.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {service.city && <span className="flex items-center gap-1"><MapPin size={14} /> {service.city}</span>}
              <span className="text-foreground font-semibold">{service.price_type === "from" ? "Från " : ""}{service.price_sek} kr</span>
            </div>

            <p className="mt-5 whitespace-pre-wrap text-foreground leading-relaxed">{service.description}</p>

            {tasker && (
              <Link to={`/profile/${tasker.id}`} className="mt-6 flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/40 transition-colors">
                {tasker.avatar_url ? (
                  <img src={tasker.avatar_url} alt={tasker.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{tasker.name?.charAt(0)?.toUpperCase()}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{tasker.name}</p>
                  {(tasker.rating_avg ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Star size={11} className="fill-current text-accent" /> {Number(tasker.rating_avg).toFixed(1)} ({tasker.rating_count})</p>
                  )}
                </div>
              </Link>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {isOwner ? (
                <>
                  <Button variant="outline" asChild><Link to={`/services/${service.id}/edit`}><Edit size={14} /> Redigera</Link></Button>
                  <Button variant="outline" onClick={toggleStatus}>
                    {service.status === "active" ? <><Pause size={14} /> Pausa</> : <><Play size={14} /> Aktivera</>}
                  </Button>
                  <Button variant="ghost" onClick={remove} className="text-destructive"><Trash2 size={14} /> Ta bort</Button>
                </>
              ) : (
                <OrderServiceButton
                  taskerUserId={service.tasker_user_id}
                  taskerName={tasker?.name}
                  category={service.category}
                  title={service.title}
                  price={service.price_sek}
                  serviceListingId={service.id}
                  label="Beställ den här tjänsten"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceDetail;
