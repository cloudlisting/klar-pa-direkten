import { Star, CheckCircle2, Package, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrustData {
  rating_avg?: number | null;
  rating_count?: number | null;
  completed_tasks?: number | null;
  completion_rate?: number | null;
  response_time_minutes?: number | null;
  bankid_verified?: boolean | null;
  id_verified?: boolean | null;
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
  google_connected?: boolean | null;
}

interface Props {
  data: TrustData;
  size?: "sm" | "md" | "lg";
  showAll?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "text-[11px] px-1.5 py-0.5 gap-1 rounded-md",
  md: "text-xs px-2 py-1 gap-1 rounded-md",
  lg: "text-sm px-2.5 py-1.5 gap-1.5 rounded-lg",
};

const Pill = ({
  children,
  tone = "neutral",
  size = "md",
}: {
  children: React.ReactNode;
  tone?: "success" | "info" | "warning" | "neutral" | "primary";
  size?: "sm" | "md" | "lg";
}) => {
  const tones = {
    success: "bg-success/10 text-success border-success/20",
    info: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    primary: "bg-accent/10 text-accent border-accent/20",
    neutral: "bg-secondary text-secondary-foreground border-border",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border whitespace-nowrap",
        sizeMap[size],
        tones[tone]
      )}
    >
      {children}
    </span>
  );
};

const TrustBadges = ({ data, size = "md", showAll = false, className }: Props) => {
  const rating = Number(data.rating_avg ?? 0);
  const reviews = data.rating_count ?? 0;
  const completed = data.completed_tasks ?? 0;
  const rate = data.completion_rate ?? null;
  const rt = data.response_time_minutes ?? null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {(reviews > 0 || showAll) && (
        <Pill tone="warning" size={size}>
          <Star size={12} className="fill-current" />
          {rating > 0 ? rating.toFixed(1) : "Ny"}
          {reviews > 0 && <span className="opacity-70">({reviews})</span>}
        </Pill>
      )}
      {(completed > 0 || showAll) && (
        <Pill tone="info" size={size}>
          <Package size={12} /> {completed} uppdrag
        </Pill>
      )}
      {rate !== null && completed > 0 && (
        <Pill tone="success" size={size}>
          <CheckCircle2 size={12} /> {Math.round(Number(rate))}%
        </Pill>
      )}
      {rt && (
        <Pill tone="primary" size={size}>
          <Zap size={12} /> Svarar inom {rt} min
        </Pill>
      )}
      {data.google_connected && (
        <Pill tone="info" size={size}>✅ Google-konto anslutet</Pill>
      )}
      {data.bankid_verified && (
        <Pill tone="success" size={size}>🟢 BankID</Pill>
      )}
      {data.id_verified && (
        <Pill tone="success" size={size}>🪪 ID</Pill>
      )}
      {data.phone_verified && (
        <Pill tone="success" size={size}>📞 Telefon</Pill>
      )}
      {data.email_verified && (
        <Pill tone="success" size={size}>✉️ E-post</Pill>
      )}
    </div>
  );
};

export default TrustBadges;
