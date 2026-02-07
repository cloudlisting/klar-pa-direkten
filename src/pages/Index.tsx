import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryGrid from "@/components/CategoryGrid";
import TaskCard from "@/components/TaskCard";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type TaskWithOffers = Task & { offers_count: number };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  const [latestTasks, setLatestTasks] = useState<TaskWithOffers[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    fetchLatestTasks();
  }, []);

  const fetchLatestTasks = async () => {
    // Fetch latest published tasks with offer counts
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .in("status", ["published", "in_bidding"])
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(4);

    if (!error && tasks) {
      // Fetch offer counts for each task
      const taskIds = tasks.map((t) => t.id);
      const { data: offerCounts } = await supabase
        .from("offers")
        .select("task_id")
        .in("task_id", taskIds);

      const countsMap: Record<string, number> = {};
      offerCounts?.forEach((o) => {
        countsMap[o.task_id] = (countsMap[o.task_id] || 0) + 1;
      });

      setLatestTasks(
        tasks.map((t) => ({ ...t, offers_count: countsMap[t.id] || 0 }))
      );
    }
    setLoadingTasks(false);
  };

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
                🇸🇪 Sveriges marknadsplats för tjänster
              </Badge>
            </motion.div>
            <motion.h1
              className="text-4xl font-bold text-primary-foreground md:text-5xl lg:text-6xl font-display leading-tight mb-5"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              Få saker gjorda.{" "}
              <span className="text-accent">Snabbt & enkelt.</span>
            </motion.h1>
            <motion.p
              className="text-lg text-primary-foreground/80 mb-8 max-w-lg"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
            >
              Hitta pålitliga taskers i ditt område eller tjäna pengar genom att hjälpa andra med vardagliga uppdrag.
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
                  Publicera ett uppdrag
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                <Link to="/browse">Bläddra uppdrag</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display text-foreground mb-3">
              Så fungerar det
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Tre enkla steg till ett utfört uppdrag
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Zap className="text-accent" size={28} />,
                title: "1. Publicera ditt uppdrag",
                desc: "Beskriv vad du behöver hjälp med, sätt en budget och välj plats.",
              },
              {
                icon: <Star className="text-accent" size={28} />,
                title: "2. Få bud från taskers",
                desc: "Lokala taskers skickar sina bud. Jämför pris, betyg och erfarenhet.",
              },
              {
                icon: <CheckCircle className="text-accent" size={28} />,
                title: "3. Välj och få det gjort",
                desc: "Acceptera ett bud, betala säkert via plattformen och lämna ett omdöme.",
              },
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
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-secondary/50">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                Populära kategorier
              </h2>
              <p className="text-muted-foreground">Hitta rätt hjälp för varje behov</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/browse">
                Visa alla <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* Latest tasks */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                Senaste uppdragen
              </h2>
              <p className="text-muted-foreground">Nya uppdrag publicerade nyligen</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/browse">
                Visa alla <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {loadingTasks ? (
              <p className="col-span-2 text-center py-8 text-muted-foreground">
                Laddar uppdrag...
              </p>
            ) : latestTasks.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Inga uppdrag publicerade ännu
                </p>
                <Button variant="hero" asChild>
                  <Link to="/post-task">Publicera det första uppdraget</Link>
                </Button>
              </div>
            ) : (
              latestTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={{
                    id: task.id,
                    title: task.title,
                    description: task.description || "",
                    category: task.category,
                    location: task.city,
                    date: task.preferred_date || "",
                    budget: task.budget_max_sek || task.budget_min_sek || 0,
                    budgetType: task.budget_type as "fixed" | "hourly",
                    status: "open",
                    isRemote: task.is_remote_possible || false,
                    postedBy: "Kund",
                    postedAt: new Date(task.created_at).toLocaleDateString("sv-SE"),
                    offersCount: task.offers_count,
                  }}
                />
              ))
            )}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/browse">Visa alla uppdrag</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 bg-primary">
        <div className="container text-center">
          <Shield className="mx-auto mb-4 text-primary-foreground/80" size={36} />
          <h2 className="text-3xl font-bold font-display text-primary-foreground mb-3">
            Tryggt & säkert
          </h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">
            Betalningen hålls säker tills uppdraget är klart. Betyg, omdömen och verifierade profiler ger extra trygghet.
          </p>
          <Button variant="accent" size="lg" asChild>
            <Link to="/post-task">Kom igång gratis</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
