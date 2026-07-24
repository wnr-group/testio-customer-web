"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PickedLocation } from "@/components/location/LocationPicker";
import type { Database } from "@/types/database.types";

const LocationPicker = dynamic(() => import("@/components/location/LocationPicker"), {
  ssr: false,
});

type Address = Database["public"]["Tables"]["customer_addresses"]["Row"];

export default function EditAddressPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<Address | null>(null);
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
        .eq("is_deleted", false)
        .maybeSingle();

      if (error) {
        console.error("Failed to load address", error);
        setNotFound(true);
      } else if (!data) {
        setNotFound(true);
      } else {
        setExisting(data);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

      const { error } = await supabase.rpc("set_customer_address", {
        p_address_id: id,
        p_label: picked.label,
        p_address_line: picked.address,
        p_lat: picked.lat,
        p_lng: picked.lng,
        p_is_default: picked.isDefault,
      });
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

  if (notFound || !existing) {
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
        initialCenter={{ lat: existing.lat, lng: existing.lng }}
        initialLabel={existing.label}
        initialAddress={existing.address_line}
        initialIsDefault={existing.is_default ?? false}
        onClose={() => router.push("/addresses")}
        onConfirm={handleConfirm}
        saving={saving}
      />
    </div>
  );
}
