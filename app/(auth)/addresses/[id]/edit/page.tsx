"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PickedLocation } from "@/components/location/LocationPicker";

const LocationPicker = dynamic(() => import("@/components/location/LocationPicker"), {
  ssr: false,
});

export default function EditAddressPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        console.error("Failed to load address", error);
        setNotFound(true);
      } else {
        setInitialCenter({ lat: data.lat, lng: data.lng });
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirm = async (picked: PickedLocation) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("customer_addresses")
        .update({
          label: picked.label,
          address_line: picked.address,
          lat: picked.lat,
          lng: picked.lng,
        })
        .eq("id", id);
      if (error) throw error;

      toast.success("Address updated");
      router.push("/addresses");
    } catch (err) {
      console.error("Failed to update address", err);
      toast.error("Couldn't update this address. Try again.");
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

  if (notFound || !initialCenter) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#091A36]">Address not found</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            This address may have been removed already.
          </p>
          <button
            onClick={() => router.push("/addresses")}
            className="text-xs font-bold text-[#D61A22] hover:underline mt-1"
          >
            Back to Saved Addresses
          </button>
        </div>
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
