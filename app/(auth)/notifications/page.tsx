"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import type { Database } from "@/types/database.types";

type NotificationLog = Database["public"]["Tables"]["notification_logs"]["Row"];

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
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (!error && data) {
        setNotifications(data);
      }
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight mb-8">
            Notifications
          </h1>
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
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4 bg-white border border-slate-100/80 rounded-2xl p-8 shadow-sm">
          <div className="p-4 bg-red-50 rounded-full text-[#D61A22]">
            <Bell className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-[#091A36]">No notifications yet</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            We&apos;ll let you know here when there&apos;s something new about your orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight mb-8">
          Notifications
        </h1>

        <div className="flex flex-col gap-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)]"
            >
              <CardContent className="p-5 flex gap-4">
                <div className="p-2.5 h-fit bg-red-50 rounded-full text-[#D61A22] shrink-0">
                  <Bell className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-sm text-[#091A36]">{notification.title}</h3>
                    <span className="text-[11px] text-slate-400 font-semibold shrink-0 whitespace-nowrap">
                      {formatTimestamp(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed mt-1">{notification.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
