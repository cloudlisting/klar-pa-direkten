import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Star, CheckCircle, CreditCard, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: <Zap className="text-accent" size={28} />,
    title: "Publicera ditt uppdrag",
    desc: "Beskriv vad du behöver hjälp med. Lägg till bilder, budget och önskad tid. Det tar bara ett par minuter.",
    detail: "Gratis att publicera",
  },
  {
    icon: <Star className="text-accent" size={28} />,
    title: "Få bud från taskers",
    desc: "Lokala taskers skickar sina bud med pris, beskrivning och tillgänglighet. Jämför betyg och omdömen.",
    detail: "Vanligtvis inom minuter",
  },
  {
    icon: <MessageSquare className="text-accent" size={28} />,
    title: "Chatta och välj",
    desc: "Prata direkt med taskers via chatten. Ställ frågor och kom överens om detaljer innan du accepterar ett bud.",
    detail: "Säker kommunikation",
  },
  {
    icon: <CreditCard className="text-accent" size={28} />,
    title: "Betala säkert",
    desc: "Pengarna hålls tryggt på plattformen tills uppdraget är klart och du är nöjd. Sedan släpps betalningen.",
    detail: "Escrow-betalning",
  },
  {
    icon: <CheckCircle className="text-accent" size={28} />,
    title: "Lämna omdöme",
    desc: "Betygsätt din tasker och hjälp andra att hitta bra hjälp. Taskers bygger sitt rykte genom goda omdömen.",
    detail: "Bygg förtroende",
  },
];

const HowItWorks = () => {
  return (
    <Layout>
      <section className="bg-primary py-16 md:py-20">
        <div className="container text-center">
          <h1 className="text-4xl font-bold font-display text-primary-foreground mb-4">
            Så fungerar Taskly
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-lg mx-auto">
            Från publicering till betalning – vi gör det enkelt och tryggt att hitta rätt hjälp.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container max-w-3xl">
          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex gap-5 rounded-xl border border-border bg-card p-6 shadow-card"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{step.desc}</p>
                  <span className="text-xs font-medium text-primary">{step.detail}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">
              Redo att börja?
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/post-task">Publicera ett uppdrag <ArrowRight size={18} /></Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/browse">Hitta uppdrag</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-16 bg-secondary/50">
        <div className="container text-center">
          <Shield className="mx-auto mb-4 text-primary" size={36} />
          <h2 className="text-2xl font-bold font-display text-foreground mb-3">Taskly-garantin</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Din betalning är säker. Om du inte är nöjd med resultatet har du möjlighet att bestrida uppdraget inom 48 timmar.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
