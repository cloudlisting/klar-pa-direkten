import { CATEGORIES } from "@/lib/constants";
import { Link } from "react-router-dom";

const CategoryGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.id}
          to={`/browse?category=${cat.id}`}
          className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center shadow-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30"
        >
          <span className="text-3xl">{cat.icon}</span>
          <span className="text-sm font-medium text-foreground">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default CategoryGrid;
