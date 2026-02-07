import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, SWEDISH_CITIES, calculateFees, CUSTOMER_FEE_PERCENT } from "@/lib/constants";
import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Upload, Check, Zap, Info } from "lucide-react";
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
    fixedPrice: "",
    autoAcceptEnabled: false,
    autoAcceptPrice: "",
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
      const price = parseInt(formData.fixedPrice);
      const autoAcceptPrice = formData.autoAcceptEnabled && formData.autoAcceptPrice 
        ? parseInt(formData.autoAcceptPrice) 
        : null;
      
      // Determine status based on auto-accept
      const status = autoAcceptPrice ? "instant_open" : "published";

      const { error } = await supabase.from("tasks").insert({
        customer_user_id: user.id,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        city: formData.city,
        address_optional: formData.address || null,
        preferred_date: formData.date || null,
        preferred_time: formData.time || null,
        budget_type: "fixed" as const,
        budget_min_sek: price,
        budget_max_sek: price,
        // auto_accept_price_sek will be available after types regenerate
        is_remote_possible: false,
        status: status as "published" | "instant_open",
      } as any);

      if (error) throw error;

      toast.success("Uppdraget har publicerats!", { 
        description: autoAcceptPrice 
          ? "Taskers kan nu acceptera direkt!" 
          : "Taskers kan nu lägga bud." 
      });
      navigate("/my-tasks");
    } catch (error: any) {
      toast.error(error.message || "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = (currentStep: number) => {
    if (currentStep === 1) return formData.title && formData.category;
    if (currentStep === 2) return formData.description;
    if (currentStep === 3) return formData.city;
    if (currentStep === 4) return formData.fixedPrice && parseInt(formData.fixedPrice) >= 100;
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

  const price = parseInt(formData.fixedPrice) || 0;
  const { customerFee, totalCustomerCharge } = calculateFees(price);

  return (
    <Layout>
      <div className="container max-w-2xl py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 max-w-12 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-card">
            <AnimatePresence mode="wait">
              {/* Step 1: Category + Title */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                    Vad behöver du hjälp med?
                  </h1>
                  <p className="text-muted-foreground mb-6">Steg 1 av 5: Kategori och titel</p>

                  <div className="space-y-4">
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
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                  </div>
                </motion.div>
              )}

              {/* Step 2: Description + Photos */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                    Beskriv uppdraget
                  </h1>
                  <p className="text-muted-foreground mb-6">Steg 2 av 5: Beskrivning och bilder</p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Beskrivning *</Label>
                      <Textarea
                        id="description"
                        placeholder="Beskriv uppdraget i detalj. Ju mer information, desto bättre bud får du."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1.5 min-h-[150px]"
                      />
                    </div>
                    <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                      <Upload className="mx-auto mb-2 text-muted-foreground" size={24} />
                      <p className="text-sm text-muted-foreground">Ladda upp bilder (valfritt)</p>
                      <p className="text-xs text-muted-foreground">Kommer snart</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Location */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                    Var ska uppdraget utföras?
                  </h1>
                  <p className="text-muted-foreground mb-6">Steg 3 av 5: Plats</p>

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
                        placeholder="Gatuadress (delas med vald tasker)"
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
                  </div>
                </motion.div>
              )}

              {/* Step 4: Price + Auto-accept */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                    Sätt ditt pris
                  </h1>
                  <p className="text-muted-foreground mb-6">Steg 4 av 5: Fast pris och direktbokning</p>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="fixedPrice">Ditt pris (SEK) *</Label>
                      <Input
                        id="fixedPrice"
                        type="number"
                        placeholder="1000"
                        min="100"
                        value={formData.fixedPrice}
                        onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                        className="mt-1.5 text-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minst 100 kr. Taskers kan lägga egna bud.
                      </p>
                    </div>

                    {price >= 100 && (
                      <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ditt pris</span>
                          <span className="font-medium">{price.toLocaleString("sv-SE")} kr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Serviceavgift ({Math.round(CUSTOMER_FEE_PERCENT * 100)}%)</span>
                          <span className="font-medium">{customerFee.toLocaleString("sv-SE")} kr</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border font-semibold">
                          <span>Du betalar</span>
                          <span>{totalCustomerCharge.toLocaleString("sv-SE")} kr</span>
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Zap className="text-accent mt-0.5" size={20} />
                          <div>
                            <Label htmlFor="autoAccept" className="text-base font-semibold">
                              Aktivera direktbokning
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Första kvalificerade tasker kan acceptera direkt – snabbaste sättet att få hjälp!
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="autoAccept"
                          checked={formData.autoAcceptEnabled}
                          onCheckedChange={(v) => setFormData({ ...formData, autoAcceptEnabled: v })}
                        />
                      </div>
                      
                      {formData.autoAcceptEnabled && (
                        <div className="mt-4 pt-4 border-t border-accent/20">
                          <Label htmlFor="autoAcceptPrice">Direktbokningspris (SEK)</Label>
                          <Input
                            id="autoAcceptPrice"
                            type="number"
                            placeholder={formData.fixedPrice || "1000"}
                            min="100"
                            value={formData.autoAcceptPrice}
                            onChange={(e) => setFormData({ ...formData, autoAcceptPrice: e.target.value })}
                            className="mt-1.5"
                          />
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Info size={12} />
                            Tasker i ditt område kan acceptera direkt till detta pris
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Review */}
              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                    Granska och publicera
                  </h1>
                  <p className="text-muted-foreground mb-6">Steg 5 av 5: Kontrollera uppgifterna</p>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Kategori</p>
                        <p className="font-medium text-foreground">{formData.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Titel</p>
                        <p className="font-medium text-foreground">{formData.title}</p>
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
                          <p className="text-xs text-muted-foreground">Pris</p>
                          <p className="font-medium text-foreground">{price.toLocaleString("sv-SE")} kr</p>
                        </div>
                      </div>
                      {formData.date && (
                        <div>
                          <p className="text-xs text-muted-foreground">Önskat datum</p>
                          <p className="font-medium text-foreground">{formData.date}</p>
                        </div>
                      )}
                    </div>

                    {formData.autoAcceptEnabled && formData.autoAcceptPrice && (
                      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
                        <Zap className="text-accent" size={20} />
                        <div>
                          <p className="font-semibold text-foreground">Direktbokning aktiverad</p>
                          <p className="text-sm text-muted-foreground">
                            Taskers kan acceptera direkt för {parseInt(formData.autoAcceptPrice).toLocaleString("sv-SE")} kr
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uppdraget</span>
                        <span className="font-medium">{price.toLocaleString("sv-SE")} kr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serviceavgift ({Math.round(CUSTOMER_FEE_PERCENT * 100)}%)</span>
                        <span className="font-medium">{customerFee.toLocaleString("sv-SE")} kr</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border font-semibold text-base">
                        <span>Total att betala</span>
                        <span>{totalCustomerCharge.toLocaleString("sv-SE")} kr</span>
                      </div>
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
              {step < 5 ? (
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
