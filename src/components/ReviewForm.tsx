import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

interface ReviewFormProps {
  task: Task;
  revieweeId: string;
  revieweeName: string;
  onComplete: () => void;
}

const ReviewForm = ({ task, revieweeId, revieweeName, onComplete }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        task_id: task.id,
        reviewer_user_id: user.id,
        reviewee_user_id: revieweeId,
        rating,
        text: text.trim() || null,
      });

      if (error) throw error;

      toast.success("Tack för din recension!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte spara recensionen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-foreground mb-4">
        Betygsätt {revieweeName}
      </h3>

      <div className="space-y-4">
        {/* Star rating */}
        <div>
          <Label className="mb-2 block">Ditt betyg *</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={28}
                  className={cn(
                    "transition-colors",
                    (hoverRating || rating) >= star
                      ? "fill-warning text-warning"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {rating === 1 && "Dåligt"}
              {rating === 2 && "Mindre bra"}
              {rating === 3 && "Okej"}
              {rating === 4 && "Bra"}
              {rating === 5 && "Utmärkt"}
            </p>
          )}
        </div>

        {/* Text review */}
        <div>
          <Label htmlFor="reviewText">Kommentar (valfritt)</Label>
          <Textarea
            id="reviewText"
            placeholder="Berätta om din upplevelse..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1.5"
            rows={3}
          />
        </div>

        <Button
          variant="hero"
          className="w-full"
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? "Skickar..." : "Skicka recension"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewForm;
