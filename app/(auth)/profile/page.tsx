"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  MapPin,
  Bell,
  LogOut,
  Loader2,
  Coins,
  Copy,
  Check,
  Phone,
  ChevronRight,
} from "lucide-react";

type ProfileRow = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  coin_balance: number;
  referral_code: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, name, phone, email, avatar_url, coin_balance, referral_code")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load your profile");
        setLoading(false);
        return;
      }

      setProfile(data);
      setName(data.name ?? "");
      setEmail(data.email ?? "");
      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleSave = async () => {
    if (!profile) return;
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ name: name.trim(), email: email.trim() || null })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, name: name.trim(), email: email.trim() || null });
      toast.success("Profile updated");
    } catch (err: any) {
      console.error("Error saving profile:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyReferral = async () => {
    if (!profile?.referral_code) return;
    try {
      await navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      toast.success("Referral code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy code");
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err: any) {
      console.error("Error signing out:", err);
      toast.error("Failed to log out");
      setSigningOut(false);
    }
  };

  const initials = (name || profile?.name || "U")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const dirty =
    !!profile && (name.trim() !== (profile.name ?? "") || email.trim() !== (profile.email ?? ""));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
        <div className="mx-auto max-w-2xl flex flex-col gap-6 animate-pulse">
          <Skeleton className="h-8 w-40 rounded-md" />
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4">
            <Skeleton className="size-20 rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4 bg-white border border-slate-100/80 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#091A36]">Couldn&apos;t load profile</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Something went wrong while fetching your account details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight">My Profile</h1>

        <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-20" size="lg">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.name ?? "Profile"} />
              ) : null}
              <AvatarFallback className="bg-[#D61A22]/10 text-[#D61A22] text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-lg font-bold text-[#091A36] truncate">
                {profile.name || "Add your name"}
              </p>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mt-1">
                <Phone className="size-3.5" />
                <span>{profile.phone}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-10 rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Phone
              </Label>
              <Input
                value={profile.phone}
                disabled
                className="h-10 rounded-xl border-slate-200 text-sm bg-slate-50 text-slate-500"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs tracking-wider h-10 flex items-center justify-center gap-1.5 mt-1 disabled:opacity-40"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </Card>

        <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#F5A623]/10 text-[#C29B38]">
                <Coins className="size-5" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#091A36] leading-tight">
                  {profile.coin_balance}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  TESTIO Coins
                </p>
              </div>
            </div>
          </div>

          {profile.referral_code && (
            <>
              <Separator className="bg-slate-100" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Referral Code
                  </p>
                  <p className="text-sm font-extrabold text-[#091A36] tracking-widest">
                    {profile.referral_code}
                  </p>
                </div>
                <Button
                  onClick={handleCopyReferral}
                  variant="outline"
                  className="rounded-xl border-slate-200 font-bold text-xs h-9 shrink-0 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
          <Link
            href="/addresses"
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-700">Saved Addresses</span>
            </div>
            <ChevronRight className="size-4 text-slate-300" />
          </Link>
          <Separator className="bg-slate-100" />
          <Link
            href="/notifications"
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="size-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-700">Notifications</span>
            </div>
            <ChevronRight className="size-4 text-slate-300" />
          </Link>
        </Card>

        <Button
          onClick={handleLogout}
          disabled={signingOut}
          variant="outline"
          className="w-full rounded-xl border-slate-200 text-[#D61A22] hover:bg-red-50 hover:text-[#D61A22] font-bold text-xs tracking-wider h-10 flex items-center justify-center gap-1.5"
        >
          {signingOut ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Logging out...
            </>
          ) : (
            <>
              <LogOut className="size-3.5" /> Log Out
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
