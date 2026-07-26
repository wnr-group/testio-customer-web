"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/ui/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MessageSquareText,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

// Formats a timestamp into a relative string (e.g. "2d ago", "3w ago")
function getRelativeTime(dateString: string | null): string {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
 const diffInWeeks = Math.floor(diffInDays / 7);
 if (diffInDays < 30) return `${diffInWeeks}w ago`;
 const diffInMonths = Math.floor(diffInDays / 30);
 if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
}

// Splits the user's name to fetch only the first name
function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "Anonymous";
  return fullName.trim().split(/\s+/)[0];
}


export default function CookReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [page, setPage] = useState(1);

  // 1. Fetch cook metadata summary
  const { data: cook, isLoading: isLoadingCook } = useQuery({
    queryKey: ["cookSummary", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cook_profiles")
        .select("kitchen_name, avg_rating, total_reviews")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as CookSummary;
    },
    enabled: !!id,
  });

  // 2. Fetch paginated reviews list
  // 2. Fetch paginated reviews list
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    isFetching: isFetchingReviews,
    isPlaceholderData,
  } = useQuery({
    queryKey: ["reviews", id, page],

    queryFn: async () => {
      const from = (page - 1) * 10;
      const to = from + 9;
      const { data, count, error } = await supabase
        .from("reviews")
        .select("*, users:customer_id(name)", { count: "exact" })
        .eq("cook_id", id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        reviews: (data as unknown as ReviewRow[]) || [],
        totalCount: count || 0,
      };
    },
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

  const totalCount = reviewsData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 10) || 1;
  const reviews = reviewsData?.reviews ?? [];

  const showSkeleton = isLoadingCook || (isLoadingReviews && !reviewsData);

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

        {showSkeleton ? (
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
                <StarRating
                  value={Number(cook?.avg_rating || 0)}
                  readOnly
                  size="lg"
                />
                <span className="text-2xl font-extrabold text-[#091A36]">
                  {Number(cook?.avg_rating || 0).toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ({cook?.total_reviews ?? totalCount} review
                  {(cook?.total_reviews ?? totalCount) === 1 ? "" : "s"})
                </span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-10 flex flex-col items-center gap-3 text-center">
                <div className="p-4 bg-red-50 rounded-full text-[#D61A22]">
                  <MessageSquareText className="size-6" />
                </div>
                <h2 className="text-base font-bold text-[#091A36]">
                  No reviews yet
                </h2>
                <p className="text-xs font-semibold text-slate-400 max-w-xs">
                  This cook hasn&apos;t received any reviews yet. Be the first
                  to order and share your experience.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div
                  className={cn(
                    "flex flex-col gap-4 transition-opacity duration-200",
                    isLoadingReviews && isPlaceholderData
                      ? "opacity-60 pointer-events-none"
                      : "opacity-100",
                  )}
                >
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
                            {getFirstName(review.users?.name)}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                          {getRelativeTime(review.created_at)}
                        </span>
                      </div>

                      <StarRating value={review.rating} readOnly size="sm" />

                      {review.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((old) => Math.max(old - 1, 1))}
                      disabled={page === 1 || isFetchingReviews}
                      className="rounded-xl font-bold text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="size-3.5" />
                      Previous
                    </Button>
                    <span className="text-xs text-slate-500 font-semibold">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((old) => Math.min(old + 1, totalPages))
                      }
                      disabled={page === totalPages || isFetchingReviews}
                      className="rounded-xl font-bold text-xs flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
