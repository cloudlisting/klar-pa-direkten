import { Link } from "react-router-dom";
import { MapPin, Clock, MessageSquare, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/mock-data";

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <Link
      to={`/task/${task.id}`}
      className="group block rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {task.category}
            </Badge>
            {task.isRemote && (
              <Badge variant="muted" className="text-xs gap-1">
                <Wifi size={10} />
                Distans
              </Badge>
            )}
            <Badge variant={task.status === "open" ? "success" : "muted"} className="text-xs">
              {task.status === "open" ? "Öppen" : task.status}
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
          <p className="text-xs text-muted-foreground">
            {task.budgetType === "fixed" ? "fast pris" : "per timme"}
          </p>
        </div>
      </div>

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
    </Link>
  );
};

export default TaskCard;
