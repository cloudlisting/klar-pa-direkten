import { Check, Circle, Clock, CreditCard, Flag, Truck, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusStep {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const STATUS_STEPS: StatusStep[] = [
  { key: "published", label: "Publicerad", icon: <Circle size={16} /> },
  { key: "in_bidding", label: "Tar emot bud", icon: <Clock size={16} /> },
  { key: "assigned", label: "Tilldelad", icon: <Check size={16} /> },
  { key: "in_progress", label: "Pågår", icon: <Truck size={16} /> },
  { key: "completed_pending_release", label: "Slutförd", icon: <Flag size={16} /> },
  { key: "paid", label: "Betald", icon: <CreditCard size={16} /> },
];

const STATUS_ORDER = ["draft", "published", "in_bidding", "assigned", "in_progress", "completed_pending_release", "paid"];

interface StatusTimelineProps {
  currentStatus: string;
  className?: string;
}

const StatusTimeline = ({ currentStatus, className }: StatusTimelineProps) => {
  // Handle special statuses
  if (currentStatus === "cancelled") {
    return (
      <div className={cn("rounded-lg bg-destructive/10 border border-destructive/20 p-4", className)}>
        <div className="flex items-center gap-2 text-destructive">
          <XCircle size={18} />
          <span className="font-medium">Uppdraget har avbrutits</span>
        </div>
      </div>
    );
  }

  if (currentStatus === "disputed") {
    return (
      <div className={cn("rounded-lg bg-warning/10 border border-warning/20 p-4", className)}>
        <div className="flex items-center gap-2 text-warning">
          <AlertTriangle size={18} />
          <span className="font-medium">Uppdraget är under tvist</span>
        </div>
      </div>
    );
  }

  if (currentStatus === "draft") {
    return (
      <div className={cn("rounded-lg bg-secondary border border-border p-4", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Circle size={18} />
          <span className="font-medium">Utkast - ej publicerad ännu</span>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <h3 className="font-semibold text-foreground mb-4">Status</h3>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
        <div
          className="absolute left-[11px] top-3 w-0.5 bg-primary transition-all duration-500"
          style={{
            height: `${Math.max(0, (currentIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
          }}
        />

        {/* Steps */}
        <div className="space-y-4 relative">
          {STATUS_STEPS.map((step, index) => {
            const stepIndex = STATUS_ORDER.indexOf(step.key);
            const isCompleted = stepIndex <= currentIndex;
            const isCurrent = step.key === currentStatus;

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center transition-all z-10",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                  )}
                >
                  {isCompleted ? <Check size={12} /> : step.icon}
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    isCompleted ? "text-foreground font-medium" : "text-muted-foreground",
                    isCurrent && "text-primary font-semibold"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
