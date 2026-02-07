import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user!.id)
      .single();
    
    if (data) {
      setProfile(data);
      setFormData({
        name: data.name || "",
        phone: data.phone || "",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          phone: formData.phone,
        })
        .eq("id", user!.id);

      if (error) throw error;
      toast.success("Profil uppdaterad!");
    } catch (error: any) {
      toast.error(error.message || "Kunde inte spara");
    } finally {
      setSaving(false);
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

  return (
    <Layout>
      <div className="container max-w-2xl py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold font-display text-foreground mb-6">
            Inställningar
          </h1>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
            <h2 className="font-semibold text-foreground mb-4">Profilinformation</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1.5 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">E-post kan inte ändras</p>
              </div>
              <div>
                <Label htmlFor="name">Namn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="070-XXX XX XX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" variant="hero" disabled={saving}>
                {saving ? "Sparar..." : "Spara ändringar"}
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
            <h2 className="font-semibold text-destructive mb-2">Logga ut</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Du kommer att behöva logga in igen för att använda Taskly.
            </p>
            <Button variant="destructive" onClick={signOut}>
              Logga ut
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Settings;
