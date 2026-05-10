import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import TrustBadges from "@/components/TrustBadges";
import ReviewsList from "@/components/ReviewsList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type TaskerProfile = Tables<"tasker_profiles">;

const PublicProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [taskerProfile, setTaskerProfile] = useState<TaskerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [{ data: p }, { data: tp }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("tasker_profiles").select("*").eq("user_id", userId).maybeSingle(),
      ]);
      setProfile(p);
      setTaskerProfile(tp);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center text-muted-foreground">Laddar profil...</div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profilen finns inte</h1>
          <Button variant="outline" asChild>
            <Link to="/browse"><ArrowLeft size={16} /> Tillbaka</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const verifiedCount =
    Number(profile.bankid_verified) +
    Number(profile.id_verified) +
    Number(profile.phone_verified) +
    Number(profile.email_verified);

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold font-display text-foreground">
                  {profile.name}
                </h1>
                {verifiedCount >= 2 && (
                  <Badge variant="success" className="gap-1">
                    <ShieldCheck size={12} /> Verifierad
                  </Badge>
                )}
                {taskerProfile && <Badge variant="accent">Tasker</Badge>}
              </div>
              {taskerProfile?.service_area_city && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin size={13} /> {taskerProfile.service_area_city}
                </p>
              )}
              <div className="mt-3">
                <TrustBadges data={profile} size="lg" showAll />
              </div>
            </div>
          </div>

          {(profile.bio || taskerProfile?.bio) && (
            <div className="mt-6 pt-6 border-t border-border">
              <h2 className="font-semibold text-foreground mb-2">Om</h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {profile.bio || taskerProfile?.bio}
              </p>
            </div>
          )}

          {taskerProfile?.skills && taskerProfile.skills.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h2 className="font-semibold text-foreground mb-3">Färdigheter</h2>
              <div className="flex flex-wrap gap-2">
                {taskerProfile.skills.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-8">
          <h2 className="text-xl font-bold font-display text-foreground mb-4">
            Recensioner ({profile.rating_count || 0})
          </h2>
          <ReviewsList userId={profile.id} limit={20} />
        </div>
      </div>
    </Layout>
  );
};

export default PublicProfile;
