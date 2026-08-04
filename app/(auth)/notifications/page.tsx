"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";

type NotificationLog = Database["public"]["Tables"]["notification_logs"]["Row"];

const PAGE_SIZE = 20;

function formatTimestamp(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // 1. Paginated Query via useQuery (20 per page)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["notifications", page],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: logs, count, error } = await supabase
        .from("notification_logs")
        .select("*", { count: "exact" })
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        notifications: (logs || []) as NotificationLog[],
        totalCount: count || 0,
      };
    },
  });

  useEffect(() => {
    if (isError && error?.message === "Not authenticated") {
      router.push("/login");
    }
  }, [isError, error, router]);

  const notifications = data?.notifications || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // 2. Mark All as Read Mutation via useMutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("notification_logs")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to mark notifications as read");
    },
  });

  // 3. Handle Row Click -> Mark Single as Read & Navigate to Link
  const handleRowClick = async (notification: NotificationLog) => {
    if (!notification.is_read) {
      await supabase
        .from("notification_logs")
        .update({ is_read: true })
        .eq("id", notification.id);

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }

    const targetLink =
      notification.link ||
      (notification.metadata as Record<string, any>)?.link ||
      ((notification.metadata as Record<string, any>)?.order_id
        ? `/order/${(notification.metadata as Record<string, any>).order_id}`
        : null) ||
      notification.body?.match(/\/order\/[a-zA-Z0-9-]+/)?.[0] ||
      "/orders";

    router.push(targetLink);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header with Title & "Mark all as read" Button */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight">
              Notifications
            </h1>
            {totalCount > 0 && (
              <p className="text-xs font-medium text-slate-500 mt-1">
                {totalCount} total {totalCount === 1 ? "notification" : "notifications"}
                {unreadCount > 0 && ` • ${unreadCount} unread`}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0 || notifications.length === 0}
            className="border-slate-200 text-slate-700 hover:text-[#D61A22] hover:border-[#D61A22]/30 rounded-xl text-xs font-semibold"
          >
            <CheckCheck className="size-3.5 mr-1.5 text-[#D61A22]" />
            {markAllReadMutation.isPending ? "Updating..." : "Mark all as read"}
          </Button>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)]"
              >
                <CardContent className="p-5 flex flex-col gap-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="bg-white border border-red-100 rounded-2xl p-6 text-center text-red-600 text-sm font-medium">
            Failed to load notifications. Please try again.
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && notifications.length === 0 && (
          <div className="bg-white border border-slate-100/80 rounded-2xl p-10 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="p-4 bg-red-50 rounded-full text-[#D61A22]">
              <Bell className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-[#091A36]">No notifications yet</h2>
            <p className="text-slate-500 text-xs font-medium max-w-xs leading-relaxed">
              We&apos;ll let you know here when there&apos;s something new about your orders.
            </p>
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && !isError && notifications.length > 0 && (
          <div className="flex flex-col gap-4">
            {notifications.map((notification) => {
              const isUnread = notification.is_read === false;

              return (
                <Card
                  key={notification.id}
                  onClick={() => handleRowClick(notification)}
                  className={`group cursor-pointer transition-all duration-200 border rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 ${
                    isUnread
                      ? "bg-slate-50/80 border-l-4 border-l-[#D61A22] border-slate-200"
                      : "bg-white border-slate-100"
                  }`}
                >
                  <CardContent className="p-5 flex gap-4 items-start">
                    {/* Icon & Unread Dot */}
                    <div className="relative shrink-0">
                      <div
                        className={`p-2.5 rounded-full ${
                          isUnread
                            ? "bg-[#D61A22]/10 text-[#D61A22]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Bell className="size-4" />
                      </div>
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 size-2.5 bg-[#D61A22] rounded-full ring-2 ring-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className={`text-sm tracking-tight ${
                            isUnread ? "font-bold text-[#091A36]" : "font-semibold text-slate-700"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-semibold shrink-0 whitespace-nowrap">
                          {formatTimestamp(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed mt-1">
                        {notification.body}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination Controls (20 per page) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-6 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Previous
                </Button>

                <span className="text-xs font-semibold text-slate-500">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                >
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

