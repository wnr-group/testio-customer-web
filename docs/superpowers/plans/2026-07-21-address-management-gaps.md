# Address Management Gap-Closing Plan (TES-172) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the functional gaps between the already-shipped `/addresses`, `/addresses/new`, `/addresses/[id]/edit` screens and the TES-172 acceptance criteria, without rewriting the existing UI.

**Architecture:** The three address screens and their shared `LocationPicker` modal (drag-pin + search + label chips) already exist and work. This plan does not rebuild them — it patches three concrete defects: (1) reverse geocoding still calls the deprecated Mapbox `geocoding/v5` endpoint instead of the `search/geocode/v6/reverse` endpoint the ticket requires, (2) there is no way to mark an address as default from the UI, and (3) editing an address resets its label and re-geocodes its address text instead of showing the saved values.

**Tech Stack:** Next.js 16 App Router, Supabase JS client (`lib/supabase/client.ts`), Mapbox GL JS + Mapbox Geocoding API, no test framework (see Global Constraints).

## Global Constraints

- No test runner is configured in this repo (`package.json` has no `test` script, no jest/vitest/playwright dependency). Adding one is out of scope for this bug-fix plan. Verification steps in each task use `npx tsc --noEmit`, `npm run lint`, and manual browser checks against `npm run dev` instead of automated tests.
- `NEXT_PUBLIC_MAPBOX_TOKEN` must already be set in `.env.local` — both the map and geocoding calls depend on it (pre-existing requirement, unchanged by this plan).
- At most one row in `customer_addresses` may have `is_default = true` per `user_id` at any time. There is no DB constraint enforcing this — it must be maintained by application code (Tasks 2 and 3).
- Only the reverse-geocoding call (`reverseGeocode` in `lib/utils.ts`) moves to Mapbox v6, per the ticket's explicit note. The forward-search call (`searchPlaces`, used by the "Search area, locality, landmark…" box) stays on v5 — the ticket does not ask for it, and migrating it is out of scope.
- The existing custom modal (`LocationPicker`), inline label chips, and hand-rolled "Default" badge stay as-is. Do not introduce `components/ui/dialog.tsx`, swap the badge markup for `<Badge>`, or convert the address text into an editable `<Input>` — the user explicitly scoped this plan to functional gaps only, not a shadcn-primitive rewrite.
- Two literal acceptance criteria from the ticket are consciously left unaddressed by this plan as a result of that scoping decision: the address field stays read-only display text (not an editable `<Input>`), and the save/cancel buttons keep their current "Confirm location" / ✕-icon-close styling rather than becoming literal "Save Address" / "Cancel" ghost buttons. The empty-state copy also keeps its current wording rather than matching the ticket's exact string. None of these affect functionality.
- No `Co-Authored-By` trailer on commits (`.claude/settings.json` has no `attribution.commit` set).

---

### Task 1: Migrate reverse geocoding to Mapbox Geocoding v6

**Files:**
- Modify: `lib/utils.ts:42-92` (the `reverseGeocode` function only — leave `searchPlaces` and the Nominatim fallback untouched)

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` (existing env var, already read elsewhere in this file)
- Produces: `reverseGeocode(lat: number, lng: number): Promise<string | null>` — signature is unchanged, so the caller at `components/location/LocationPicker.tsx:63` (`const a = await reverseGeocode(lat, lng)`) needs no changes

- [ ] **Step 1: Replace the Mapbox branch of `reverseGeocode` with the v6 reverse endpoint**

Replace the current implementation:

```ts
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (mapboxToken) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name;
        }
      }
    } catch (error) {
      console.error("Mapbox geocoding error:", error);
    }
  }
```

with:

```ts
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (mapboxToken) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&access_token=${mapboxToken}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.features) && data.features.length > 0) {
          const props = data.features[0].properties;
          return props?.full_address || props?.place_formatted || props?.name || null;
        }
      }
    } catch (error) {
      console.error("Mapbox geocoding error:", error);
    }
  }
```

Everything below this block (the Nominatim fallback and the closing `return null;`) stays exactly as it is today — do not touch it.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual verification against the live Mapbox API**

Run: `npm run dev`

1. Open `http://localhost:3000/addresses/new` in a browser.
2. Open DevTools → Network tab, filter for `mapbox`.
3. Wait for the map to load, then drag the red pin to a new spot (or click elsewhere on the map).
4. Confirm a request fires to a URL starting with `https://api.mapbox.com/search/geocode/v6/reverse?longitude=` and returns HTTP 200.
5. Confirm **no** request fires to `https://api.mapbox.com/geocoding/v5/mapbox.places/...` for this pin-drop (v5 should only appear, if at all, for the separate search box — untouched by this task).
6. Confirm the address text under the map updates to a real place name (e.g. "MG Road, Bengaluru, Karnataka 560001, India"), not raw coordinates and not stuck on "Locating…".

- [ ] **Step 4: Commit**

```bash
git add lib/utils.ts
git commit -m "fix: migrate reverse geocoding to Mapbox v6 endpoint"
```

---

### Task 2: Add "Set as default" checkbox and edit-mode prefill support to LocationPicker; wire into New Address page

**Files:**
- Modify: `components/location/LocationPicker.tsx` (full file — adds new optional props, new state, new checkbox UI, and skips the on-open geocode when an address is prefilled)
- Modify: `app/(auth)/addresses/new/page.tsx:76-110` (`handleConfirm`)

**Interfaces:**
- Consumes: nothing new
- Produces:
  - `PickedLocation` gains a required `isDefault: boolean` field — Task 3's edit page consumes this.
  - `LocationPicker`'s `Props` gains three new **optional** fields: `initialLabel?: string`, `initialAddress?: string`, `initialIsDefault?: boolean`. Omitting them (as the New Address page will) preserves today's "new address" behavior exactly. Task 3's edit page will pass all three.

- [ ] **Step 1: Extend `PickedLocation` and `Props` in `components/location/LocationPicker.tsx`**

Replace:

```ts
export type PickedLocation = {
  lat: number
  lng: number
  label: string // "Home" | "Work" | "Other"
  address: string // human-readable place name
}

type Props = {
  open: boolean
  initialCenter: { lat: number; lng: number } // where the map opens (viewport only)
  onClose: () => void
  onConfirm: (loc: PickedLocation) => void
  saving?: boolean
}
```

with:

```ts
export type PickedLocation = {
  lat: number
  lng: number
  label: string // "Home" | "Work" | "Other"
  address: string // human-readable place name
  isDefault: boolean
}

type Props = {
  open: boolean
  initialCenter: { lat: number; lng: number } // where the map opens (viewport only)
  initialLabel?: string // prefill for edit mode; omit for the "new address" flow
  initialAddress?: string // prefill for edit mode — skips the on-open reverse geocode
  initialIsDefault?: boolean // prefill for edit mode
  onClose: () => void
  onConfirm: (loc: PickedLocation) => void
  saving?: boolean
}
```

- [ ] **Step 2: Initialize state from the new props**

Replace:

```ts
export default function LocationPicker({ open, initialCenter, onClose, onConfirm, saving }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [coords, setCoords] = useState(initialCenter)
  const [address, setAddress] = useState('')
  const [label, setLabel] = useState('Home')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [geocoding, setGeocoding] = useState(false)
```

with:

```ts
export default function LocationPicker({
  open,
  initialCenter,
  initialLabel,
  initialAddress,
  initialIsDefault,
  onClose,
  onConfirm,
  saving,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [coords, setCoords] = useState(initialCenter)
  const [address, setAddress] = useState(initialAddress ?? '')
  const [label, setLabel] = useState(initialLabel ?? 'Home')
  const [isDefault, setIsDefault] = useState(initialIsDefault ?? false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [geocoding, setGeocoding] = useState(false)
```

- [ ] **Step 3: Skip the on-open reverse geocode when an address was prefilled**

In the mount `useEffect`, replace the line:

```ts
    void updateFromLngLat(initialCenter.lng, initialCenter.lat)
```

with:

```ts
    // Edit mode already has a saved address_line for these coordinates —
    // skip the reverse-geocode round trip so it isn't overwritten on open.
    if (!initialAddress) {
      void updateFromLngLat(initialCenter.lng, initialCenter.lat)
    }
```

- [ ] **Step 4: Add the "Set as default" checkbox and pass `isDefault` to `onConfirm`**

Replace the label-chips-and-confirm block:

```tsx
        {/* Label chips */}
        <div className="px-5 pt-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Save as</p>
          <div className="flex gap-2">
            {LABELS.map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  label === l
                    ? 'bg-[#E8202A] text-white border-[#E8202A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm */}
        <div className="px-5 py-4 mt-2">
          <Button
            onClick={() => onConfirm({ lat: coords.lat, lng: coords.lng, label, address })}
            disabled={!address || geocoding || saving}
            className="w-full bg-[#E8202A] hover:bg-[#c71821] text-white rounded-xl h-11 font-bold"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'Confirm location'}
          </Button>
        </div>
```

with:

```tsx
        {/* Label chips */}
        <div className="px-5 pt-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Save as</p>
          <div className="flex gap-2">
            {LABELS.map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  label === l
                    ? 'bg-[#E8202A] text-white border-[#E8202A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Default toggle */}
        <div className="px-5 pt-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="size-4 rounded border-slate-300 text-[#E8202A] focus:ring-[#E8202A]"
            />
            Set as default
          </label>
        </div>

        {/* Confirm */}
        <div className="px-5 py-4 mt-2">
          <Button
            onClick={() => onConfirm({ lat: coords.lat, lng: coords.lng, label, address, isDefault })}
            disabled={!address || geocoding || saving}
            className="w-full bg-[#E8202A] hover:bg-[#c71821] text-white rounded-xl h-11 font-bold"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'Confirm location'}
          </Button>
        </div>
```

- [ ] **Step 5: Wire the New Address page to enforce the single-default invariant**

In `app/(auth)/addresses/new/page.tsx`, replace `handleConfirm`:

```ts
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

      const { count } = await supabase
        .from("customer_addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { error } = await supabase.from("customer_addresses").insert({
        user_id: user.id,
        label: picked.label,
        address_line: picked.address,
        lat: picked.lat,
        lng: picked.lng,
        is_default: (count ?? 0) === 0,
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
```

with:

```ts
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

      const { count } = await supabase
        .from("customer_addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      // First address is always default; later ones only if the user checked the box.
      const makeDefault = picked.isDefault || (count ?? 0) === 0;

      if (makeDefault) {
        const { error: clearError } = await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
        if (clearError) throw clearError;
      }

      const { error } = await supabase.from("customer_addresses").insert({
        user_id: user.id,
        label: picked.label,
        address_line: picked.address,
        lat: picked.lat,
        lng: picked.lng,
        is_default: makeDefault,
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
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. (`LocationPicker` is used without the new optional props in `new/page.tsx`, which is valid since they're all optional.)

- [ ] **Step 7: Manual verification**

Run: `npm run dev`

1. Ensure the test account already has at least one saved address (create one via `/addresses/new` first if needed — it will become default automatically).
2. Go to `http://localhost:3000/addresses/new`, place a pin, pick a label, check **"Set as default"**, save.
3. Go to `http://localhost:3000/addresses` — confirm the newly created address shows the "Default" badge, and the address that was previously default no longer shows it.
4. Repeat without checking "Set as default" — confirm the new address is saved as non-default and the existing default is unchanged.

- [ ] **Step 8: Commit**

```bash
git add components/location/LocationPicker.tsx "app/(auth)/addresses/new/page.tsx"
git commit -m "feat: add default-address checkbox and single-default invariant"
```

---

### Task 3: Prefill label, address, and default status when editing an address

**Files:**
- Modify: `app/(auth)/addresses/[id]/edit/page.tsx` (full file)

**Interfaces:**
- Consumes: `LocationPicker`'s `initialLabel` / `initialAddress` / `initialIsDefault` props and the `isDefault` field on `PickedLocation`, both added in Task 2.
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Track the full existing row instead of just `lat`/`lng`, and pass prefill props to `LocationPicker`**

Replace the entire contents of `app/(auth)/addresses/[id]/edit/page.tsx`:

```tsx
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
        .maybeSingle();

      if (error || !data) {
        console.error("Failed to load address", error);
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

      if (picked.isDefault) {
        const { error: clearError } = await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
        if (clearError) throw clearError;
      }

      const { error } = await supabase
        .from("customer_addresses")
        .update({
          label: picked.label,
          address_line: picked.address,
          lat: picked.lat,
          lng: picked.lng,
          is_default: picked.isDefault,
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
```

Note what changed from the original: the `initialCenter` state was replaced by an `existing: Address | null` state holding the full row (the `.select("*")` query already fetched it — only the code that reads the response changed), `handleConfirm` now re-fetches the user to scope the "clear other defaults" update, and `LocationPicker` receives the three new prefill props.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`

1. From `http://localhost:3000/addresses`, click **Edit** on a "Work" (or any non-default, non-"Home") address.
2. Confirm the picker opens with:
   - The **"Work"** pill already selected (not reset to "Home").
   - The address text already showing the saved `address_line` immediately, with no "Locating…" flash and no network request to the reverse-geocode endpoint on open.
   - The **"Set as default"** checkbox matching the address's current default status.
3. Drag the pin to a new spot — confirm the address text updates via reverse geocode as normal (this still works; only the *initial* geocode is skipped).
4. Check "Set as default", save.
5. On `/addresses`, confirm this address now shows the "Default" badge and no other address does.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/addresses/[id]/edit/page.tsx"
git commit -m "fix: prefill label, address, and default status in edit mode"
```
