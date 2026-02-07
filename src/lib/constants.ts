// Platform fee configuration
export const CUSTOMER_FEE_PERCENT = 0.05; // 5% customer service fee
export const TASKER_FEE_PERCENT = 0.10; // 10% tasker commission

// Categories (no mock tasks - using Supabase)
export const CATEGORIES = [
  { id: "cleaning", name: "Städning", icon: "🧹" },
  { id: "moving", name: "Flytt & transport", icon: "📦" },
  { id: "handyman", name: "Hantverkare", icon: "🔧" },
  { id: "gardening", name: "Trädgård", icon: "🌿" },
  { id: "assembly", name: "Montering", icon: "🪛" },
  { id: "delivery", name: "Leverans", icon: "🚚" },
  { id: "painting", name: "Målning", icon: "🎨" },
  { id: "other", name: "Övrigt", icon: "✨" },
] as const;

// Swedish cities for MVP
export const SWEDISH_CITIES = [
  "Stockholm",
  "Göteborg", 
  "Malmö",
  "Uppsala",
  "Linköping",
  "Västerås",
  "Örebro",
  "Norrköping",
  "Helsingborg",
  "Jönköping",
  "Umeå",
  "Lund",
] as const;

// Task status labels in Swedish
export const TASK_STATUS_LABELS: Record<string, string> = {
  draft: "Utkast",
  published: "Publicerad",
  instant_open: "Direktbokning öppen",
  in_bidding: "Tar emot bud",
  assigned: "Tilldelad",
  in_progress: "Pågår",
  completed_pending_release: "Väntar på betalning",
  paid: "Betald",
  cancelled: "Avbruten",
  disputed: "Tvist",
};

// Calculate fees
export function calculateFees(taskPrice: number) {
  const customerFee = Math.round(taskPrice * CUSTOMER_FEE_PERCENT);
  const taskerFee = Math.round(taskPrice * TASKER_FEE_PERCENT);
  const totalCustomerCharge = taskPrice + customerFee;
  const totalTaskerPayout = taskPrice - taskerFee;
  
  return {
    taskPrice,
    customerFee,
    taskerFee,
    totalCustomerCharge,
    totalTaskerPayout,
  };
}
