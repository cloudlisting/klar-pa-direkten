import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_TASKS } from "@/lib/mock-data";
import { MapPin, Calendar, Clock, Wifi, ArrowLeft, Star, MessageSquare, User } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_OFFERS = [
  { id: "o1", taskerName: "Marcus J.", rating: 4.8, reviews: 23, price: 1200, message: "Hej! Jag har lång erfarenhet av flytt och kan hjälpa dig. Har eget fordon.", duration: "3-4 timmar" },
  { id: "o2", taskerName: "Linda A.", rating: 4.9, reviews: 45, price: 1400, message: "Professionell flytthjälp med försäkring. Kan komma redan imorgon!", duration: "2-3 timmar" },
  { id: "o3", taskerName: "Oscar K.", rating: 4.6, reviews: 12, price: 1100, message: "Flexibel med tider och har erfarenhet av flytt utan hiss.", duration: "3-4 timmar" },
];

const TaskDetail = () => {
  const { id } = useParams();
  const task = MOCK_TASKS.find((t) => t.id === id);

  if (!task) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Uppdraget hittades inte</h1>
          <Button variant="outline" asChild>
            <Link to="/browse"><ArrowLeft size={16} /> Tillbaka</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={14} /> Tillbaka till uppdrag
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary">{task.category}</Badge>
                {task.isRemote && (
                  <Badge variant="muted" className="gap-1"><Wifi size={10} /> Distans möjligt</Badge>
                )}
                <Badge variant="success">Öppen</Badge>
              </div>
              <h1 className="text-2xl font-bold font-display text-foreground mb-4">
                {task.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1"><MapPin size={14} /> {task.location}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {task.date}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {task.postedAt}</span>
                <span className="flex items-center gap-1"><User size={14} /> {task.postedBy}</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-2">Beskrivning</h3>
                <p className="text-muted-foreground leading-relaxed">{task.description}</p>
              </div>
            </motion.div>

            {/* Offers */}
            <div>
              <h2 className="text-xl font-bold font-display text-foreground mb-4">
                Bud ({MOCK_OFFERS.length})
              </h2>
              <div className="space-y-3">
                {MOCK_OFFERS.map((offer, i) => (
                  <motion.div
                    key={offer.id}
                    className="rounded-xl border border-border bg-card p-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-foreground">
                          {offer.taskerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{offer.taskerName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Star size={11} className="text-warning fill-warning" /> {offer.rating}</span>
                            <span>({offer.reviews} omdömen)</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{offer.price.toLocaleString("sv-SE")} kr</p>
                        <p className="text-xs text-muted-foreground">{offer.duration}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{offer.message}</p>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="hero">Acceptera bud</Button>
                      <Button size="sm" variant="outline" className="gap-1">
                        <MessageSquare size={13} /> Chatta
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card sticky top-24">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-foreground">
                  {task.budget.toLocaleString("sv-SE")} kr
                </p>
                <p className="text-sm text-muted-foreground">
                  {task.budgetType === "fixed" ? "Fast pris" : "Per timme"}
                </p>
              </div>
              <Button variant="hero" size="lg" className="w-full mb-3">
                Lägg ett bud
              </Button>
              <Button variant="outline" size="lg" className="w-full gap-1">
                <MessageSquare size={16} /> Kontakta kunden
              </Button>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Kategori</span>
                  <span className="text-foreground font-medium">{task.category}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Plats</span>
                  <span className="text-foreground font-medium">{task.location}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Datum</span>
                  <span className="text-foreground font-medium">{task.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bud</span>
                  <span className="text-foreground font-medium">{task.offersCount} st</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskDetail;
