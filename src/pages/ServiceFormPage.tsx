import Layout from "@/components/Layout";
import ServiceForm, { ServiceFormValues } from "@/components/ServiceForm";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ServiceFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const { user, loading, isTasker } = useAuth();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && user && !isTasker) navigate("/become-tasker");
  }, [user, loading, isTasker, navigate]);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const { data } = await supabase.from("service_listings").select("*").eq("id", id).maybeSingle();
      if (data) setInitial(data);
      setLoadingData(false);
    })();
  }, [id, isEdit]);

  const onSubmit = async (values: ServiceFormValues) => {
    if (!user) return;
    if (isEdit) {
      const { error } = await supabase.from("service_listings").update(values as any).eq("id", id!);
      if (error) { toast.error(error.message); return; }
      toast.success("Annonsen uppdaterad");
      navigate(`/services/${id}`);
    } else {
      const { data, error } = await supabase
        .from("service_listings")
        .insert({ ...values, tasker_user_id: user.id } as any)
        .select("id")
        .single();
      if (error) { toast.error(error.message); return; }
      toast.success("Annonsen är publicerad!");
      navigate(`/services/${data.id}`);
    }
  };

  if (loading || loadingData) {
    return <Layout><div className="container py-16 text-center text-muted-foreground">Laddar…</div></Layout>;
  }

  return (
    <Layout>
      <div className="container max-w-xl py-6 md:py-10 px-4">
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link to="/services"><ArrowLeft size={14} /> Tillbaka</Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
          {isEdit ? "Redigera tjänst" : "Erbjud en tjänst"}
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Berätta vad du kan hjälpa till med så att kunder kan beställa direkt.
        </p>
        <ServiceForm
          initial={initial ?? undefined}
          onSubmit={onSubmit}
          submitLabel={isEdit ? "Spara ändringar" : "Publicera tjänst"}
          uploadUserId={user?.id}
        />
      </div>
    </Layout>
  );
};

export default ServiceFormPage;
