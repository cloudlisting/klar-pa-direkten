import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CategoryGrid from "@/components/CategoryGrid";
import LiveTaskFeed from "@/components/LiveTaskFeed";
import HeroTaskFeed from "@/components/HeroTaskFeed";
import ServiceMarquee from "@/components/ServiceMarquee";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Zap, Star, CheckCircle, Search, MapPin, Plus } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";
import { useT } from "@/lib/i18n";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileQuery, setMobileQuery] = useState("");

  const submitMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = mobileQuery.trim();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
  };

  return (
    <Layout>
      {/* ============ MOBILE APP HOME ============ */}
      <section className="md:hidden">
        <div className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground px-5 pt-6 pb-8 rounded-b-3xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm text-primary-foreground/80">Hej 👋</p>
              <h1 className="text-2xl font-bold font-display leading-tight">
                Få saker gjorda nära dig
              </h1>
            </div>
            <Link
              to={user ? "/dashboard" : "/auth"}
              className="h-10 w-10 rounded-full bg-primary-foreground/15 flex items-center justify-center font-semibold"
              aria-label="Konto"
            >
              {(user?.email?.[0] ?? "M").toUpperCase()}
            </Link>
          </div>

          <form onSubmit={submitMobileSearch} className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              placeholder="Vad behöver du hjälp med?"
              className="h-12 pl-11 pr-4 rounded-full bg-card text-foreground border-0 shadow-md"
            />
          </form>

          <button
            onClick={() => navigate("/browse")}
            className="mt-3 flex items-center gap-2 text-sm text-primary-foreground/90 underline-offset-2 hover:underline"
          >
            <MapPin size={14} /> Använd min plats
          </button>
        </div>

        <div className="px-5 py-6 space-y-8">
          <div>
            <h2 className="text-lg font-semibold font-display mb-3">Populära tjänster</h2>
            <CategoryGrid />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold font-display">Uppdrag nära dig</h2>
              <Link to="/browse" className="text-sm text-primary font-medium">Visa alla</Link>
            </div>
            <LiveTaskFeed />
          </div>

          <div className="rounded-2xl bg-secondary p-5 flex items-start gap-3">
            <Shield className="text-primary shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-semibold text-foreground text-sm">Tryggt & säkert</p>
              <p className="text-xs text-muted-foreground mt-1">
                Betalningen hålls säker tills uppdraget är klart. Verifierade profiler och omdömen.
              </p>
            </div>
          </div>

          <Button variant="hero" size="lg" className="w-full" asChild>
            <Link to="/post-task"><Plus size={18} /> Skapa uppdrag</Link>
          </Button>
        </div>
      </section>

      {/* ============ DESKTOP HOME ============ */}
      <div className="hidden md:block">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/70" />
        </div>
        <div className="container relative py-16 md:py-20 lg:py-24">
          {/* Two-column layout: text left, feed right */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left: Hero text */}
            <div className="max-w-xl pt-4">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <Badge variant="accent" className="mb-4 text-sm px-3 py-1">
                  {t("hero.badge")}
                </Badge>
              </motion.div>
              <motion.h1
                className="text-4xl font-bold text-primary-foreground md:text-5xl lg:text-6xl font-display leading-tight mb-5"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={1}
              >
                {t("hero.title1")}{" "}
                <span className="text-accent">{t("hero.title2")}</span>
              </motion.h1>
              <motion.p
                className="text-lg text-primary-foreground/80 mb-8 max-w-lg"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={2}
              >
                {t("hero.subtitle")}
              </motion.p>
              <motion.div
                className="flex flex-wrap gap-3"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={3}
              >
                <Button variant="accent" size="xl" asChild>
                  <Link to="/post-task">
                    {t("hero.cta.post")}
                    <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button
                  variant="hero-outline"
                  size="xl"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  asChild
                >
                  <Link to="/browse">{t("hero.cta.browse")}</Link>
                </Button>
              </motion.div>
            </div>

            {/* Right: Vertical live feed (desktop only) */}
            <div className="hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              >
                <HeroTaskFeed />
              </motion.div>
            </div>
          </div>

          {/* Bottom: Horizontal service marquee */}
          <ServiceMarquee />
        </div>
      </section>

      {/* Mobile: standalone live feed */}
      <div className="lg:hidden">
        <LiveTaskFeed />
      </div>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display text-foreground mb-3">
              {t("sections.howTitle")}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("sections.howSub")}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: <Zap className="text-accent" size={28} />, title: t("step1.title"), desc: t("step1.desc") },
              { icon: <Star className="text-accent" size={28} />, title: t("step2.title"), desc: t("step2.desc") },
              { icon: <CheckCircle className="text-accent" size={28} />, title: t("step3.title"), desc: t("step3.desc") },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="rounded-xl border border-border bg-card p-6 text-center shadow-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                  {step.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" asChild>
              <Link to="/how-it-works" className="gap-2">
                {t("nav.howItWorks")} <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                {t("sections.categories")}
              </h2>
              <p className="text-muted-foreground">{t("sections.categoriesSub")}</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/browse">
                {t("sections.viewAll")} <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 bg-primary">
        <div className="container text-center">
          <Shield className="mx-auto mb-4 text-primary-foreground/80" size={36} />
          <h2 className="text-3xl font-bold font-display text-primary-foreground mb-3">
            {t("sections.trustTitle")}
          </h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">
            {t("sections.trustText")}
          </p>
          <Button variant="accent" size="lg" asChild>
            <Link to="/post-task">{t("sections.trustCta")}</Link>
          </Button>
        </div>
      </section>
      </div>
    </Layout>
  );
};

export default Index;
