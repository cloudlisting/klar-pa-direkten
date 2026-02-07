import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Copy, Check, Users } from "lucide-react";
import { toast } from "sonner";

const ReferralSection = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    // Fetch profile with referral code
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    }

    // Count successful referrals
    const { count } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_user_id", user.id)
      .eq("status", "completed");

    setReferralCount(count || 0);
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (!referralCode) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Länk kopierad!");
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Laddar...</p>;
  }

  if (!referralCode) {
    return null;
  }

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Gift className="text-accent" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Bjud in vänner</h3>
          <p className="text-sm text-muted-foreground">
            Dela din länk och tjäna belöningar när dina vänner registrerar sig
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Din unika referenskod</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={referralLink}
              readOnly
              className="text-sm font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          <Users size={18} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{referralCount} inbjudna</p>
            <p className="text-xs text-muted-foreground">
              {referralCount === 0 
                ? "Inga vänner har registrerat sig ännu" 
                : "Vänner som registrerat sig via din länk"}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Så här fungerar det:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Dela din personliga länk med vänner</li>
            <li>De registrerar sig via länken</li>
            <li>Ni får båda belöningar när de slutför sitt första uppdrag</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ReferralSection;
