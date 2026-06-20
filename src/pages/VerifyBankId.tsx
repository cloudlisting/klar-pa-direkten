import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const ERROR_MESSAGES: Record<string, string> = {
  personnummer_already_used: "Det här BankID-kontot är redan kopplat till ett annat konto.",
  bad_state: "Sessionen hann gå ut. Försök igen.",
  missing_code: "Något gick fel med BankID-inloggningen. Försök igen.",
  unexpected: "Ett oväntat fel uppstod. Försök igen om en stund.",
};

const VerifyBankId = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, bankidVerified, refreshProfile } = useAuth();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (bankidVerified) {
      refreshProfile();
      navigate("/dashboard", { replace: true });
    }
  }, [bankidVerified, navigate, refreshProfile]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) toast.error(ERROR_MESSAGES[error] || "Verifieringen misslyckades. Försök igen.");
  }, [searchParams]);

  const startVerification = async () => {
    setStarting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        toast.error("Du måste vara inloggad");
        return;
      }
      window.location.href = `${SUPABASE_URL}/functions/v1/signicat-bankid-start?flow=register&access_token=${encodeURIComponent(accessToken)}`;
    } catch {
      toast.error("Kunde inte starta BankID-verifiering");
      setStarting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-8 text-center shadow-card"
        >
          <ShieldCheck className="mx-auto mb-4 text-primary" size={40} />
          <h1 className="mb-2 text-2xl font-bold font-display text-foreground">
            Verifiera dig med BankID
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            För att skapa ett konto på Moas måste du verifiera din identitet med BankID. Det tar
            bara några sekunder.
          </p>
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={startVerification}
            disabled={starting}
          >
            {starting ? "Startar..." : "Verifiera med BankID"}
          </Button>
        </motion.div>
      </div>
    </Layout>
  );
};

export default VerifyBankId;
