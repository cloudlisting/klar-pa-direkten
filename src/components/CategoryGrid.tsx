import { CATEGORIES } from "@/lib/constants";
import { Link } from "react-router-dom";

const CategoryGrid = () => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
  );
};

export default CategoryGrid;
