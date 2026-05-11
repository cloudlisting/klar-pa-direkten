import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryGrid from "@/components/CategoryGrid";
import LiveTaskFeed from "@/components/LiveTaskFeed";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";
import { useT } from "@/lib/i18n";

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

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/70" />
        </div>
        <div className="container relative py-20 md:py-28">
          <div className="max-w-2xl">
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
              <Button variant="hero-outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                <Link to="/browse">{t("hero.cta.browse")}</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live local task feed */}
      <LiveTaskFeed />

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
    </Layout>
  );
};

export default Index;
