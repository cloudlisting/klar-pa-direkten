import { CATEGORIES } from "@/lib/constants";
import { Link } from "react-router-dom";

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

// Simplified category names for the mobile horizontal strip
const MOBILE_CATEGORIES = [
  { id: "waste", name: "Avfall & återvinning" },
  { id: "errands", name: "Inköp & ärenden" },
  { id: "moving", name: "Hämta & lämna" },
  { id: "assembly", name: "Montering & hemfix" },
  { id: "cleaning", name: "Städning" },
  { id: "gardening", name: "Trädgård" },
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
            <span className="text-sm font-semibold text-foreground leading-tight">
              {cat.name}
            </span>
            {(cat as any).desc && (
              <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                ex: {(cat as any).desc.toLowerCase()}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden -mx-5 px-5">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
          {MOBILE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/browse?category=${cat.id}`}
              className="flex flex-col items-center gap-2 min-w-[88px] snap-start"
            >
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-border bg-card text-3xl shadow-sm">
                {CATEGORY_ICONS[cat.id]}
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight max-w-[88px]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default CategoryGrid;
