import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, ShoppingBag, Building2, MapPin, Phone } from "lucide-react";

const SWEDISH_CITIES = [
  "Stockholm",
  "Göteborg",
  "Malmö",
  "Uppsala",
  "Västerås",
  "Örebro",
  "Linköping",
  "Helsingborg",
  "Jönköping",
  "Norrköping",
  "Lund",
  "Umeå",
  "Gävle",
  "Borås",
  "Sundsvall",
];

const schema = z.object({
  role: z.enum(["bestallare", "tasker", "foretag"]),
  city: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .min(6, { message: "För kort" })
    .max(20)
    .regex(/^[+0-9\s-]+$/, { message: "Ogiltigt telefonnummer" }),
  terms: z.literal(true, { errorMap: () => ({ message: "Du måste godkänna villkoren" }) }),
});

const ROLE_OPTIONS = [
  {
    value: "bestallare" as const,
    title: "Beställare",
    desc: "Jag vill lägga upp uppdrag",
    icon: ShoppingBag,
  },
  {
    value: "tasker" as const,
    title: "Runner / Tasker",
    desc: "Jag vill utföra uppdrag",
    icon: Briefcase,
  },
  {
    value: "foretag" as const,
    title: "Företag",
    desc: "Vi erbjuder tjänster",
    icon: Building2,
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [role, setRole] = useState<"bestallare" | "tasker" | "foretag" | "">("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Du måste vara inloggad");
      navigate("/auth", { replace: true });
      return;
    }
    const parsed = schema.safeParse({ role, city, phone, terms });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Fyll i alla obligatoriska fält";
      console.warn("[Onboarding] validation failed:", parsed.error.issues);
      toast.error(msg);
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          role: parsed.data.role,
          city: parsed.data.city,
          phone: parsed.data.phone,
          google_connected: true,
          onboarding_completed: true,
        } as any)
        .eq("id", user.id)
        .select("id, onboarding_completed")
        .maybeSingle();
      if (error) {
        console.error("[Onboarding] update failed:", error);
        throw error;
      }
      if (!data) {
        console.error("[Onboarding] update returned no row (RLS or missing profile)");
        throw new Error("Kunde inte uppdatera profilen. Försök logga in igen.");
      }
      await refreshProfile();
      toast.success("Välkommen till Moas!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("[Onboarding] submit error:", err);
      toast.error(err?.message || "Kunde inte spara profilen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8 shadow-card"
        >
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold font-display text-foreground">
              Välkommen till Moas
            </h1>
            <p className="text-muted-foreground">
              Berätta lite om dig själv så hittar vi rätt uppdrag åt dig.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="mb-3 block text-sm font-medium">Jag är...</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon
                        size={22}
                        className={active ? "text-primary" : "text-muted-foreground"}
                      />
                      <div className="mt-2 text-sm font-semibold text-foreground">
                        {opt.title}
                      </div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="city">Stad</Label>
              <div className="relative mt-1.5">
                <MapPin
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger id="city" className="pl-10">
                    <SelectValue placeholder="Välj din stad" />
                  </SelectTrigger>
                  <SelectContent>
                    {SWEDISH_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefonnummer</Label>
              <div className="relative mt-1.5">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+46 70 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  maxLength={20}
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <Checkbox
                id="terms"
                checked={terms}
                onCheckedChange={(c) => setTerms(c === true)}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                Jag godkänner Moas{" "}
                <a href="#" className="text-primary underline">
                  användarvillkor
                </a>{" "}
                och{" "}
                <a href="#" className="text-primary underline">
                  integritetspolicy
                </a>
                .
              </Label>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={submitting || !role || !city || !phone || !terms}
            >
              {submitting ? "Sparar..." : "Slutför och fortsätt"}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Onboarding;
