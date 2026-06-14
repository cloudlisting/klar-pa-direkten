import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SWEDISH_CITIES, CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, X } from "lucide-react";

const BecomeTasker = () => {
  const { user, loading, isTasker, refreshTaskerStatus } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: "",
    skills: [] as string[],
    service_area_city: "",
    service_radius_km: 10,
    hourly_rate_sek: 250,
  });

  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("tasker_profiles").insert({
        user_id: user.id,
        bio: formData.bio,
        skills: formData.skills,
        service_area_city: formData.service_area_city,
        service_radius_km: formData.service_radius_km,
        hourly_rate_sek: formData.hourly_rate_sek,
      });

      if (error) throw error;

      toast.success("Du är nu registrerad som tasker!");
      await refreshTaskerStatus();
      navigate("/tasker-dashboard");
    } catch (error: any) {
      toast.error(error.message || "Något gick fel");
    } finally {
      setSubmitting(false);
    }
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

  if (isTasker) {
    return (
      <Layout>
        <div className="container max-w-lg py-16 text-center">
          <h1 className="text-2xl font-bold font-display text-foreground mb-4">
            Du är redan tasker!
          </h1>
          <p className="text-muted-foreground mb-6">
            Du har redan registrerat dig som tasker. Gå till din dashboard för att hantera uppdrag.
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate("/tasker-dashboard")}>
            Gå till Tasker Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container max-w-lg py-16 text-center">
          <h1 className="text-2xl font-bold font-display text-foreground mb-4">
            Bli tasker på Moas
          </h1>
          <p className="text-muted-foreground mb-6">
            Du måste logga in eller skapa ett konto för att bli tasker.
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate("/auth")}>
            Logga in eller registrera dig
          </Button>
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
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-8 shadow-card">
            {step === 1 && (
              <>
                <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                  Berätta om dig själv
                </h1>
                <p className="text-muted-foreground mb-6">
                  Hjälp kunder förstå varför de ska välja dig.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Beskriv din erfarenhet och vad du kan hjälpa till med..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="mt-1.5 min-h-[120px]"
                    />
                  </div>
                  <div>
                    <Label>Färdigheter</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        placeholder="T.ex. Flytthjälp, Städning..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" variant="outline" onClick={addSkill}>
                        Lägg till
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                            <X size={12} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Eller välj från kategorier:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {CATEGORIES.slice(0, 4).map((cat) => (
                        <Button
                          key={cat.id}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            if (!formData.skills.includes(cat.name)) {
                              setFormData({ ...formData, skills: [...formData.skills, cat.name] });
                            }
                          }}
                        >
                          {cat.icon} {cat.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mt-6"
                  onClick={() => setStep(2)}
                >
                  Fortsätt <ArrowRight size={16} />
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                  Var arbetar du?
                </h1>
                <p className="text-muted-foreground mb-6">
                  Ange ditt arbetsområde så matchar vi dig med relevanta uppdrag.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label>Stad</Label>
                    <Select
                      value={formData.service_area_city}
                      onValueChange={(v) => setFormData({ ...formData, service_area_city: v })}
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
                    <Label htmlFor="radius">Radie (km)</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={formData.service_radius_km}
                      onChange={(e) => setFormData({ ...formData, service_radius_km: parseInt(e.target.value) || 10 })}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Hur långt från din stad kan du åka för uppdrag?
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Tillbaka
                  </Button>
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={() => setStep(3)}
                    disabled={!formData.service_area_city}
                  >
                    Fortsätt <ArrowRight size={16} />
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-2xl font-bold font-display text-foreground mb-2">
                  Sätt ditt pris
                </h1>
                <p className="text-muted-foreground mb-6">
                  Ange ditt standardpris per timme. Du kan anpassa pris per uppdrag.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rate">Timpris (SEK)</Label>
                    <Input
                      id="rate"
                      type="number"
                      value={formData.hourly_rate_sek}
                      onChange={(e) => setFormData({ ...formData, hourly_rate_sek: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Rekommenderat: 200-400 kr/timme beroende på tjänst
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Tillbaka
                  </Button>
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Skapar profil..." : "Skapa tasker-profil"}
                    <CheckCircle size={16} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default BecomeTasker;
