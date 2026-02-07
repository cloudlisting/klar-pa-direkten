import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_CATEGORIES, SWEDISH_CITIES } from "@/lib/mock-data";
import { useState } from "react";
import { ArrowRight, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PostTask = () => {
  const navigate = useNavigate();
  const [isRemote, setIsRemote] = useState(false);
  const [budgetType, setBudgetType] = useState<"fixed" | "hourly">("fixed");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Uppdraget har publicerats!", { description: "Taskers kan nu lägga bud." });
    navigate("/browse");
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">
            Publicera ett uppdrag
          </h1>
          <p className="text-muted-foreground mb-8">
            Beskriv vad du behöver hjälp med så får du bud från taskers i ditt område.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" placeholder="T.ex. Flytta möbler till ny lägenhet" className="mt-1.5" required />
            </div>

            <div>
              <Label htmlFor="category">Kategori *</Label>
              <Select required>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Beskrivning *</Label>
              <Textarea
                id="description"
                placeholder="Beskriv uppdraget i detalj. Ju mer information, desto bättre bud får du."
                className="mt-1.5 min-h-[120px]"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="city">Stad *</Label>
                <Select required>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Välj stad" />
                  </SelectTrigger>
                  <SelectContent>
                    {SWEDISH_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="address">Adress (valfritt)</Label>
                <Input id="address" placeholder="Gatuadress" className="mt-1.5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="date">Datum *</Label>
                <Input id="date" type="date" className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="time">Tid (valfritt)</Label>
                <Input id="time" type="time" className="mt-1.5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Budgettyp</Label>
                <div className="mt-1.5 flex gap-2">
                  <Button
                    type="button"
                    variant={budgetType === "fixed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBudgetType("fixed")}
                  >
                    Fast pris
                  </Button>
                  <Button
                    type="button"
                    variant={budgetType === "hourly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBudgetType("hourly")}
                  >
                    Per timme
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="budget">Budget (SEK) *</Label>
                <Input id="budget" type="number" placeholder="1000" className="mt-1.5" required />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <Label htmlFor="remote" className="cursor-pointer">Distansuppdrag möjligt</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Kan uppdraget utföras på distans?</p>
              </div>
              <Switch id="remote" checked={isRemote} onCheckedChange={setIsRemote} />
            </div>

            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
              <Upload className="mx-auto mb-2 text-muted-foreground" size={28} />
              <p className="text-sm text-muted-foreground mb-1">Ladda upp bilder (valfritt)</p>
              <p className="text-xs text-muted-foreground">Max 5 bilder, JPG eller PNG</p>
            </div>

            <Button variant="hero" size="xl" type="submit" className="w-full">
              Publicera uppdrag
              <ArrowRight size={18} />
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PostTask;
