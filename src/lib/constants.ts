// Platform fee configuration
export const CUSTOMER_FEE_PERCENT = 0.05; // 5% customer service fee
export const TASKER_FEE_PERCENT = 0.10; // 10% tasker commission

// Categories (no mock tasks - using Supabase)
export const CATEGORIES = [
  { id: "waste", name: "Avfall & återvinning", icon: "🗑️", desc: "Sopor, återvinning, hämtning av skräp, grovsopor" },
  { id: "errands", name: "Inköp & ärenden", icon: "🛍️", desc: "Handla mat, uträtta ärenden, paketreturer & paketinlämning" },
  { id: "moving", name: "Flytt & transport", icon: "📦", desc: "Flytthjälp, bärhjälp, transport, hämtning, hemleverans" },
  { id: "assembly", name: "Möbelmontering", icon: "🪛", desc: "Montera möbler, IKEA-montering" },
  { id: "handyman", name: "Småfix i hemmet", icon: "🔧", desc: "Fixa lampor, småel, sätta upp tavlor/hyllor/gardiner, mindre reparationer, handyman" },
  { id: "cleaning", name: "Städning", icon: "🧹", desc: "Hemstädning, flyttstädning, fönsterputs" },
  { id: "gardening", name: "Trädgård & utemiljö", icon: "🌿", desc: "Gräsklippning, ogräs, snöskottning" },
  { id: "tech", name: "IT- & teknikhjälp", icon: "💻", desc: "Installera teknik, hjälp med dator/telefon" },
  { id: "pets", name: "Djur", icon: "🐶", desc: "Hundpromenad, djurpassning" },
  { id: "other", name: "Övrigt", icon: "✨", desc: "Annat" },
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
