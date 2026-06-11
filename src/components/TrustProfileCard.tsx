import { Link } from "react-router-dom";
import TrustBadges, { TrustData } from "./TrustBadges";
import { ShieldCheck } from "lucide-react";

interface Props {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  trust: TrustData;
  subtitle?: string;
  compact?: boolean;
}

const TrustProfileCard = ({ userId, name, avatarUrl, trust, subtitle, compact }: Props) => {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const verifiedCount =
    Number(!!trust.bankid_verified) +
    Number(!!trust.id_verified) +
    Number(!!trust.phone_verified);

  return (
    <div className="flex items-start gap-3">
      <Link to={`/profile/${userId}`} className="shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            {initial}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            to={`/profile/${userId}`}
            className="font-semibold text-foreground hover:underline truncate"
          >
            {name}
          </Link>
          {verifiedCount >= 2 && (
            <ShieldCheck size={14} className="text-success shrink-0" aria-label="Verifierad" />
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
        <div className="mt-1.5">
          <TrustBadges data={trust} size={compact ? "sm" : "md"} />
        </div>
      </div>
    </div>
  );
};

export default TrustProfileCard;
