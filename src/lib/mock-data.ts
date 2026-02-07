export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  budget: number;
  budgetType: "fixed" | "hourly";
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  isRemote: boolean;
  postedBy: string;
  postedAt: string;
  offersCount: number;
  images?: string[];
}

export interface Offer {
  id: string;
  taskId: string;
  taskerId: string;
  taskerName: string;
  taskerAvatar?: string;
  taskerRating: number;
  taskerReviews: number;
  price: number;
  message: string;
  estimatedDuration: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  taskCount: number;
}

export const MOCK_CATEGORIES: Category[] = [
  { id: "cleaning", name: "Städning", icon: "🧹", taskCount: 142 },
  { id: "moving", name: "Flytt & transport", icon: "📦", taskCount: 89 },
  { id: "handyman", name: "Hantverkare", icon: "🔧", taskCount: 203 },
  { id: "gardening", name: "Trädgård", icon: "🌿", taskCount: 67 },
  { id: "it", name: "IT & teknik", icon: "💻", taskCount: 156 },
  { id: "tutoring", name: "Undervisning", icon: "📚", taskCount: 94 },
  { id: "pet", name: "Djurpassning", icon: "🐕", taskCount: 48 },
  { id: "events", name: "Event & fest", icon: "🎉", taskCount: 35 },
];

export const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Flytta möbler till ny lägenhet i Södermalm",
    description: "Behöver hjälp att flytta en soffa, säng och skrivbord från Kungsholmen till Södermalm. Tredje våningen utan hiss.",
    category: "Flytt & transport",
    location: "Stockholm",
    date: "2026-02-15",
    budget: 1500,
    budgetType: "fixed",
    status: "open",
    isRemote: false,
    postedBy: "Anna S.",
    postedAt: "2 timmar sedan",
    offersCount: 3,
  },
  {
    id: "2",
    title: "Hemstädning 3:a i Göteborg",
    description: "Grundlig städning av trerumslägenhet, ca 75 kvm. Inklusive fönsterputs och ugnsrengöring.",
    category: "Städning",
    location: "Göteborg",
    date: "2026-02-12",
    budget: 350,
    budgetType: "hourly",
    status: "open",
    isRemote: false,
    postedBy: "Erik L.",
    postedAt: "5 timmar sedan",
    offersCount: 7,
  },
  {
    id: "3",
    title: "Hjälp med WordPress-sajt",
    description: "Behöver en utvecklare som kan uppdatera min WordPress-sajt med ny design och fixa hastigheten.",
    category: "IT & teknik",
    location: "Malmö",
    date: "2026-02-20",
    budget: 3000,
    budgetType: "fixed",
    status: "open",
    isRemote: true,
    postedBy: "Sara K.",
    postedAt: "1 dag sedan",
    offersCount: 5,
  },
  {
    id: "4",
    title: "Montera IKEA-kök",
    description: "Nytt IKEA-kök som behöver monteras. Alla delar finns på plats. Kök är ca 8 kvm.",
    category: "Hantverkare",
    location: "Uppsala",
    date: "2026-02-18",
    budget: 5000,
    budgetType: "fixed",
    status: "open",
    isRemote: false,
    postedBy: "Johan M.",
    postedAt: "3 timmar sedan",
    offersCount: 2,
  },
  {
    id: "5",
    title: "Trädgårdsarbete - beskärning och gräsklippning",
    description: "Behöver hjälp med att klippa gräset och beskära häcken runt huset. Ca 200 kvm tomt.",
    category: "Trädgård",
    location: "Lund",
    date: "2026-02-22",
    budget: 250,
    budgetType: "hourly",
    status: "open",
    isRemote: false,
    postedBy: "Maria P.",
    postedAt: "6 timmar sedan",
    offersCount: 1,
  },
  {
    id: "6",
    title: "Matteläxhjälp gymnasienivå",
    description: "Söker en mattelärare/student som kan hjälpa min son med matte 3c. Behöver ca 2 timmar i veckan.",
    category: "Undervisning",
    location: "Stockholm",
    date: "2026-02-14",
    budget: 300,
    budgetType: "hourly",
    status: "open",
    isRemote: true,
    postedBy: "David A.",
    postedAt: "1 dag sedan",
    offersCount: 4,
  },
];

export const SWEDISH_CITIES = [
  "Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping",
  "Västerås", "Örebro", "Norrköping", "Helsingborg", "Jönköping",
  "Umeå", "Lund", "Borås", "Sundsvall", "Gävle",
];
