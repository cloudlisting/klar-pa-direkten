import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_CATEGORIES, SWEDISH_CITIES } from "@/lib/mock-data";
import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Upload, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PostTask = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    city: "",
    address: "",
    date: "",
    time: "",
    budgetType: "fixed" as "fixed" | "hourly",
    budgetMin: "",
    budgetMax: "",
    isRemote: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        customer_user_id: user.id,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        city: formData.city,
        address_optional: formData.address || null,
        preferred_date: formData.date || null,
        preferred_time: formData.time || null,
        budget_type: formData.budgetType,
        budget_min_sek: formData.budgetMin ? parseInt(formData.budgetMin) : null,
        budget_max_sek: formData.budgetMax ? parseInt(formData.budgetMax) : null,
        is_remote_possible: formData.isRemote,
        status: "published",
      });

      if (error) throw error;

      toast.success("Uppdraget har publicerats!", { description: "Taskers kan nu lägga bud." });
      navigate("/my-tasks");
    } catch (error: any) {
      toast.error(error.message || "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = (currentStep: number) => {
    if (currentStep === 1) return formData.title && formData.category && formData.description;
    if (currentStep === 2) return formData.city;
    if (currentStep === 3) return formData.budgetMax || formData.budgetMin;
    return true;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 max-w-16 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-card">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                    Vad behöver du hjälp med?
                  </h1>
                  <p className="text-muted-foreground mb-6">Steg 1 av 4: Beskrivning</p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Titel *</Label>
                      <Input
                        id="title"
                        placeholder="T.ex. Flytta möbler till ny lägenhet"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Kategori *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Välj kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOCK_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
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
                        placeholder="Beskriv uppdraget i detalj..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1.5 min-h-[120px]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                    Var och när?
                  </h1>
                  <p className="text-muted-foreground mb-6">Steg 2 av 4: Plats och tid</p>

                  <div className="space-y-4">
                    <div>
                      <Label>Stad *</Label>
                      <Select
                        value={formData.city}
                        onValueChange={(v) => setFormData({ ...formData, city: v })}
                      >
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
                      <Input
                        id="address"
                        placeholder="Gatuadress"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="date">Önskat datum</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Önskad tid</Label>
                        <Input
                          id="time"
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <Label htmlFor="remote">Distansuppdrag möjligt</Label>
                        <p className="text-xs text-muted-foreground">Kan utföras på distans?</p>
                      </div>
                      <Switch
                        id="remote"
                        checked={formData.isRemote}
                        onCheckedChange={(v) => setFormData({ ...formData, isRemote: v })}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                    Budget
                  </h1>
                  <p className="text-muted-foreground mb-6">Steg 3 av 4: Vad är din budget?</p>

                  <div className="space-y-4">
                    <div>
                      <Label>Budgettyp</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Button
                          type="button"
                          variant={formData.budgetType === "fixed" ? "default" : "outline"}
                          onClick={() => setFormData({ ...formData, budgetType: "fixed" })}
                        >
                          Fast pris
                        </Button>
                        <Button
                          type="button"
                          variant={formData.budgetType === "hourly" ? "default" : "outline"}
                          onClick={() => setFormData({ ...formData, budgetType: "hourly" })}
                        >
                          Per timme
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="budgetMin">
                          {formData.budgetType === "fixed" ? "Min budget (SEK)" : "Min timpris (SEK)"}
                        </Label>
                        <Input
                          id="budgetMin"
                          type="number"
                          placeholder="500"
                          value={formData.budgetMin}
                          onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="budgetMax">
                          {formData.budgetType === "fixed" ? "Max budget (SEK) *" : "Max timpris (SEK) *"}
                        </Label>
                        <Input
                          id="budgetMax"
                          type="number"
                          placeholder="1500"
                          value={formData.budgetMax}
                          onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                    Granska och publicera
                  </h1>
                  <p className="text-muted-foreground mb-6">Steg 4 av 4: Kontrollera uppgifterna</p>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Titel</p>
                        <p className="font-medium text-foreground">{formData.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Kategori</p>
                        <p className="font-medium text-foreground">{formData.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Beskrivning</p>
                        <p className="text-foreground text-sm">{formData.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Plats</p>
                          <p className="font-medium text-foreground">{formData.city}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="font-medium text-foreground">
                            {formData.budgetMin && `${formData.budgetMin} - `}
                            {formData.budgetMax} kr
                            {formData.budgetType === "hourly" && "/h"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                      <Upload className="mx-auto mb-2 text-muted-foreground" size={24} />
                      <p className="text-sm text-muted-foreground">Ladda upp bilder (valfritt)</p>
                      <p className="text-xs text-muted-foreground">Kommer snart</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft size={16} /> Tillbaka
                </Button>
              )}
              {step < 4 ? (
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed(step)}
                >
                  Fortsätt <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Publicerar..." : "Publicera uppdrag"}
                  <Check size={16} />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PostTask;
