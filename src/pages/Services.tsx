import Layout from "@/components/Layout";
import ServiceCard, { ServiceCardData } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, SWEDISH_CITIES } from "@/lib/constants";
import { Search, Plus, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Services = () => {
  const { user, isTasker } = useAuth();
  const [services, setServices] = useState<ServiceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("service_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);
      if (data) {
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
            tasker_avatar: map[s.tasker_user_id]?.avatar_url,
            tasker_rating: map[s.tasker_user_id]?.rating_avg,
            tasker_rating_count: map[s.tasker_user_id]?.rating_count,
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.title.toLowerCase().includes(q) || (s.description?.toLowerCase().includes(q) ?? false);
    const matchCat = category === "all" || s.category === CATEGORIES.find((c) => c.id === category)?.name;
    const matchCity = city === "all" || s.city === city;
    return matchSearch && matchCat && matchCity;
  });

  return (
    <Layout>
      <div className="bg-secondary/50 border-b border-border">
        <div className="container py-6 md:py-8">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
                Erbjudna tjänster
              </h1>
              <p className="text-sm text-muted-foreground">
                {loading ? "Laddar..." : `${filtered.length} taskers redo att hjälpa`}
              </p>
            </div>
            {user && isTasker && (
              <Button variant="hero" size="sm" asChild>
                <Link to="/services/new"><Plus size={16} /> Erbjud</Link>
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Sök tjänster…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-card"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 sm:w-44 bg-card"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kategorier</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-11 sm:w-40 bg-card"><SelectValue placeholder="Stad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla städer</SelectItem>
                {SWEDISH_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {c}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Laddar tjänster…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Inga tjänster matchade din sökning.</p>
            {user && isTasker && (
              <Button variant="hero" asChild>
                <Link to="/services/new"><Plus size={16} /> Skapa den första</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Services;
