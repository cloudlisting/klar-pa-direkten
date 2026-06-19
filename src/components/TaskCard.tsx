import { Link } from "react-router-dom";
import { MapPin, Clock, MessageSquare, Zap, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TrustBadges, { TrustData } from "@/components/TrustBadges";
import { getCategoryFallbackImage } from "@/lib/categoryImages";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    date: string;
    budget: number;
    budgetType: "fixed";
    status: "open" | "instant" | "assigned" | "in_progress" | "completed" | "cancelled";
    isRemote: boolean;
    postedBy: string;
    postedAt: string;
    offersCount: number;
    posterTrust?: TrustData;
    photoUrl?: string | null;
  };
}

const TaskCard = ({ task }: TaskCardProps) => {
  const rating = task.posterTrust?.rating_avg;
  const ratingCount = task.posterTrust?.rating_count;

  return (
    <Link
      to={`/task/${task.id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden shadow-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={task.photoUrl || getCategoryFallbackImage(task.category, task.title)}
          alt={task.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Poster + rating, bottom-left mini badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <span className="truncate max-w-[100px]">{task.postedBy}</span>
          {ratingCount && ratingCount > 0 ? (
            <span className="flex items-center gap-0.5 text-amber-300">
              <Star size={10} className="fill-amber-300" />
              {(rating ?? 0).toFixed(1)}
              <span className="text-white/70">({ratingCount})</span>
            </span>
          ) : (
            <span className="text-white/70">· Ny</span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {task.category}
              </Badge>
              <Badge variant={task.status === "open" || task.status === "instant" ? "success" : "muted"} className="text-xs">
                {task.status === "open" || task.status === "instant" ? "Öppen" : task.status}
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {task.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {task.description}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-foreground">
              {task.budget.toLocaleString("sv-SE")} kr
            </p>
            <p className="text-xs text-muted-foreground">fast pris</p>
          </div>
        </div>

        {task.posterTrust && (
          <div className="mt-2 mb-3">
            <TrustBadges data={task.posterTrust} size="sm" />
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 pt-3 border-t border-border">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {task.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {task.postedAt}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {task.offersCount} bud
          </span>
          <span className="ml-auto text-muted-foreground">
            av {task.postedBy}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default TaskCard;
