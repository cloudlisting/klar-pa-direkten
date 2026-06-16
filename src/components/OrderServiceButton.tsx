import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

interface Props {
  taskerUserId: string;
  taskerName?: string | null;
  category?: string;
  title?: string;
  price?: number;
  serviceListingId?: string;
  taskerServiceId?: string;
  className?: string;
  variant?: "hero" | "outline" | "default";
  size?: "sm" | "lg" | "default";
  label?: string;
}

const OrderServiceButton = ({
  taskerUserId,
  taskerName,
  category,
  title,
  price,
  serviceListingId,
  taskerServiceId,
  className,
  variant = "hero",
  size = "lg",
  label = "Beställ",
}: Props) => {
  const params = new URLSearchParams();
  params.set("tasker", taskerUserId);
  if (taskerName) params.set("tasker_name", taskerName);
  if (category) params.set("category", category);
  if (title) params.set("title", title);
  if (price != null) params.set("price", String(price));
  if (serviceListingId) params.set("service_id", serviceListingId);
  if (taskerServiceId) params.set("tasker_service_id", taskerServiceId);

  return (
    <Button variant={variant} size={size} asChild className={className}>
      <Link to={`/post-task?${params.toString()}`}>
        <ShoppingBag size={16} /> {label}
      </Link>
    </Button>
  );
};

export default OrderServiceButton;
