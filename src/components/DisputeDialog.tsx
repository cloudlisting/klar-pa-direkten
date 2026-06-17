import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  threadId: string;
  userId: string;
  onRaised?: () => void;
}

const REASONS = [
  "Utföraren dök inte upp",
  "Arbetet utfördes inte korrekt",
  "Kunden vägrar betala",
  "Kommunikationsproblem",
  "Skada eller förlust",
  "Annat",
];

const DisputeDialog = ({ open, onOpenChange, taskId, threadId, userId, onRaised }: DisputeDialogProps) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Välj en anledning");
      return;
    }
    setSubmitting(true);
    try {
      const { error: insErr } = await supabase.from("disputes").insert({
        task_id: taskId,
        thread_id: threadId,
        raised_by: userId,
        reason,
        details: details.trim() || null,
      });
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from("tasks")
        .update({ status: "disputed" })
        .eq("id", taskId);
      if (updErr) throw updErr;

      toast.success("Tvist registrerad – kundtjänst är kontaktad.");
      onOpenChange(false);
      setReason("");
      setDetails("");
      onRaised?.();
    } catch (err: any) {
      toast.error(err.message || "Kunde inte skapa tvist");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Markera tvist</DialogTitle>
          <DialogDescription>
            Beskriv problemet så hjälper kundtjänst er att hitta en lösning. Utbetalningen fryses tills tvisten är löst.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Anledning</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Välj anledning" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="details">Beskriv mer (valfritt)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Vad hände? När hände det?"
              className="mt-1.5 min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Avbryt
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason}>
            {submitting ? "Skickar..." : "Skicka tvist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisputeDialog;
