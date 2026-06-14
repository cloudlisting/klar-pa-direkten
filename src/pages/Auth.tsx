import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, User } from "lucide-react";

type Mode = "login" | "signup" | "reset";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const isLogin = mode === "login";
  const isReset = mode === "reset";
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isReset) {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth",
        });
        toast.success("Om kontot finns skickar vi en återställningslänk till din e-post.");
        setMode("login");
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Välkommen tillbaka!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Konto skapat! Kolla din e-post för att verifiera.");
      }
    } catch (error: any) {
      toast.error(error.message || "Ett fel uppstod");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Kunde inte logga in med Google");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-8 shadow-card"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">
              {isReset ? "Återställ lösenord" : isLogin ? "Logga in" : "Skapa konto"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isReset
                ? "Ange din e-post så skickar vi en återställningslänk."
                : isLogin
                ? "Välkommen tillbaka till Moas"
                : "Kom igång med att använda Moas"}
            </p>
          </div>

          {!isReset && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.6 7.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2 1.4-4.5 2.4-7.3 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 40.6 16.2 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.3 5.2c-.4.4 6.4-4.7 6.4-14.8 0-1.2-.1-2.3-.4-3.5z"/>
            </svg>
            Fortsätt med Google
          </Button>
          )}

          {!isReset && (
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              eller
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isReset && (
              <div>
                <Label htmlFor="name">Namn</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ditt namn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email">E-post</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="email"
                  type="email"
                  placeholder="din@epost.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            {!isReset && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Lösenord</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-xs text-primary hover:underline"
                    >
                      Glömt lösenord?
                    </button>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? "Laddar..."
                : isReset
                ? "Skicka återställningslänk"
                : isLogin
                ? "Logga in"
                : "Skapa konto"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {isReset ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-primary font-medium hover:underline"
              >
                Tillbaka till logga in
              </button>
            ) : (
              <>
                <span className="text-muted-foreground">
                  {isLogin ? "Har du inget konto? " : "Har du redan ett konto? "}
                </span>
                <button
                  type="button"
                  onClick={() => setMode(isLogin ? "signup" : "login")}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? "Skapa konto" : "Logga in"}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Auth;
