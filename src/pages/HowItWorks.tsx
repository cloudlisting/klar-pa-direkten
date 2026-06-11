import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Sparkles,
  Wallet,
  Star,
  MessageSquare,
  CheckCircle2,
  ClipboardList,
  Users,
  BadgeCheck,
  Lock,
  Search,
  ThumbsUp,
  TrendingUp,
  UserPlus,
  Flag,
  PhoneCall,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Step {
  icon: JSX.Element;
  title: string;
  desc: string;
}

const customerSteps: Step[] = [
  {
    icon: <ClipboardList className="text-accent" size={26} />,
    title: "Beskriv vad du behöver hjälp med",
    desc: "Skriv en tydlig titel och beskrivning, välj kategori, lägg till plats och datum samt bilder om det behövs. Ju tydligare information, desto bättre svar får du.",
  },
  {
    icon: <Wallet className="text-accent" size={26} />,
    title: "Sätt din budget",
    desc: "Ange ett fast pris i SEK för uppdraget. Du bestämmer själv vad du är villig att betala – Moas hjälper dig med rekommendationer baserat på liknande uppdrag.",
  },
  {
    icon: <Users className="text-accent" size={26} />,
    title: "Få svar från taskers",
    desc: "Lokala taskers kan acceptera direktbokningar eller skicka dig egna bud. Du får ett meddelande så snart någon visar intresse.",
  },
  {
    icon: <Star className="text-accent" size={26} />,
    title: "Välj rätt person",
    desc: "Jämför profiler, läs omdömen, kontrollera betyg, slutförandegrad och verifieringar (BankID, ID, telefon, e-post) innan du väljer din tasker.",
  },
  {
    icon: <Lock className="text-accent" size={26} />,
    title: "Betala tryggt",
    desc: "Moas är byggt för säker betalning via plattformen. Pengarna hålls säkert och släpps till taskern först när uppdraget är slutfört och du är nöjd.",
  },
  {
    icon: <ThumbsUp className="text-accent" size={26} />,
    title: "Lämna omdöme",
    desc: "Efter avslutat uppdrag lämnar både du och taskern omdöme om varandra. Bra omdömen bygger förtroende i hela marknadsplatsen.",
  },
];

const taskerSteps: Step[] = [
  {
    icon: <UserPlus className="text-accent" size={26} />,
    title: "Skapa konto som tasker",
    desc: "Registrera dig gratis, fyll i din profil, lägg till bio, foto och vilka kategorier du erbjuder.",
  },
  {
    icon: <BadgeCheck className="text-accent" size={26} />,
    title: "Verifiera din profil",
    desc: "Bekräfta e-post och telefon. Verifiera ID och BankID för att få högre trovärdighet och fler uppdrag.",
  },
  {
    icon: <Search className="text-accent" size={26} />,
    title: "Hitta uppdrag nära dig",
    desc: "Bläddra det lokala flödet, filtrera efter kategori och stad, och se vilka uppdrag som passar din kompetens.",
  },
  {
    icon: <Sparkles className="text-accent" size={26} />,
    title: "Acceptera uppdrag som passar dig",
    desc: "Skicka ett bud med pris och meddelande, eller acceptera direktbokningar med fast pris.",
  },
  {
    icon: <CheckCircle2 className="text-accent" size={26} />,
    title: "Slutför uppdraget",
    desc: "Kommunicera med kunden via chatten, gör jobbet bra och markera uppdraget som klart när du är färdig.",
  },
  {
    icon: <TrendingUp className="text-accent" size={26} />,
    title: "Bygg ditt rykte",
    desc: "Bra omdömen och hög slutförandegrad ger dig fler uppdrag och möjlighet att höja dina priser med tiden.",
  },
];

interface TrustItem {
  icon: JSX.Element;
  title: string;
  desc: string;
}

const trustItems: TrustItem[] = [
  { icon: <BadgeCheck className="text-success" size={22} />, title: "BankID-verifierad", desc: "Verifierad identitet via svenskt BankID." },
  { icon: <Shield className="text-success" size={22} />, title: "ID-verifierad", desc: "Verifierad legitimation kontrollerad av admin." },
  { icon: <PhoneCall className="text-success" size={22} />, title: "Telefon & e-post", desc: "Kontaktuppgifter bekräftade." },
  { icon: <Star className="text-success" size={22} />, title: "Betyg & omdömen", desc: "Riktiga omdömen från tidigare uppdrag." },
  { icon: <CheckCircle2 className="text-success" size={22} />, title: "Slutförandegrad", desc: "Andel uppdrag som slutförts framgångsrikt." },
  { icon: <MessageSquare className="text-success" size={22} />, title: "Chatt i appen", desc: "All kommunikation samlad och spårbar." },
  { icon: <Shield className="text-success" size={22} />, title: "Admin-moderering", desc: "Vårt team granskar rapporter och agerar snabbt." },
  { icon: <Flag className="text-success" size={22} />, title: "Rapportera", desc: "Anmäl användare eller uppdrag direkt i appen." },
  { icon: <Lock className="text-success" size={22} />, title: "Säker betalning", desc: "Pengarna hålls tills uppdraget är slutfört." },
];

const faqs = [
  { q: "Vad är Moas?", a: "Moas är Sveriges marknadsplats för vardagsuppdrag. Du kan publicera uppdrag som städning, flytt, montering, trädgård, hantverk och mycket mer – och få hjälp av lokala taskers." },
  { q: "Är det gratis att publicera uppdrag?", a: "Ja, det är helt gratis att publicera ett uppdrag. En liten serviceavgift tillkommer endast när uppdraget är tilldelat och betalt." },
  { q: "Hur väljer jag rätt tasker?", a: "Jämför profiler, betyg, omdömen och verifieringar. Du kan också chatta med taskern innan du accepterar ett bud för att ställa frågor." },
  { q: "Hur fungerar betalning?", a: "Moas är byggt för säker betalning via plattformen. Pengarna reserveras vid bokning och släpps till taskern först när uppdraget är slutfört och godkänt." },
  { q: "Hur blir jag tasker?", a: "Skapa ett konto, gå till 'Bli tasker', fyll i din profil, välj kategorier och verifiera din identitet. När din profil är klar kan du börja ta emot uppdrag." },
  { q: "Vad händer om något går fel?", a: "Kontakta först din motpart via chatten. Om ni inte hittar en lösning kan du rapportera ärendet och vårt team hjälper dig att lösa tvisten." },
  { q: "Kan företag använda Moas?", a: "Moas är i första hand byggt för B2C – privatpersoner som vill ha hjälp med vardagliga fysiska uppdrag. Företag kan använda tjänsten i samma omfattning som privatpersoner." },
  { q: "Är Moas tillgängligt i hela Sverige?", a: "Ja, Moas fungerar i hela Sverige. Tillgången på taskers varierar dock per stad – större städer har generellt fler aktiva taskers." },
];

const StepCard = ({ step, index }: { step: Step; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05, duration: 0.4 }}
    className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-card"
  >
    <div className="shrink-0">
      <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
        {step.icon}
      </div>
    </div>
    <div>
      <h3 className="text-base font-semibold text-foreground mb-1">{step.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
    </div>
  </motion.div>
);

const HowItWorks = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container text-center max-w-3xl">
          <Badge variant="accent" className="mb-4">Så fungerar Moas</Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-primary-foreground mb-4 leading-tight">
            Få hjälp med vardagens uppdrag, tryggt och enkelt
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Publicera ett uppdrag, få svar från lokala taskers och betala säkert via plattformen.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="accent" size="xl" asChild>
              <Link to="/post-task">Publicera ett uppdrag <ArrowRight size={18} /></Link>
            </Button>
            <Button variant="hero-outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <Link to="/browse">Hitta uppdrag</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For customers */}
      <section className="py-16 md:py-20">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">För dig som vill få hjälp</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
              Sex enkla steg till klart uppdrag
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Från publicering till betalning – vi gör hela vägen smidig och trygg.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {customerSteps.map((s, i) => (
              <StepCard key={i} step={s} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* For taskers */}
      <section className="py-16 md:py-20 bg-secondary/40">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">För dig som vill tjäna pengar</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
              Bygg ditt eget uppdrag på dina villkor
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Bestäm själv när, var och vilka uppdrag du tar dig an.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {taskerSteps.map((s, i) => (
              <StepCard key={i} step={s} index={i} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/become-tasker">Bli tasker <ArrowRight size={16} /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust & safety */}
      <section className="py-16 md:py-20">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <Shield className="mx-auto mb-3 text-primary" size={36} />
            <Badge variant="secondary" className="mb-3">Trygghet och förtroende</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
              Byggt för trygghet i varje uppdrag
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Verifieringar, omdömen och säker betalning gör Moas till en plats där du kan lita på personen du möter.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trustItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-0.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-secondary/40">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Vanliga frågor</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
              Det du undrar över
            </h2>
            <p className="text-muted-foreground">Hittar du inte svaret? Kontakta vårt supportteam.</p>
          </div>
          <Accordion type="single" collapsible className="rounded-xl border border-border bg-card divide-y divide-border">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="px-5">
                <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-primary-foreground mb-4">
            Redo att få något gjort?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Kom igång på under en minut – det är gratis att publicera ett uppdrag.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="accent" size="xl" asChild>
              <Link to="/post-task">Publicera ett uppdrag <ArrowRight size={18} /></Link>
            </Button>
            <Button variant="hero-outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <Link to="/browse">Hitta uppdrag</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
