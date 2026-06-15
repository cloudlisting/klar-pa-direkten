import { CATEGORIES } from "@/lib/constants";
import { Link } from "react-router-dom";
import { Trash2, ShoppingBag, Truck, Drill, Sparkles, Leaf } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, string> = {
  waste: "🗑️",
  errands: "🛍️",
  moving: "🚚",
  assembly: "🔩",
  handyman: "🔧",
  cleaning: "🧹",
  gardening: "🌿",
  tech: "💻",
  pets: "🐶",
  other: "✨",
};

// Mobile compact category cards — exactly 6, colored lucide icons
const MOBILE_CATEGORIES: {
  id: string;
  name: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
}[] = [
  { id: "waste", name: "Avfall & återvinning", Icon: Trash2, color: "text-primary", bg: "bg-primary/10" },
  { id: "errands", name: "Inköp & ärenden", Icon: ShoppingBag, color: "text-accent", bg: "bg-accent/10" },
  { id: "moving", name: "Hämta & lämna", Icon: Truck, color: "text-primary", bg: "bg-primary/10" },
  { id: "assembly", name: "Montering & hemfix", Icon: Drill, color: "text-accent", bg: "bg-accent/10" },
  { id: "cleaning", name: "Städning", Icon: Sparkles, color: "text-muted-foreground", bg: "bg-secondary" },
  { id: "gardening", name: "Trädgård", Icon: Leaf, color: "text-primary", bg: "bg-primary/10" },
];

const CategoryGrid = () => {
  return (
    <>
      {/* Desktop: grid layout */}
      <div className="hidden md:grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            to={`/browse?category=${cat.id}`}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40"
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-sm font-semibold text-foreground leading-tight">{cat.name}</span>
            {(cat as any).desc && (
              <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                ex: {(cat as any).desc.toLowerCase()}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Mobile: horizontal scroll, 6 compact cards */}
      <div className="md:hidden -mx-5 px-5">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
          {MOBILE_CATEGORIES.map(({ id, name, Icon, color, bg }) => (
            <Link
              key={id}
              to={`/browse?category=${id}`}
              className="flex flex-col items-center justify-center gap-2 min-w-[82px] h-[78px] snap-start rounded-2xl border border-border bg-card px-2.5 py-3 shadow-sm active:scale-[0.97] transition-transform"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                <Icon size={21} className={color} strokeWidth={1.9} />
              </div>
              <span className="text-[9.5px] font-semibold text-foreground text-center leading-tight">
                {name}
              </span>

            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default CategoryGrid;
