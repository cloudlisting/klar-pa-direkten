import { CreditCard } from "lucide-react";
import { getPaymentMethods, type PaymentMethodId } from "@/lib/payments";

// Premium men enkel betalmetod-badge. Kort använder en ikon, Swish och Klarna
// använder ordmärken i sina respektive färger.
//
// TODO (innan production): byt ut text-fallbacken för Klarna mot den officiella
// Klarna-loggan (SVG) enligt Klarnas varumärkesriktlinjer. Samma för Swish.

const KlarnaBadge = () => (
  // Klarna-rosa (#FFB3C7) är varumärkesfärgen. Fallback tills officiell logo finns.
  <span className="inline-flex items-center rounded-md bg-[#FFB3C7] px-2 py-0.5 text-[11px] font-bold tracking-tight text-black">
    Klarna
  </span>
);

const SwishBadge = () => (
  <span className="inline-flex items-center rounded-md bg-[#6c1d63] px-2 py-0.5 text-[11px] font-bold tracking-tight text-white">
    Swish
  </span>
);

const CardBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground">
    <CreditCard size={12} />
    {label}
  </span>
);

const renderBadge = (id: PaymentMethodId, label: string) => {
  switch (id) {
    case "klarna":
      return <KlarnaBadge />;
    case "swish":
      return <SwishBadge />;
    default:
      return <CardBadge label={label} />;
  }
};

interface PaymentMethodsProps {
  // Om satt filtreras Klarna bort under beloppsgränsen.
  amountSek?: number;
  // Visa även metoder som inte är aktiva ännu (med "kommer snart"-stil).
  showUpcoming?: boolean;
  className?: string;
}

const PaymentMethods = ({ amountSek, showUpcoming = true, className }: PaymentMethodsProps) => {
  const methods = getPaymentMethods(amountSek).filter((m) => m.available || showUpcoming);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {methods.map((m) => (
        <div key={m.id} className={m.available ? "" : "opacity-50"} title={m.available ? undefined : "Kommer snart"}>
          {renderBadge(m.id, m.label)}
        </div>
      ))}
    </div>
  );
};

export default PaymentMethods;
