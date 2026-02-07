import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Review = Tables<"reviews"> & {
  reviewer?: Tables<"profiles">;
};

interface ReviewsListProps {
  userId: string;
  limit?: number;
}

const ReviewsList = ({ userId, limit = 5 }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      // Fetch reviewer profiles
      const reviewerIds = data.map((r) => r.reviewer_user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", reviewerIds);

      const enriched = data.map((review) => ({
        ...review,
        reviewer: profiles?.find((p) => p.id === review.reviewer_user_id),
      }));

      setReviews(enriched);
    }
    setLoading(false);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Laddar recensioner...</p>;
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Inga recensioner ännu</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                {review.reviewer?.name?.charAt(0) || "?"}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {review.reviewer?.name || "Anonym"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("sv-SE")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={cn(
                    review.rating >= star
                      ? "fill-warning text-warning"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
          </div>
          {review.text && (
            <p className="text-sm text-muted-foreground">{review.text}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewsList;
