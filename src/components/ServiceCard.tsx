import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export type ServiceCardData = {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  city?: string | null;
  price_sek: number;
  price_type: "fixed" | "from";
  cover_image_url?: string | null;
  tasker_user_id: string;
  tasker_name?: string | null;
  tasker_avatar?: string | null;
  tasker_rating?: number | null;
  tasker_rating_count?: number | null;
};

interface Props {
  service: ServiceCardData;
  href?: string;
  compact?: boolean;
}

const ServiceCard = ({ service, href, compact }: Props) => {
  const category = CATEGORIES.find(
    (c) => c.name === service.category || c.id === service.category
  );
  const to = href ?? `/services/${service.id}`;

  return (
    <Link
      to={to}
      className={`group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5 ${
        compact ? "" : ""
      }`}
    >
      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
        {service.cover_image_url ? (
          <img
            src={service.cover_image_url}
            alt={service.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-5xl bg-gradient-to-br from-primary/10 to-accent/10">
            {category?.icon ?? "✨"}
          </div>
        )}
        <Badge variant="accent" className="absolute top-2 left-2 gap-1">
          Erbjuder
        </Badge>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug">
            {service.title}
          </h3>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {service.city && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {service.city}
            </span>
          )}
          {service.tasker_rating != null && service.tasker_rating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={11} className="fill-current text-accent" />
              {service.tasker_rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">
            {service.tasker_name ?? "Tasker"}
          </span>
          <span className="text-sm font-bold text-foreground">
            {service.price_type === "from" ? "Från " : ""}
            {service.price_sek} kr
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;
