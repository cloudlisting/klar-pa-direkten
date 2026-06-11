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
import { MapPin, Phone, User } from "lucide-react";
import { SWEDISH_CITIES } from "@/lib/constants";

const schema = z.object({
  first_name: z.string().trim().min(1, { message: "Ange ditt förnamn" }).max(60),
  last_name: z.string().trim().min(1, { message: "Ange ditt efternamn" }).max(60),
  city: z.string().trim().min(2, { message: "Välj din stad" }).max(80),
  phone: z
    .string()
    .trim()
    .min(6, { message: "Ange ett telefonnummer" })
    .max(20)
    .regex(/^[+0-9\s-]+$/, { message: "Ogiltigt telefonnummer" }),
  terms: z.literal(true, { errorMap: () => ({ message: "Du måste godkänna villkoren" }) }),
});

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  // Prefill from Google metadata + existing profile
  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata || {}) as Record<string, string>;
    const given = meta.given_name || "";
    const family = meta.family_name || "";
    const fallbackFull = (meta.name || meta.full_name || "").trim();
    let g = given, f = family;
    if (!g && !f && fallbackFull) {
      const parts = fallbackFull.split(/\s+/);
      g = parts[0] || "";
      f = parts.slice(1).join(" ") || "";
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, city" as any)
        .eq("id", user.id)
        .maybeSingle();
      const p = (data as any) || {};
      setFirstName(p.first_name || g);
      setLastName(p.last_name || f);
      setPhone(p.phone || "");
      setCity(p.city || "");
    })();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Du måste vara inloggad");
      navigate("/auth", { replace: true });
      return;
    }
    const parsed = schema.safeParse({
      first_name: firstName,
      last_name: lastName,
      city,
      phone,
      terms,
    });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Fyll i alla obligatoriska fält";
      console.warn("[Onboarding] validation failed:", parsed.error.issues);
      toast.error(msg);
      return;
    }
    setSubmitting(true);
    try {
      const fullName = `${parsed.data.first_name} ${parsed.data.last_name}`.trim();
      const { data, error } = await supabase
        .from("profiles")
        .update({
          first_name: parsed.data.first_name,
          last_name: parsed.data.last_name,
          name: fullName,
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
              Berätta lite om dig själv så kan du både lägga upp uppdrag och utföra dem.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="first_name">Förnamn</Label>
                <div className="relative mt-1.5">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    id="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Anna"
                    className="pl-10"
                    maxLength={60}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="last_name">Efternamn</Label>
                <div className="relative mt-1.5">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    id="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Andersson"
                    className="pl-10"
                    maxLength={60}
                    required
                  />
                </div>
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

            <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
              Du kan både <span className="font-medium text-foreground">lägga upp uppdrag</span> och{" "}
              <span className="font-medium text-foreground">utföra uppdrag</span> — du behöver inte
              välja nu. BankID-verifiering krävs senare för att utföra uppdrag åt andra.
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
              disabled={submitting}
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
