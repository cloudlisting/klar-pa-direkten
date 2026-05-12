import type { LucideProps } from "lucide-react";
import {
  PackageOpen,
  Sparkles,
  Wrench,
  Truck,
  TreePine,
  Paintbrush,
  Hammer,
  Briefcase,
  Monitor,
  CircleHelp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ServiceItem {
  titleSv: string;
  titleEn: string;
  descSv: string;
  descEn: string;
  icon: React.ComponentType<LucideProps>;
  gradient: string;
}

const SERVICES: ServiceItem[] = [
  {
    titleSv: "Flytt & packning",
    titleEn: "Removalists",
    descSv: "Packa, slå in, flytta och mer!",
    descEn: "Packing, wrapping, moving and more!",
    icon: PackageOpen,
    gradient: "from-orange-500 to-amber-500",
  },
  {
    titleSv: "Hemstädning",
    titleEn: "Home cleaning",
    descSv: "Städa, moppa och pryda ditt hem",
    descEn: "Clean, mop and tidy your house",
    icon: Sparkles,
    gradient: "from-teal-500 to-emerald-400",
  },
  {
    titleSv: "Möbelmontering",
    titleEn: "Furniture assembly",
    descSv: "Ihopmontering och demontering",
    descEn: "Flatpack assembly and disassembly",
    icon: Wrench,
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    titleSv: "Leveranser",
    titleEn: "Deliveries",
    descSv: "Brådskande leveranser och bud",
    descEn: "Urgent deliveries and courier services",
    icon: Truck,
    gradient: "from-indigo-500 to-violet-400",
  },
  {
    titleSv: "Trädgård",
    titleEn: "Gardening",
    descSv: "Mulching, ogräsrensning och städning",
    descEn: "Mulching, weeding and tidying up",
    icon: TreePine,
    gradient: "from-green-600 to-lime-500",
  },
  {
    titleSv: "Målning",
    titleEn: "Painting",
    descSv: "Invändig och utvändig väggmålning",
    descEn: "Interior and exterior wall painting",
    icon: Paintbrush,
    gradient: "from-rose-500 to-pink-400",
  },
  {
    titleSv: "Hantverkare",
    titleEn: "Handyperson",
    descSv: "Hjälp med underhåll av hemmet",
    descEn: "Help with home maintenance",
    icon: Hammer,
    gradient: "from-amber-600 to-yellow-500",
  },
  {
    titleSv: "Företag & admin",
    titleEn: "Business & admin",
    descSv: "Hjälp med bokföring och deklaration",
    descEn: "Help with accounting and tax returns",
    icon: Briefcase,
    gradient: "from-slate-600 to-gray-400",
  },
  {
    titleSv: "Marknadsföring",
    titleEn: "Marketing & design",
    descSv: "Hjälp med hemsida och design",
    descEn: "Help with website",
    icon: Monitor,
    gradient: "from-violet-500 to-purple-400",
  },
  {
    titleSv: "Övrigt",
    titleEn: "Something else",
    descSv: "Upphängning av tavlor och mer",
    descEn: "Wall mount art and paintings",
    icon: CircleHelp,
    gradient: "from-cyan-600 to-sky-400",
  },
];

const ServiceCard = ({ service }: { service: ServiceItem }) => {
  const { lang } = useI18n();
  const Icon = service.icon;
  const title = lang === "en" ? service.titleEn : service.titleSv;
  const desc = lang === "en" ? service.descEn : service.descSv;

  return (
    <div className="inline-flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg mx-2 shrink-0 w-[260px] select-none">
      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br ${service.gradient}`}
      >
        <Icon className="text-white" size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
    </div>
  );
};

const ServiceMarquee = () => {
  return (
    <div className="relative mt-8 lg:mt-10">
      <p className="text-primary-foreground/70 text-xs font-medium mb-3 text-center lg:text-left tracking-wide uppercase">
        Populära tjänster
      </p>
      <div className="relative overflow-hidden py-1">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          <div className="flex items-center">
            {SERVICES.map((s, i) => (
              <ServiceCard key={`a-${i}`} service={s} />
            ))}
          </div>
          <div className="flex items-center">
            {SERVICES.map((s, i) => (
              <ServiceCard key={`b-${i}`} service={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceMarquee;
