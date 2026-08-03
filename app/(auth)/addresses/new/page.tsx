"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PickedLocation } from "@/components/location/LocationPicker";

const LocationPicker = dynamic(() => import("@/components/location/LocationPicker"), {
  ssr: false,
});

const FALLBACK_CENTER = { lat: 20.5937, lng: 78.9629 };

export default function NewAddressPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialCenter, setInitialCenter] = useState(FALLBACK_CENTER);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Use GPS if permission is already granted — avoids an unexpected prompt.
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const permStatus = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          if (permStatus.state === "granted") {
            const geo = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(null),
                { timeout: 5000, maximumAge: 60000 }
              );
            });
            if (geo) {
              setInitialCenter(geo);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Permissions API unsupported — fall through to saved address
        }
      }

      // 2. Fall back to last saved address
      const { data } = await supabase
        .from("customer_addresses")
        .select("lat, lng")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setInitialCenter({ lat: data.lat, lng: data.lng });
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async (picked: PickedLocation) => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { count, error: countError } = await supabase
        .from("customer_addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_deleted", false);
      if (countError) throw countError;

      const makeDefault = picked.isDefault || (count ?? 0) === 0;

      const { error } = await supabase.rpc("set_customer_address", {
        p_address_id: null,
        p_label: picked.label,
        p_address_line: picked.address,
        p_lat: picked.lat,
        p_lng: picked.lng,
        p_is_default: makeDefault,
      });
      if (error) throw error;

      toast.success("Address saved");
      router.push("/addresses");
    } catch (err) {
      console.error("Failed to save address", err);
      toast.error("Couldn't save this address. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] flex items-center justify-center">
        <Loader2 className="size-8 text-[#D61A22] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F8]">
      <LocationPicker
        open
        initialCenter={initialCenter}
        onClose={() => router.push("/addresses")}
        onConfirm={handleConfirm}
        saving={saving}
      />
    </div>
  );
}
