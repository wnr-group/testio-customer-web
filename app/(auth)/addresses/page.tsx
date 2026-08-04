"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Home, Briefcase, MapPin, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import type { Database } from "@/types/database.types";

type Address = Database["public"]["Tables"]["customer_addresses"]["Row"];

function labelIcon(label: string) {
  if (label === "Home") return Home;
  if (label === "Work") return Briefcase;
  return MapPin;
}

export default function AddressesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("is_default", { ascending: false });

      if (error) {
        console.error("Failed to load addresses", error);
        toast.error("Couldn't load your saved addresses.");
      } else {
        setAddresses(data || []);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("customer_addresses")
        .update({ is_deleted: true })
        .eq("id", deleteTarget.id);
      if (error) throw error;

      const remaining = addresses.filter((a) => a.id !== deleteTarget.id);
      if (deleteTarget.is_default && remaining.length > 0) {
        const { error: promoteError } = await supabase
          .from("customer_addresses")
          .update({ is_default: true })
          .eq("id", remaining[0].id);
        if (!promoteError) {
          remaining[0] = { ...remaining[0], is_default: true };
        }
      }

      setAddresses(remaining);
      toast.success("Address deleted");
    } catch (err) {
      console.error("Failed to delete address", err);
      toast.error("Couldn't delete this address. Try again.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight">Saved Addresses</h1>
          {!loading && addresses.length > 0 && (
            <Link href="/addresses/new">
              <Button className="bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs tracking-wider uppercase h-10 gap-1.5">
                <Plus className="size-4" />
                Add New
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center flex flex-col items-center gap-4 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-10">
            <div className="p-4 bg-red-50 rounded-full text-[#D61A22]">
              <MapPin className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-[#091A36]">No saved addresses yet</h2>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-xs">
              Add an address so we know where to deliver your home-cooked meals.
            </p>
            <Link href="/addresses/new" className="w-full max-w-xs mt-2">
              <Button className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs tracking-wider uppercase h-10 gap-1.5">
                <Plus className="size-4" />
                Add Address
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {addresses.map((addr) => {
              const Icon = labelIcon(addr.label);
              return (
                <div
                  key={addr.id}
                  className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-5 flex items-start gap-4"
                >
                  <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500 shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{addr.label}</p>
                      {addr.is_default && (
                        <span className="bg-slate-100 text-slate-400 font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs font-semibold mt-1 leading-relaxed break-words">
                      {addr.address_line}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => router.push(`/addresses/${addr.id}/edit`)}
                      aria-label={`Edit ${addr.label} address`}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(addr)}
                      aria-label={`Delete ${addr.label} address`}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#D61A22] hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-slate-900 text-base">Delete this address?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              &ldquo;{deleteTarget.label}&rdquo; — {deleteTarget.address_line} will be removed from your saved addresses.
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl font-bold text-xs tracking-wider uppercase h-10 border-slate-200 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs tracking-wider uppercase h-10"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
