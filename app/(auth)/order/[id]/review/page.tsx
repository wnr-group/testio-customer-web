"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { toast } from "sonner";
import { Loader2, Utensils } from "lucide-react";

const COMMENT_MAX_LENGTH = 500;

interface OrderWithCook {
  id: string;
  order_number: string;
  cook_id: string;
  status: string;
  cook_profiles: {
    kitchen_name: string;
    profile_image_url: string | null;
  } | null;
}

export default function WriteReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderWithCook | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, order_number, cook_id, status, cook_profiles(kitchen_name, profile_image_url)")
        .eq("id", id)
        .single();

      if (orderError || !orderData || orderData.status !== "completed") {
        router.push(`/order/${id}`);
        return;
      }

      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("order_id", id)
        .maybeSingle();

      if (existingReview) {
        router.push(`/order/${id}`);
        return;
      }

      setOrder(orderData as unknown as OrderWithCook);
      setLoading(false);
    }

    loadData();
  }, [id, supabase, router]);

  const handleSubmit = async () => {
    if (!order || !userId) return;
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        order_id: order.id,
        cook_id: order.cook_id,
        customer_id: userId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success("Thanks for your review!");
      router.push(`/order/${id}`);
    } catch (err: any) {
      console.error("Error submitting review:", err);
      toast.error(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] py-12 px-4">
        <div className="mx-auto max-w-md flex flex-col gap-6">
          <Skeleton className="h-6 w-1/2 rounded-md" />
          <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col gap-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-8 w-2/3 rounded-md mx-auto" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const kitchenName = order.cook_profiles?.kitchen_name ?? "Cook";
  const profileImageUrl = order.cook_profiles?.profile_image_url;

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4">
      <div className="mx-auto max-w-md flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#091A36] tracking-tight">Rate Your Order</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Order #{order.order_number}</p>
        </div>

        <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="size-14 relative rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt={kitchenName} fill className="object-cover" sizes="56px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Utensils className="size-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ordering from</p>
              <h2 className="font-bold text-[#091A36] text-sm truncate">{kitchenName}</h2>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-xs font-bold text-slate-500">How was your meal?</p>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="comment" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Add a comment (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
              rows={4}
              placeholder="Tell others what you liked about this cook's food..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-350 focus:outline-none focus:ring-2 focus:ring-[#D61A22]/30 focus:border-[#D61A22] resize-none"
            />
            <span className="text-[10px] font-semibold text-slate-350 self-end">
              {comment.length}/{COMMENT_MAX_LENGTH}
            </span>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl py-5 font-bold text-xs tracking-wider transition-colors h-11 flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>

          <Link
            href={`/order/${id}`}
            className="text-center text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Skip for now
          </Link>
        </Card>
      </div>
    </div>
  );
}
