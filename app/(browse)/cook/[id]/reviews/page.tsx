"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/ui/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquareText, User } from "lucide-react";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  users: { name: string | null } | null;
}

interface CookSummary {
  kitchen_name: string;
  avg_rating: number | null;
  total_reviews: number | null;
}

export default function CookReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [cook, setCook] = useState<CookSummary | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [{ data: cookData }, { data: reviewData }] = await Promise.all([
        supabase
          .from("cook_profiles")
          .select("kitchen_name, avg_rating, total_reviews")
          .eq("id", id)
          .single(),
        supabase
          .from("reviews")
          .select("*, users:customer_id(name)")
          .eq("cook_id", id)
          .order("created_at", { ascending: false }),
      ]);

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCook(cookData ?? null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReviews((reviewData as unknown as ReviewRow[]) ?? []);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }

    if (id) load();
  }, [id, supabase]);

  const formatDate = (value: string | null) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/cook/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#D61A22] transition-colors mb-6"
        >
          <ArrowLeft className="size-3.5" />
          Back to Cook Profile
        </Link>

        {loading ? (
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-3">
              <Skeleton className="h-6 w-1/2 rounded-md" />
              <Skeleton className="h-8 w-1/3 rounded-md" />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-3"
              >
                <Skeleton className="h-4 w-1/4 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-2/3 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-3">
              <h1 className="text-lg font-bold text-[#091A36]">
                Reviews for {cook?.kitchen_name ?? "this cook"}
              </h1>
              <div className="flex items-center gap-3">
                <StarRating value={Number(cook?.avg_rating || 0)} readOnly size="lg" />
                <span className="text-2xl font-extrabold text-[#091A36]">
                  {Number(cook?.avg_rating || 0).toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ({cook?.total_reviews ?? reviews.length} review
                  {(cook?.total_reviews ?? reviews.length) === 1 ? "" : "s"})
                </span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-10 flex flex-col items-center gap-3 text-center">
                <div className="p-4 bg-red-50 rounded-full text-[#D61A22]">
                  <MessageSquareText className="size-6" />
                </div>
                <h2 className="text-base font-bold text-[#091A36]">No reviews yet</h2>
                <p className="text-xs font-semibold text-slate-400 max-w-xs">
                  This cook hasn&apos;t received any reviews yet. Be the first to order and share
                  your experience.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="size-4" />
                        </div>
                        <span className="font-bold text-sm text-[#091A36] truncate">
                          {review.users?.name || "Anonymous"}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                        {formatDate(review.created_at)}
                      </span>
                    </div>

                    <StarRating value={review.rating} readOnly size="sm" />

                    {review.comment && (
                      <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
