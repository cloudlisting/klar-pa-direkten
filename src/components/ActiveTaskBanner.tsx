import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, Flag } from "lucide-react";

interface ActiveTaskBannerProps {
  taskId: string;
  title: string;
  status: string;
  priceSek?: number | null;
  budgetType?: string | null;
  onRaiseDispute: () => void;
  canRaiseDispute: boolean;
}

const ActiveTaskBanner = ({
  taskId,
  title,
  status,
  priceSek,
  budgetType,
  onRaiseDispute,
  canRaiseDispute,
}: ActiveTaskBannerProps) => {
  let icon = Clock;
  let label = "Aktivt uppdrag pågår";
  let tone = "bg-accent/10 border-accent/30 text-foreground";

  if (status === "disputed") {
    icon = AlertTriangle;
    label = "Tvist pågår – kundtjänst är kontaktad";
    tone = "bg-destructive/10 border-destructive/30 text-foreground";
  } else if (status === "paid" || status === "completed_pending_release") {
    icon = CheckCircle2;
    label = "Uppdraget är klart";
    tone = "bg-success/10 border-success/30 text-foreground";
  } else if (status === "cancelled") {
    icon = AlertTriangle;
    label = "Uppdraget är avbrutet";
    tone = "bg-muted border-border text-muted-foreground";
  }

  const Icon = icon;
  const priceLabel = priceSek
    ? `${priceSek.toLocaleString("sv-SE")} kr`
    : budgetType === "open_for_bids"
      ? "Öppet för bud"
      : null;

  return (
    <div className={`mx-3 mt-2 rounded-xl border px-3 py-2.5 ${tone}`}>
      <div className="flex items-start gap-2.5">
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <Link to={`/task/${taskId}`} className="block font-medium truncate hover:underline">
            {title}
          </Link>
          {priceLabel && (
            <p className="text-xs opacity-80 mt-0.5">{priceLabel}</p>
          )}
        </div>
        {canRaiseDispute && status !== "disputed" && status !== "paid" && status !== "cancelled" && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={onRaiseDispute}
          >
            <Flag size={13} /> Markera tvist
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActiveTaskBanner;
