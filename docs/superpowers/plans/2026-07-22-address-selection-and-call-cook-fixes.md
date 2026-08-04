# Address Selection & Call Cook Enablement — PR Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two PR review comments on branch `feat/tes-171-tes-172-call-cook-address-management`: (1) the Home page's "Change Address" flow always creates a brand-new `customer_addresses` row instead of letting the customer pick one they already saved, and (2) the Cook Profile page's "Call Cook" button is a hardcoded disabled placeholder with no phone number wired to it at all.

**Architecture:** For the address bug, add an optional "saved addresses" chooser list to the existing `LocationPicker` modal (rendered only when the caller passes saved addresses) and wire the Home page to fetch the customer's addresses and let them tap one directly — updating only local map/location state, no `insert`. The existing pin-drop/search "Add New Address" flow underneath stays byte-for-byte unchanged. For the Call Cook bug, add a `get_cook_phone(p_cook_id uuid)` `SECURITY DEFINER` Postgres RPC (mirroring the existing `get_order_cook_phone` pattern already shipped on the Order Detail page) and wire the Cook Profile page to call it and render a live `tel:` link, following the exact three-state (loading / available / unavailable) pattern already proven on `app/(auth)/order/[id]/page.tsx`.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@supabase/ssr` browser client, Tailwind v4 + `class-variance-authority` (`components/ui/button.tsx`), Postgres/Supabase (SQL editor — this repo has no `supabase/` migrations directory), Mapbox GL JS (`components/location/LocationPicker.tsx`, unaffected).

## Global Constraints

- Do not touch `app/(auth)/checkout/page.tsx`'s address selection — it already lets the customer pick from a `radiogroup` of saved addresses correctly (confirmed by reading the file; no bug there). Out of scope.
- Do not touch `app/(auth)/addresses/new/page.tsx` or `app/(auth)/addresses/[id]/edit/page.tsx` — their `LocationPicker` usage (full-page pin-drop for creating/editing exactly one address, with the single-default invariant from the 2026-07-21 TES-172 plan) must keep working exactly as-is. The new `LocationPicker` props added here are optional and unused by these two pages, so their behavior does not change.
- Do not touch `app/(auth)/order/[id]/page.tsx` — its Call Cook button already works (shipped in commit `9571554` via the `get_order_cook_phone` RPC). Confirmed by reading the file: `cookPhone`/`cookPhoneLoading` state and the three-state button render are already present. Out of scope.
- Do not reintroduce Exotel/masked-calling code. No `masked_calls`/`exotel_sid` schema changes (unused table, confirmed via `types/database.types.ts:640-694` per the 2026-07-21 plan's search).
- No `supabase/` directory exists in this repo — the one backend change (the `get_cook_phone` RPC) ships as a manual SQL step run in the Supabase SQL Editor, same as the existing `get_order_cook_phone` RPC.
- This repo has no test runner (no jest/vitest/playwright) and no `npm run typecheck` script. Verification uses `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manual browser QA.
- No `Co-Authored-By` trailer on commits (`.claude/settings.json` has no `attribution.commit` set).
- `/cook/[id]` is a public route (not in `proxy.ts`'s `PROTECTED_PATHS`) — the Cook Profile page already renders kitchen name, images, ratings, and address text to unauthenticated visitors today. The phone RPC follows that same existing public-visibility model; this is not a new exposure being introduced by this plan, just extending what's already shown.

---

## Root Cause Analysis

### Issue 1 — "Change Address" always creates a new address

**Current flow:**

```
Home page (app/(auth)/home/page.tsx)
  → "Change" pill button / "Change location" / "Choose location" buttons
  → setPickerOpen(true)
  → <LocationPicker> opens (components/location/LocationPicker.tsx)
      - NO list of saved addresses anywhere in this component
      - only: search box, draggable map pin, label chips (Home/Work/Other), "Set as default" checkbox
  → user drags pin / searches → clicks "Confirm location"
  → onConfirm = handlePickLocation (home/page.tsx:132)
      → ALWAYS calls supabase.from("customer_addresses").insert({...})
  → setLocation(...) used for map center / nearby-cook search radius only
```

There is no code path in this modal that reads the customer's existing `customer_addresses` rows and lets them pick one — every single "change address" action inserts a new row, regardless of whether the customer already has a saved address for that exact spot. This matches the review comment exactly: *"it always adds a new address... does not give an option to select the existing address."*

Two other flows use the **same** `LocationPicker` component but are correctly out of scope:
- `app/(auth)/addresses/new/page.tsx` — dedicated "add a new address" page. Always-insert is *correct* behavior here.
- `app/(auth)/addresses/[id]/edit/page.tsx` — dedicated "edit this one address" page. Always-update-this-row is *correct* behavior here.
- `app/(auth)/checkout/page.tsx` — does **not** use `LocationPicker` at all. It already renders a `radiogroup` of the customer's saved `customer_addresses` rows and lets them select one via `setDeliveryAddressId(addr.id)` (home/page.tsx:412-454 equivalent in checkout — no insert on selection). No bug here.

So the only place the reported bug exists is the Home page's delivery-location changer, because it's the only caller that (a) opens `LocationPicker` as a "change my delivery spot" action rather than "create/edit one specific address", and (b) never offers the customer's existing saved list.

**Expected flow (per the review comment):**

```
Open "Change Address" → show saved addresses (if any) → tap one → update Home's location state (no DB write) → close
                                            OR
                       → "Add new address" (existing pin-drop/search) → Confirm → insert (unchanged) → close
```

**Root cause:** `LocationPicker` has no saved-address list/selection mode, and its only caller that represents a "change delivery address" action (`app/(auth)/home/page.tsx`) never fetches or offers the customer's existing addresses before falling through to the always-insert pin-drop flow.

### Issue 2 — Cook Profile page's Call Cook button

**Current flow:**

```
app/(browse)/cook/[id]/page.tsx
  → fetches cook_profiles row only (no phone field on this table — confirmed via types/database.types.ts:302-330)
  → renders:
      <button disabled title="Masked calling is not available on web yet">
        <PhoneOff /> Call Cook
      </button>
  → no click handler, no href, no phone data fetched at all
```

`cook_profiles` has no phone column. The FK chain to the real number is `cook_profiles.user_id → users.id → users.phone` (confirmed via `types/database.types.ts:302-330` and `:1087-1102`) — identical to the chain already used by the Order Detail page's `get_order_cook_phone(p_order_id)` RPC (see `docs/superpowers/plans/2026-07-21-call-cook-real-phone.md`), except that RPC is keyed by `order_id` and checks `orders.customer_id = auth.uid()` — it cannot be reused here because there is no order in this context, only a `cook_id` from the URL.

**Root cause:** The button is a static placeholder with no data source and no click behavior — never wired up in the first place. There is no phone number fetched, no RPC call, and the button is unconditionally `disabled`.

**Expected flow:**

```
button → (already has cook_id from useParams) → RPC get_cook_phone(cook_id) → tel: link → browser dialer
```

---

## Task 1: Create the `get_cook_phone` Supabase RPC

**Files:**
- None in this repo (no `supabase/` directory exists). This is a manual step run in the Supabase SQL Editor by whoever has project access — same delivery mechanism already used for `get_order_cook_phone`.

**Interfaces:**
- Produces: a Postgres function `public.get_cook_phone(p_cook_id uuid) returns text`, callable from the browser via `supabase.rpc("get_cook_phone", { p_cook_id: string })`, returning the cook's phone as a string, or `null` if the cook doesn't exist or has no phone on their linked `users` row.

- [ ] **Step 1: Run the function-creation SQL in the Supabase SQL Editor**

```sql
create or replace function public.get_cook_phone(p_cook_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  select u.phone
  into v_phone
  from public.cook_profiles cp
  join public.users u on u.id = cp.user_id
  where cp.id = p_cook_id;

  return v_phone;
end;
$$;

revoke all on function public.get_cook_phone(uuid) from public;
grant execute on function public.get_cook_phone(uuid) to anon, authenticated;
```

Expected: `CREATE FUNCTION` / `REVOKE` / `GRANT` all succeed with no errors.

Note: `grant ... to anon` (not just `authenticated`) is intentional and matches the page's existing public-visibility model — `/cook/[id]` renders kitchen name, images, and address to unauthenticated visitors today with no login gate, so the phone follows the same access level. To prevent bulk scraping of phone numbers, this endpoint relies on Supabase's global edge network rate limiting and Web Application Firewall (WAF) rules which throttle anomalous anonymous request volumes. If a login gate is later added to `/cook/[id]`, this grant should be revisited then — but that is a separate, unrequested change and out of scope here.

- [ ] **Step 2: Verify the function is registered with the correct security mode**

```sql
select proname, prosecdef
from pg_proc
where proname = 'get_cook_phone';
```

Expected: one row, `prosecdef = true`.

- [ ] **Step 3: Verify it returns a real number for a real cook**

Pick a real `cook_profiles.id` whose linked `users.phone` is set:

```sql
select public.get_cook_phone('<real-cook-id>');
```

Expected: returns the phone number as text (not null).

Then verify the null-safe case with a random/nonexistent id:

```sql
select public.get_cook_phone('00000000-0000-0000-0000-000000000000');
```

Expected: returns `null`, no error thrown.

- [ ] **Step 4: Confirm the change is live**

Supabase SQL Editor changes apply immediately — no separate deploy step. Record the cook id used in Step 3 for reuse in Task 4's manual QA.

---

## Task 2: Wire the real phone number into the Cook Profile page

**Files:**
- Modify: `app/(browse)/cook/[id]/page.tsx`

**Interfaces:**
- Consumes: `supabase.rpc("get_cook_phone", { p_cook_id: string })` from Task 1, returning `{ data: string | null, error: PostgrestError | null }`.
- Produces: no new exports — this is a leaf page component.

- [ ] **Step 1: Update icon and Button imports**

Replace (current lines 7, 12-21):

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import {
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  Utensils,
  PhoneOff,
  Frown,
  BookOpen,
} from "lucide-react";
```

with:

```tsx
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Phone,
  Frown,
  BookOpen,
} from "lucide-react";
```

- [ ] **Step 2: Add state for the cook's phone**

Replace (current lines 43-45):

```tsx
  const [cook, setCook] = useState<CookProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
```

with:

```tsx
  const [cook, setCook] = useState<CookProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cookPhone, setCookPhone] = useState<string | null>(null);
  const [cookPhoneLoading, setCookPhoneLoading] = useState(true);
```

- [ ] **Step 3: Fetch the phone number in the existing `fetchCook` effect**

Replace (current lines 47-68):

```tsx
  useEffect(() => {
    async function fetchCook() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("cook_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCook(data);
      setLoading(false);
    }
    fetchCook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
```

with:

```tsx
  useEffect(() => {
    async function fetchCook() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("cook_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCook(data);
      setLoading(false);

      // Runs independently of the main load flow — the button has its own
      // cookPhoneLoading state, so this never blocks the page skeleton.
      supabase
        .rpc("get_cook_phone", { p_cook_id: id })
        .then(({ data: phoneData, error: phoneError }) => {
          if (phoneError) {
            console.error("Fetch cook phone error:", phoneError);
          }
          setCookPhone(typeof phoneData === "string" && phoneData.trim() ? phoneData : null);
          setCookPhoneLoading(false);
        });
    }
    fetchCook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
```

- [ ] **Step 4: Replace the disabled Call Cook button with the live/fallback states**

Replace (current lines 204-211):

```tsx
            <button
              disabled
              title="Masked calling is not available on web yet"
              className="w-full lg:w-fit inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs tracking-wider uppercase px-5 h-10 cursor-not-allowed"
            >
              <PhoneOff className="size-3.5" />
              Call Cook
            </button>
```

with:

```tsx
            {cookPhoneLoading ? (
              <button
                disabled
                className="w-full lg:w-fit inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs tracking-wider uppercase px-5 h-10 cursor-not-allowed"
              >
                <Phone className="size-3.5" />
                Call Cook
              </button>
            ) : cookPhone ? (
              <a
                href={`tel:${cookPhone}`}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full lg:w-fit bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl gap-2 font-bold text-xs tracking-wider uppercase px-5 h-10"
                )}
              >
                <Phone className="size-3.5" />
                Call Cook
              </a>
            ) : (
              <button
                disabled
                title="Phone unavailable"
                className="w-full lg:w-fit inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs tracking-wider uppercase px-5 h-10 cursor-not-allowed"
              >
                <Phone className="size-3.5" />
                Phone unavailable
              </button>
            )}
```

- [ ] **Step 5: Type-check the change**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Lint the change**

Run: `npm run lint`
Expected: no new warnings/errors in `app/(browse)/cook/[id]/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git add "app/(browse)/cook/[id]/page.tsx"
git commit -m "feat: enable Call Cook button on cook profile page"
```

---

## Task 3: Add saved-address selection to the Home page's Change Address flow

**Files:**
- Modify: `components/location/LocationPicker.tsx`
- Modify: `app/(auth)/home/page.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `LocationPicker` exports a new type `SavedAddress = { id: string; label: string; address_line: string; lat: number; lng: number }`.
  - `LocationPicker`'s `Props` gains two new **optional** fields: `savedAddresses?: SavedAddress[]` and `onSelectSaved?: (addr: SavedAddress) => void`. Omitting them (as `addresses/new/page.tsx` and `addresses/[id]/edit/page.tsx` already do) renders no saved-address section and preserves their exact current behavior.

- [ ] **Step 1: Extend types and Props in `components/location/LocationPicker.tsx`**

Replace (current lines 13-30):

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
  onClose: () => void
  onConfirm: (loc: PickedLocation) => void
  saving?: boolean
  initialLabel?: string
  initialAddress?: string
  initialIsDefault?: boolean
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

export type SavedAddress = {
  id: string
  label: string
  address_line: string
  lat: number
  lng: number
}

type Props = {
  open: boolean
  initialCenter: { lat: number; lng: number } // where the map opens (viewport only)
  onClose: () => void
  onConfirm: (loc: PickedLocation) => void
  saving?: boolean
  initialLabel?: string
  initialAddress?: string
  initialIsDefault?: boolean
  savedAddresses?: SavedAddress[] // when non-empty, shows a "pick an existing address" list before the map
  onSelectSaved?: (addr: SavedAddress) => void // called instead of onConfirm — no DB write
}
```

- [ ] **Step 2: Destructure the new props**

Replace (current line 34):

```ts
export default function LocationPicker({ open, initialCenter, onClose, onConfirm, saving, initialLabel, initialAddress, initialIsDefault }: Props) {
```

with:

```ts
export default function LocationPicker({
  open,
  initialCenter,
  onClose,
  onConfirm,
  saving,
  initialLabel,
  initialAddress,
  initialIsDefault,
  savedAddresses,
  onSelectSaved,
}: Props) {
```

- [ ] **Step 3: Render the saved-address list between the header and the search box**

Replace (current lines 134-136):

```tsx
        {/* Search */}
        <div className="px-5 pt-4 relative">
```

with:

```tsx
        {/* Saved addresses — pick one instead of dropping a new pin */}
        {savedAddresses && savedAddresses.length > 0 && (
          <div className="px-5 pt-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500">Saved addresses</p>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => onSelectSaved?.(addr)}
                  className="w-full text-left flex items-start gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 transition-colors"
                >
                  <MapPin className="size-4 text-[#E8202A] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">{addr.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{addr.address_line}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-500 pt-1">Or add a new address</p>
          </div>
        )}

        {/* Search */}
        <div className="px-5 pt-4 relative">
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. (`addresses/new/page.tsx` and `addresses/[id]/edit/page.tsx` don't pass the two new optional props — this is valid TypeScript and renders no saved-address section for them.)

- [ ] **Step 5: Wire the Home page to fetch saved addresses and offer selection**

In `app/(auth)/home/page.tsx`, replace the import (current line 20):

```tsx
import type { PickedLocation } from "@/components/location/LocationPicker";
```

with:

```tsx
import type { PickedLocation, SavedAddress } from "@/components/location/LocationPicker";
```

- [ ] **Step 6: Add saved-addresses state**

Replace (current lines 50-52):

```tsx
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const autoOpenedRef = useRef(false);
```

with:

```tsx
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const autoOpenedRef = useRef(false);
```

- [ ] **Step 7: Fetch saved addresses each time the picker opens**

Replace (current lines 66-71):

```tsx
  // Open the picker once when we can't resolve any location. If the user
  // dismisses it, we don't force it back open — they get a prompt to reopen.
  useEffect(() => {
    if (status === "needs-picker" && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setPickerOpen(true);
    }
  }, [status]);
```

with:

```tsx
  // Open the picker once when we can't resolve any location. If the user
  // dismisses it, we don't force it back open — they get a prompt to reopen.
  useEffect(() => {
    if (status === "needs-picker" && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setPickerOpen(true);
    }
  }, [status]);

  // Load the customer's saved addresses each time the picker opens, so they
  // can pick an existing one instead of always dropping a new pin.
  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("id, label, address_line, lat, lng")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (error) {
        console.error("Failed to load saved addresses", error);
        return;
      }
      if (!cancelled) setSavedAddresses((data as SavedAddress[]) || []);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen]);
```

- [ ] **Step 8: Add the selection handler**

Locate the end of `handlePickLocation` (current lines 132-166, ending with):

```tsx
      setSavingAddr(false);
      setLocation({
        lat: picked.lat,
        lng: picked.lng,
        label: picked.address || picked.label,
        source: "picked",
      });
      setPickerOpen(false);
    }
  };
```

Insert immediately after that closing `};` of `handlePickLocation`:

```tsx

  // Use an already-saved address for this session — updates local state
  // only, unlike handlePickLocation above, which always inserts a new row.
  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setLocation({
      lat: addr.lat,
      lng: addr.lng,
      label: addr.address_line || addr.label,
      source: "saved",
    });
    setPickerOpen(false);
  };
```

- [ ] **Step 9: Pass the new props to `<LocationPicker>`**

Replace (current lines 434-440):

```tsx
      <LocationPicker
        open={pickerOpen}
        initialCenter={location ?? PICKER_DEFAULT_CENTER}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickLocation}
        saving={savingAddr}
      />
```

with:

```tsx
      <LocationPicker
        open={pickerOpen}
        initialCenter={location ?? PICKER_DEFAULT_CENTER}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickLocation}
        saving={savingAddr}
        savedAddresses={savedAddresses}
        onSelectSaved={handleSelectSavedAddress}
      />
```

- [ ] **Step 10: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 11: Lint**

Run: `npm run lint`
Expected: no new warnings/errors in either modified file.

- [ ] **Step 12: Commit**

```bash
git add components/location/LocationPicker.tsx "app/(auth)/home/page.tsx"
git commit -m "fix: let customers pick an existing address instead of always creating one"
```

---

## Task 4: Regression & Manual QA Verification

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: the pass/fail evidence required before this can be called done — do not report either fix complete until every item below has a recorded result.

- [ ] **Step 1: Build and type-check the whole repo**

Run: `npx tsc --noEmit`
Expected: zero errors.

Run: `npm run lint`
Expected: no new warnings/errors versus the pre-change baseline.

Run: `npm run build`
Expected: build succeeds, all routes generated.

- [ ] **Step 2: Call Cook — Cook Profile page, happy path**

Start `npm run dev`. Open `/cook/[id]` for a cook whose linked `users.phone` is set.
Expected: button changes from the old disabled grey placeholder to an active red "Call Cook" button. Click it — browser should navigate to `tel:<number>` (in a desktop browser this typically prompts "Open Phone Link?" or does nothing visible; on mobile/emulated mobile it opens the dialer). No console errors.

- [ ] **Step 3: Call Cook — no phone on record**

Temporarily clear a test cook's linked `users.phone` to `''` (or use a cook whose row has none), reload `/cook/[id]`.
Expected: button shows disabled "Phone unavailable" state, no crash, no console error. Revert the test edit afterward.

- [ ] **Step 4: Call Cook — unknown cook id**

Visit `/cook/00000000-0000-0000-0000-000000000000`.
Expected: existing "Cook not found" screen renders (unchanged) — the phone RPC is never reached because the page already returns early on `notFound`.

- [ ] **Step 5: Call Cook — Order Detail page unaffected**

Open an existing order's `/order/[id]` page.
Expected: Call Cook button there still works exactly as before (unchanged file) — real number, `tel:` link, three-state behavior intact.

- [ ] **Step 6: Address — saved-address selection, no insert**

Log in as a customer with at least 2 saved addresses (create via `/addresses/new` first if needed). Note the current row count in `customer_addresses` for this user in Supabase's table editor. Go to `/home`, click the "Change" pill.
Expected: modal now shows a "Saved addresses" list with both addresses. Tap one.
Expected: modal closes, the delivery-location pill on `/home` updates to that address's label/text, the cook list refreshes for that location. Re-check `customer_addresses` row count in Supabase — **must be unchanged** (no INSERT fired). Open DevTools Network tab during the tap — confirm no POST to Supabase's REST endpoint for `customer_addresses` fires as part of selection.

- [ ] **Step 7: Address — Add New Address still works and still inserts**

From the same "Change Address" modal, ignore the saved list, drag the map pin to a new spot (or search), pick a label, click "Confirm location".
Expected: a new row **is** inserted into `customer_addresses` (row count increases by 1), the Home page location updates to the new spot. This confirms the existing add-flow is untouched.

- [ ] **Step 8: Address — no saved addresses yet**

Test with a customer who has zero saved addresses. Click "Change" / "Choose location".
Expected: no "Saved addresses" section renders (since `savedAddresses` is empty) — modal behaves exactly as it did before this change, going straight to the pin-drop/search UI.

- [ ] **Step 9: Address CRUD regression — `/addresses` page**

Visit `/addresses`. Add a new address, edit an existing one (confirm label/address/default prefill still works per the 2026-07-21 plan), delete one, toggle default.
Expected: all four operations behave exactly as before — this plan did not modify `app/(auth)/addresses/page.tsx`, `addresses/new/page.tsx`, or `addresses/[id]/edit/page.tsx` logic, only added unused-by-them optional props to the shared `LocationPicker`.

- [ ] **Step 10: Checkout regression**

Add items to cart, go to `/checkout`. Confirm the delivery address `radiogroup` still lists saved addresses and lets you select one (unaffected — this page never used `LocationPicker`). Place a test order and confirm it completes to `/order/[id]/confirm`.
Expected: unchanged from current behavior.

- [ ] **Step 11: Responsive check**

Check both changed surfaces (`/home`'s Change Address modal, `/cook/[id]`'s Call Cook button) at desktop (≥1024px), tablet (~768px), and mobile (~375px) widths in DevTools device emulation.
Expected: saved-address list rows and the Call Cook button render without overflow/clipping at all three widths.

- [ ] **Step 12: Console check**

With DevTools console open, reload `/home`, open/close the Change Address modal, reload `/cook/[id]`.
Expected: no new JS errors or React warnings attributable to these changes.

- [ ] **Step 13: Record results**

For each of Steps 1-12, record pass/fail with what was observed. Do not mark either fix "ready to merge" if any step fails or wasn't actually run — mark it "NOT VERIFIED" instead of assuming success.

---

## Deliverables (fill in after all tasks complete)

1. Root cause analysis — see "Root Cause Analysis" section above.
2. Files modified — `app/(browse)/cook/[id]/page.tsx`, `components/location/LocationPicker.tsx`, `app/(auth)/home/page.tsx` (code) + one new Postgres function `public.get_cook_phone` (Supabase SQL Editor, no repo file).
3. Why each file changed — stated in each task's header above.
4. Diff summary — from `git diff` after Task 2 and Task 3's commits.
5. UI verification — Task 4, Steps 2-9, 11-12.
6. Supabase verification — Task 1, Steps 2-3; Task 4, Step 6 (row-count check).
7. Network verification — Task 4, Step 6 (no POST on selection).
8. TypeScript/lint/build verification — Task 4, Step 1.
9. Regression verification — Task 4, Steps 5, 7, 9, 10.
10. Acceptance-criteria mapping (Verified / Not Verified / Failed, with evidence) — populate after Task 4 completes; do not state either fix is complete until this table is filled in with real evidence.
