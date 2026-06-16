import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ServiceCard, { ServiceCardData } from "./ServiceCard";

interface Props {
  city?: string | null;
  limit?: number;
}

const NearbyServicesRow = ({ city, limit = 6 }: Props) => {
  const [services, setServices] = useState<ServiceCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let q = supabase
        .from("service_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (city) q = q.eq("city", city);
      let { data } = await q;
      if ((!data || data.length === 0) && city) {
        const fallback = await supabase
          .from("service_listings")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(limit);
        data = fallback.data;
      }
      if (data && mounted) {
        const ids = Array.from(new Set(data.map((s: any) => s.tasker_user_id)));
        const { data: profiles } = await supabase
          .from("public_profiles" as any)
          .select("*")
          .in("id", ids) as any;
        const map: Record<string, any> = {};
        profiles?.forEach((p: any) => (map[p.id] = p));
        setServices(
          data.map((s: any) => ({
            id: s.id,
            title: s.title,
            category: s.category,
            description: s.description,
            city: s.city,
            price_sek: s.price_sek,
            price_type: s.price_type,
            cover_image_url: s.cover_image_url,
            tasker_user_id: s.tasker_user_id,
            tasker_name: map[s.tasker_user_id]?.name,
            tasker_rating: map[s.tasker_user_id]?.rating_avg,
            tasker_rating_count: map[s.tasker_user_id]?.rating_count,
          }))
        );
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [city, limit]);

  if (!loading && services.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[19px] font-bold font-display text-foreground">Erbjudna tjänster</h2>
        <Link to="/services" className="text-[13px] text-primary font-semibold flex items-center gap-1">
          Visa alla <ArrowRight size={14} />
        </Link>
      </div>
      {loading ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-[180px] h-[260px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x">
          {services.map((s) => (
            <div key={s.id} className="min-w-[180px] max-w-[180px] snap-start">
              <ServiceCard service={s} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyServicesRow;
