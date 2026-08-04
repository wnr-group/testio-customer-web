# Two-Step "Change Address" Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the Home page's "Change Address" map picker behind an explicit "Add New Address" step, so opening it shows a saved-address list first (Swiggy/Zomato style) instead of the pin-drop map immediately.

**Architecture:** Add a two-value `view` state (`'list' | 'map'`) entirely inside the existing shared `components/location/LocationPicker.tsx`. When the modal is opened with a non-empty `savedAddresses` list, it now defaults to `view === 'list'` and renders only the saved-address rows plus an "Add a new address" button. Tapping a saved row calls the existing `onSelectSaved` callback unchanged (no map ever mounts). Tapping "Add a new address" flips `view` to `'map'`, which mounts the exact same pin-drop/search/label/confirm UI that exists today, unchanged. No other file changes.

**Tech Stack:** Next.js 16 App Router, TypeScript, Mapbox GL JS (`components/location/LocationPicker.tsx`), `@supabase/ssr` browser client (unaffected — no new queries).

## Global Constraints

- **Scope decision (see "Scope Verification" below):** this plan targets ONLY the Home page's "Change"/"Change location" flow (`app/(auth)/home/page.tsx` → `components/location/LocationPicker.tsx`). The Checkout page (`app/(auth)/checkout/page.tsx`) has no "Change Address" button and no map picker, today or in the last commit — it is explicitly out of scope and must not be touched.
- Do not touch `app/(auth)/addresses/new/page.tsx` or `app/(auth)/addresses/[id]/edit/page.tsx` — they call `LocationPicker` without `savedAddresses`, so the new gating must be a no-op for them (verified in Task 1).
- Do not touch `app/(auth)/home/page.tsx` — its existing `savedAddresses` / `onSelectSaved` / `onConfirm` wiring (shipped in commit `e5eae51`) already provides everything this plan needs; only `LocationPicker`'s internal rendering changes.
- Do not remove or rewrite the existing pin-drop/search/reverse-geocode/label/confirm logic — reuse it byte-for-byte, only gate its visibility.
- Do not change the `LocationPicker` `Props` type — no new required props, no signature changes for any of the 3 callers.
- This repo has no test runner (no jest/vitest/playwright) and no `npm run typecheck` script (confirmed via `docs/superpowers/plans/2026-07-22-address-selection-and-call-cook-fixes.md`, still true today). Verification uses `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manual browser QA — same convention as the last two shipped plans on this branch.
- No `Co-Authored-By` trailer on commits (`.claude/settings.json` has no `attribution.commit` set).
- No Supabase schema/RPC changes — this is a pure client-side rendering-order fix.

---

## Scope Verification (Phase 1/2 — read before any code change)

**Claim in the product requirement:** "Checkout → Change Address → Map Picker Modal opens immediately."

**What the codebase actually shows, confirmed by reading every relevant file (not assumed):**

| Grep target | Result |
|---|---|
| `"Change Address"` / `"Change address"` / `LocationPicker` usage across `**/*.tsx` | 4 files: `components/location/LocationPicker.tsx` (the component itself), `app/(auth)/home/page.tsx`, `app/(auth)/addresses/new/page.tsx`, `app/(auth)/addresses/[id]/edit/page.tsx`. **`app/(auth)/checkout/page.tsx` is not in this list.** |
| Full read of `app/(auth)/checkout/page.tsx` (current working tree, 634 lines) | Delivery address section (lines 396–468) renders a `radiogroup` of saved `customer_addresses` inline, with an "Add New" `Link` to the separate `/addresses` page (line 400–405). **No modal, no `LocationPicker` import, no map, in HEAD or in the current uncommitted diff** (`git diff HEAD -- "app/(auth)/checkout/page.tsx"` — the diff only touches order-creation logic and pickup-slot formatting, never the address section). |
| Full read of `app/(auth)/home/page.tsx` | The "Change" pill (line 236–252) and "Change location" button (line 334–340) both call `setPickerOpen(true)`, which renders `<LocationPicker open={pickerOpen} ... savedAddresses={savedAddresses} onSelectSaved={handleSelectSavedAddress} />` (lines 474–482). This is the only "Change Address → map" interaction that exists anywhere in the app today. |
| Video Dinesh reviewed | Not available in this repo/session — no `.mp4`/`.mov`/Loom link found under `docs/` or elsewhere in the working tree. Cannot be cross-checked directly. |

**Conclusion, per explicit instruction from the user (Eshwar) when this ambiguity was raised:** since the "Change Address → map picker" interaction exists *only* on the Home page, Dinesh's feedback is treated as applying to that flow — his comment was made in response to a video demonstrating the app's actual behavior, and the Home page is the only place that behavior exists. The Checkout page has no such flow to analyze or extend, so per the same instruction ("do not implement it unless the requirement or codebase confirms it"), it is left untouched.

---

## Dependency Graph (as it exists today)

```
Home page (app/(auth)/home/page.tsx)
  "Change" pill (line 236) / "Change location" button (line 334)
  → setPickerOpen(true)
  → useEffect loads savedAddresses from customer_addresses (lines 76-99, fires each time pickerOpen becomes true)
  → <LocationPicker open savedAddresses onSelectSaved onConfirm=handlePickLocation /> (lines 474-482)
      ↓
  components/location/LocationPicker.tsx
      - "Saved addresses" block (lines 157-179) — TODAY rendered unconditionally alongside...
      - ...Search / Map / Selected-address / Label chips / Set-as-default / Confirm (lines 181-272) — ALSO rendered unconditionally, immediately, in the same screen
      ↓ (two independent exits, both live on screen at once today)
  Tap a saved row → onSelectSaved(addr) → Home.handleSelectSavedAddress (line 198)
      → setLocation({...addr, source: "saved"}) → setPickerOpen(false)   [no DB write]
  Tap "Confirm location" → onConfirm(picked) → Home.handlePickLocation (line 160)
      → supabase.from("customer_addresses").insert({...})               [DB write]
      → setLocation({...picked, source: "picked"}) → setPickerOpen(false)
      ↓
  Home re-renders with new `location` → cook-discovery fetch effect (lines 102-150) reruns
```

Other consumers of `LocationPicker` (must remain unaffected — neither passes `savedAddresses`):
```
app/(auth)/addresses/new/page.tsx      → <LocationPicker ... /> (no savedAddresses prop)
app/(auth)/addresses/[id]/edit/page.tsx → <LocationPicker ... /> (no savedAddresses prop)
```

Checkout / order placement (untouched, shown for completeness):
```
app/(auth)/checkout/page.tsx → inline radiogroup of customer_addresses → deliveryAddressId
  → handlePlaceOrder → supabase.functions.invoke("create-order", { address_id: deliveryAddressId, ... })
```

---

## Root Cause Analysis (Phase 2)

**Why does "Change Address" show the map immediately today?**

In `components/location/LocationPicker.tsx`, the "Saved addresses" block (lines 157-179, added in commit `e5eae51`) and the pin-drop/search/confirm block (lines 181-272) are **sibling JSX elements with no shared visibility state**. Both render unconditionally whenever `open` is `true`. There is no `view`/`mode` flag gating one behind the other — the component was extended to *add* a saved-address list above the map, but never restructured to make the map conditional on an explicit user action. That is the exact root cause: a missing state variable, not a routing or handler bug.

The map's `useEffect` (lines 69-113) is keyed only on `[open]` — it initializes a `mapboxgl.Map` the instant the modal opens, with no awareness of whether a saved-address list is also being shown.

**Fix:** introduce `view: 'list' | 'map'` local state in `LocationPicker`, default it to `'list'` only when `savedAddresses` is non-empty (otherwise `'map'`, preserving current behavior for the two callers that never pass `savedAddresses`), and gate both the saved-list block and the map-init effect on it.

---

## Architecture Design (Phase 3)

```
Home "Change" → LocationPicker opens
  → view initializes to 'list' IF savedAddresses.length > 0, else 'map' (unchanged legacy behavior)

  view === 'list':
    Saved Address rows  →  tap  →  onSelectSaved(addr)  →  Home updates location, closes modal
    "+ Add a new address" button → tap → setView('map')

  view === 'map'  (identical DOM/logic to today's always-on map block):
    back arrow (only shown if savedAddresses.length > 0) → setView('list')
    Search / drag pin / reverse-geocode / label chips / default checkbox
    "Confirm location" → onConfirm(picked) → Home inserts row, updates location, closes modal
      → next time the picker opens, Home's existing fetch effect reloads savedAddresses,
        so the new address appears in the list (no extra fetch call needed in this plan)
```

No duplication: it is the same map/search/confirm JSX and the same `onConfirm`/`onSelectSaved` callbacks already wired in `home/page.tsx` — only a visibility gate is added.

---

## Impact Analysis (Phase 4)

| Area | Change | Risk |
|---|---|---|
| `components/location/LocationPicker.tsx` | Add `view` state + gate 2 existing JSX blocks + gate map-init effect | **Medium** — shared by 3 callers; mitigated by making the new behavior a no-op unless `savedAddresses` is non-empty |
| `app/(auth)/home/page.tsx` | None | Safe |
| `app/(auth)/addresses/new/page.tsx` | None (never passes `savedAddresses`) | Safe |
| `app/(auth)/addresses/[id]/edit/page.tsx` | None (never passes `savedAddresses`) | Safe |
| `app/(auth)/checkout/page.tsx` | None — out of scope | Safe |
| Saved Address APIs / `customer_addresses` table | None — no query/schema change | Safe |
| Address Context / Zustand / Redux | N/A — this repo has no address context/store; state is local `useState` in `home/page.tsx` | Safe |
| Order placement (`create-order` edge function, checkout) | None | Safe |
| Location persistence (`useResolvedLocation` hook) | None | Safe |
| Customer profile APIs | None | Safe |
| Cart / Login / Profile / OTP | None | Safe |

---

## Acceptance Criteria Mapping

("Checkout" in the original requirement is mapped to the Home page's Change-Address flow per the Scope Verification section above.)

| AC | Criterion | How this plan satisfies it |
|---|---|---|
| AC1 | Clicking Change Address opens Saved Address Selection | `view` defaults to `'list'` when `savedAddresses.length > 0` |
| AC2 | Previously saved addresses are visible | Existing saved-address list block, now gated to render first |
| AC3 | Selecting an existing address immediately updates Home | Unchanged `onSelectSaved` → `handleSelectSavedAddress` path |
| AC4 | No Map Picker opens when selecting an existing address | Map-init `useEffect` now requires `view === 'map'`; selecting a saved row never changes `view` |
| AC5 | Clicking Add New Address opens existing Map Picker | "+ Add a new address" button calls `setView('map')`, mounting the unchanged map block |
| AC6 | Map Picker behaves exactly as before | Map/search/label/confirm JSX and handlers are moved, not rewritten |
| AC7 | Saving a new address adds it to Saved Addresses | Unchanged `handlePickLocation` insert path in `home/page.tsx` |
| AC8 | New address becomes selected automatically | Unchanged — `handlePickLocation` calls `setLocation(picked)` immediately |
| AC9 | Home updates immediately | Unchanged — `setLocation` triggers the existing cook-discovery effect |
| AC10 | Place Order uses selected address | Unaffected — checkout's own `deliveryAddressId` radiogroup is untouched |
| AC11 | Location persistence continues working | `useResolvedLocation` hook untouched |
| AC12 | No existing saved addresses disappear | No delete/mutation logic touched |
| AC13 | No duplicate addresses created | Insert path unchanged; still one insert per "Confirm location" tap |
| AC14-AC19 | No regression in checkout/cart/login/profile/address APIs/order placement | None of those files are touched |
| AC20 | No TypeScript errors | Verified in Task 1 Step 8 |
| AC21 | No ESLint errors | Verified in Task 1 Step 9 |
| AC22 | No runtime console errors | Verified in Task 2 manual QA |

---

## Task 1: Gate the map picker behind an explicit "Add New Address" step

**Files:**
- Modify: `components/location/LocationPicker.tsx`

**Interfaces:**
- Consumes: nothing new — `Props` (already has `savedAddresses?: SavedAddress[]` and `onSelectSaved?: (addr: SavedAddress) => void` from commit `e5eae51`) is unchanged.
- Produces: no new exports. Purely internal `view: 'list' | 'map'` state; no prop/type changes for any caller.

- [ ] **Step 1: Add the `ArrowLeft` icon import**

Replace (current line 10):

```ts
import { MapPin, Search, X, Loader2 } from 'lucide-react'
```

with:

```ts
import { MapPin, Search, X, Loader2, ArrowLeft } from 'lucide-react'
```

- [ ] **Step 2: Add `view` state, a one-shot open-transition ref, and a `hasSavedAddresses` helper**

Replace (current lines 60-66):

```ts
  const [coords, setCoords] = useState(initialCenter)
  const [address, setAddress] = useState(initialAddress ?? '')
  const [label, setLabel] = useState(initialLabel ?? 'Home')
  const [isDefault, setIsDefault] = useState(initialIsDefault ?? false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [geocoding, setGeocoding] = useState(false)
```

with:

```ts
  const [coords, setCoords] = useState(initialCenter)
  const [address, setAddress] = useState(initialAddress ?? '')
  const [label, setLabel] = useState(initialLabel ?? 'Home')
  const [isDefault, setIsDefault] = useState(initialIsDefault ?? false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [geocoding, setGeocoding] = useState(false)

  // Two-step flow: show the saved-address list first (if there is one) and
  // only mount the pin-drop map once the user explicitly asks to add a new
  // address. Callers that never pass savedAddresses (add/edit address pages)
  // always land straight on 'map', matching their existing behavior exactly.
  const hasSavedAddresses = Boolean(savedAddresses && savedAddresses.length > 0)
  const [view, setView] = useState<'list' | 'map'>(hasSavedAddresses ? 'list' : 'map')
  const wasOpenRef = useRef(false)

  // Reset to the correct starting view only on the closed→open transition,
  // so an in-flight savedAddresses fetch completing while already open
  // doesn't yank the user back to the list mid-pin-drop.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setView(hasSavedAddresses ? 'list' : 'map')
    }
    wasOpenRef.current = open
  }, [open, hasSavedAddresses])
```

- [ ] **Step 3: Gate the map-init effect on `view === 'map'`**

Replace (current lines 69-70 and 113):

```ts
  useEffect(() => {
    if (!open || !mapContainerRef.current) return
```

with:

```ts
  useEffect(() => {
    if (!open || view !== 'map' || !mapContainerRef.current) return
```

Replace (current line 113):

```ts
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
```

with:

```ts
  }, [open, view]) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: Add the back button to the header, only shown when returning to the list is possible**

Replace (current lines 142-155):

```tsx
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Choose your delivery location</h3>
            <p className="text-xs text-slate-400">Search an area or drag the pin to your spot</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
```

with:

```tsx
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            {view === 'map' && hasSavedAddresses && (
              <button
                onClick={() => setView('list')}
                aria-label="Back to saved addresses"
                className="text-slate-400 hover:text-slate-700 p-1 -ml-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900">
                {view === 'list' ? 'Choose a delivery address' : 'Choose your delivery location'}
              </h3>
              <p className="text-xs text-slate-400">
                {view === 'list'
                  ? 'Pick a saved address or add a new one'
                  : 'Search an area or drag the pin to your spot'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>
```

- [ ] **Step 5: Gate the saved-address list to `view === 'list'` and make "Add a new address" an actual button**

Replace (current lines 157-179):

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
```

with:

```tsx
        {/* Saved addresses — pick one instead of dropping a new pin */}
        {view === 'list' && savedAddresses && savedAddresses.length > 0 && (
          <div className="px-5 pt-4 pb-2 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500">Saved addresses</p>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
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
            <button
              type="button"
              onClick={() => setView('map')}
              className="w-full text-left text-xs font-bold text-[#E8202A] hover:underline pt-1 pb-1"
            >
              + Add a new address
            </button>
          </div>
        )}
```

- [ ] **Step 6: Gate the pin-drop/search/label/confirm block to `view === 'map'`**

Replace (current lines 181-182, the start of the Search block):

```tsx
        {/* Search */}
        <div className="px-5 pt-4 relative">
```

with:

```tsx
        {view === 'map' && (
        <>
        {/* Search */}
        <div className="px-5 pt-4 relative">
```

Replace (current lines 263-272, the end of the Confirm block):

```tsx
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

with:

```tsx
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
        </>
        )}
```

- [ ] **Step 7: Verify the resulting JSX by reading the whole file back**

Run: read `components/location/LocationPicker.tsx` in full and confirm:
- Exactly one `{view === 'map' && ( <> ... </> )}` wrapper spans from the Search block through the Confirm block (Search → Map div → Selected-address div → Label chips → Set-as-default checkbox → Confirm button).
- The saved-address block and the map block are not both visible for the same `view` value.
- `addresses/new/page.tsx` and `addresses/[id]/edit/page.tsx` are not imported/modified by this change (they weren't touched).

Expected: no orphaned JSX, no unbalanced fragments/divs.

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors (this repo has no dedicated `typecheck` script — this is the project's established substitute, per `docs/superpowers/plans/2026-07-22-address-selection-and-call-cook-fixes.md`).

- [ ] **Step 9: Lint**

Run: `npm run lint`
Expected: no new warnings/errors in `components/location/LocationPicker.tsx` versus the pre-change baseline.

- [ ] **Step 10: Commit**

```bash
git add components/location/LocationPicker.tsx
git commit -m "feat: gate map picker behind an explicit Add New Address step"
```

---

## Task 2: Manual Regression & QA Verification (Phases 8-10 — evidence required)

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: Task 1.
- Produces: the pass/fail evidence required before any AC can be marked complete. Do not report this feature done until every step below has a recorded result — mark anything not actually run as **NOT VERIFIED**, not PASS.

- [ ] **Step 1: Build and type-check the whole repo**

Run: `npx tsc --noEmit` → expected zero errors.
Run: `npm run lint` → expected no new warnings/errors versus pre-change baseline.
Run: `npm run build` → expected build succeeds, all routes generated.
Record actual output for AC20/AC21.

- [ ] **Step 2: Saved-address selection — no map, no insert (AC1-AC4)**

Start `npm run dev`. Log in as a customer with ≥2 saved addresses (use `/addresses` to create some first if needed). Note the current row count for this user in `customer_addresses` (Supabase table editor). Go to `/home`, click the "Change" pill.

Expected: modal opens directly to "Choose a delivery address" with the saved-address list — the map/search UI is not visible or mounted (confirm via DevTools Elements: no `.mapboxgl-canvas` in the DOM at this point). Tap a saved address.

Expected: modal closes, the delivery-location pill on `/home` updates to that address's text, cook list refreshes. Re-check `customer_addresses` row count — must be **unchanged**. Check the Network tab during the tap — confirm no POST to the `customer_addresses` REST endpoint fired.

- [ ] **Step 3: Add New Address opens the existing map picker (AC5-AC6)**

From the same modal (reopen "Change" if it closed), click "+ Add a new address".

Expected: view switches to "Choose your delivery location" with the back arrow visible, and the map/search/label/confirm UI renders (confirm `.mapboxgl-canvas` now exists in the DOM). Drag the pin or search for a place; confirm reverse geocoding populates the "Selected address" text as before. Click the back arrow — confirm it returns to the saved-address list without closing the modal.

- [ ] **Step 4: Save a new address — auto-selected, added to the list (AC7-AC9)**

Reopen "Add a new address", pick a new spot, choose a label, click "Confirm location".

Expected: a new row **is** inserted into `customer_addresses` (row count +1), the modal closes, and the Home page's delivery-location pill immediately shows the new spot. Reopen "Change" — confirm the new address now appears in the saved list (proves the existing fetch-on-open effect in `home/page.tsx` picks it up with no extra code needed).

- [ ] **Step 5: Zero saved addresses — legacy behavior preserved**

Test with a customer who has zero saved addresses (or temporarily delete all of a test customer's addresses). Click "Change".

Expected: modal goes straight to the map/search UI (no saved-address section, no back arrow) — identical to pre-change behavior.

- [ ] **Step 6: `/addresses/new` and `/addresses/[id]/edit` regression (AC12-AC13, "Safe" areas)**

Visit `/addresses`. Click "Add new address" — confirm it opens the full pin-drop map directly (no saved-list step, since this caller never passes `savedAddresses`). Edit an existing address — confirm the prefilled label/address/default checkbox still work exactly as before. Delete one, toggle default.

Expected: all four operations behave exactly as before this change (these two pages were not modified).

- [ ] **Step 7: Checkout regression (AC10, AC14 — explicitly out of scope, confirm untouched)**

Add items to cart, go to `/checkout`. Confirm the delivery-address `radiogroup` still lists saved addresses inline (no modal, no map — unchanged) and lets you select one. Place a test order and confirm it completes to `/order/[id]/confirm` using the selected address.

Expected: unchanged from current behavior — this file was not modified.

- [ ] **Step 8: Cart / Login / Profile / OTP / Order placement regression (AC15-AC19)**

Smoke-test: log out and back in, view `/profile`, add/remove a cart item, place one full order end-to-end.

Expected: no regressions — none of these surfaces share code with `LocationPicker`.

- [ ] **Step 9: Responsive check**

Check the Home page's Change-Address modal (both `view` states) at desktop (≥1024px), tablet (~768px), and mobile (~375px) widths via DevTools device emulation.

Expected: saved-address rows, back arrow, and map/confirm UI render without overflow/clipping at all three widths.

- [ ] **Step 10: Console check (AC22)**

With DevTools console open: reload `/home`, open the Change-Address modal, switch list→map→list via the back arrow, close it, reload `/cook/[id]` and `/addresses` once each for good measure.

Expected: no new JS errors or React warnings attributable to this change.

- [ ] **Step 11: Record results**

For each of Steps 1-10 above and each AC in the "Acceptance Criteria Mapping" table, record PASS/FAIL/NOT VERIFIED with what was actually observed (screenshots, network tab captures, or row-count before/after values). Do not mark the feature complete if any step wasn't actually run.

---

## Task 3: Production Readiness Validation (appended — baseline plan and scope above are unchanged)

**Files:**
- None (validation and evidence-gathering only — no code changes beyond Task 1, no scope expansion).

**Interfaces:**
- Consumes: Task 1 (implementation) and Task 2 (functional/AC verification).
- Produces: the evidence record required by the Completion Rule below. Every item is PASS, FAIL, BLOCKED, or **NOT VERIFIED** — never assumed, never inferred from "the code looks right."

**Ordering note:** Step 1 (Architecture Validation) is a pre-implementation gate. Even though this task is appended at the end of the document, Step 1 must be completed and documented **before Task 1's Step 1 begins** — the checklist order below is unchanged from the request, but execution order is: Task 3 Step 1 → Task 1 → Task 2 → Task 3 Steps 2-16.

- [ ] **Step 1: Architecture Validation (before writing code)**

Answer each with evidence from the codebase (already established in this plan's "Root Cause Analysis" / "Architecture Design" sections — cite line numbers, don't re-derive):

| Check | Answer | Evidence |
|---|---|---|
| Is this the minimal safe solution? | Yes | One boolean-driven `view` state gates two already-existing JSX blocks; no new component, no new file, no new dependency. |
| Can existing state/hooks be reused instead of new state? | Partially — `savedAddresses`, `onSelectSaved`, `onConfirm`, `pickerOpen` in `home/page.tsx` are reused unchanged (Global Constraints: "Do not touch `app/(auth)/home/page.tsx`"). One new piece of state (`view`) is unavoidable — it doesn't exist anywhere in the codebase today, because the bug *is* the absence of this state (see Root Cause Analysis). |
| Duplicate business logic introduced? | No | `onSelectSaved`/`onConfirm` call sites and the insert/select logic in `home/page.tsx` are not touched or duplicated. |
| Duplicate rendering logic introduced? | No | The map/search/label/confirm JSX (Task 1 Step 6) is relocated inside a conditional wrapper, not copied. Read the file after Task 1 Step 6 to confirm only one copy of that JSX block exists. |
| Prop drilling introduced? | No | `view`/`setView` stay local to `LocationPicker`; no new prop is threaded through `home/page.tsx` or any parent. |
| Circular dependencies introduced? | No | `LocationPicker.tsx` imports nothing new except the `ArrowLeft` icon from the already-imported `lucide-react` package; no new imports between `home/page.tsx` and `LocationPicker.tsx` in either direction. |
| Unnecessary re-renders introduced? | No, by construction | `view` is `useState` local to `LocationPicker`; changing it re-renders only `LocationPicker` and its children, not `home/page.tsx` or any sibling (React re-render scoping — verify empirically in Step "Performance Validation" below with React DevTools Profiler). |
| Simpler/safer alternative considered? | Yes — rejected | Alternative: route to a separate `/addresses` page instead of a two-step modal (mirrors how Checkout already does address selection today). Rejected because Dinesh's spec explicitly requires an in-modal Swiggy/Zomato-style flow reusing the existing Map Picker, and a page-navigation redirect would be a larger behavioral change (loses modal context, adds routing) than the minimal state-gate implemented here. |

Expected: table fully filled with evidence, no cell left as an assumption. **Do not proceed to Task 1 until this table is complete.**

- [ ] **Step 2: Performance Validation**

Using Chrome DevTools (Performance tab + React DevTools Profiler + Network tab), capture BEFORE (current `main`/pre-Task-1 state) and AFTER (post-Task-1) measurements for one "Change → pick saved address" cycle and one "Change → Add New Address → Confirm" cycle:

| Metric | How to capture | Expected |
|---|---|---|
| Mapbox initializations | Console: add a temporary `console.count('mapbox-init')` at the top of the map-init `useEffect` during local testing only (remove before commit — see Task 3 Step 14 Git Validation) | 0 when picking a saved address (list path never mounts the map container); exactly 1 when reaching the map via "Add a new address" |
| Reverse-geocode requests | Network tab, filter by the Mapbox geocoding endpoint (`lib/utils.ts`'s `reverseGeocode`) | 0 on the saved-address path; same count as pre-change on the map path (unchanged logic) |
| Network requests overall | Network tab, full list per action | No new requests beyond what existed pre-change; saved-address selection fires 0 REST calls (`onSelectSaved` is local state only) |
| Component renders | React DevTools Profiler, record one "Change" open→select cycle | Re-renders confined to `LocationPicker`; `HomeContent` renders only when `location`/`savedAddresses` state actually changes (unchanged from before) |
| Memory usage | DevTools Memory tab, heap snapshot before/after one open+close cycle | No measurable growth attributable to this change |
| CPU during modal open | Performance tab recording during "Change" click | No new long tasks versus pre-change baseline (opening straight to the list is lighter than the pre-change always-mount-the-map behavior, since Mapbox no longer initializes when a saved list exists) |
| Modal open latency | Performance tab, timestamp click→paint | Equal or faster than pre-change (list-only render has less work than list+map) |
| Unnecessary state updates | React DevTools Profiler "why did this render" | `view` changes only on explicit user action (`setView` calls in Task 1 Steps 5-6) or the one-shot open-transition effect (Task 1 Step 2) — no extraneous `setState` calls |

Record actual before/after numbers. Mark NOT VERIFIED for any row not actually measured.

- [ ] **Step 3: Accessibility Verification**

Manually verify with keyboard only, then with a screen reader (NVDA/VoiceOver, whichever is available):

| Check | Expected | Result |
|---|---|---|
| Keyboard navigation | Tab reaches: back arrow (map view only) → close button → saved-address rows / "+ Add a new address" (list view) or search input → map (skip, not keyboard-operable — pre-existing, unchanged) → label chips → default checkbox → Confirm button (map view) | PASS/FAIL — record actual tab order |
| Tab order | Logical top-to-bottom, left-to-right per current view | PASS/FAIL |
| Focus management | Focus lands somewhere sensible when `view` switches (list→map or map→list) — verify no focus loss to `<body>` | PASS/FAIL — this is new behavior from Task 1, must be explicitly checked, not assumed |
| Escape key closes modal | Press Escape while modal open | Check current behavior first — **pre-existing**: `LocationPicker.tsx`'s `X` close button has no keyboard shortcut wired (no `onKeyDown`/`useEffect` for Escape found in the file). If Escape does not close the modal today, that is a pre-existing gap, not a regression from this plan — do not fix it here (out of scope per Global Constraints); just confirm behavior is unchanged before/after. |
| Screen reader labels | Saved-address rows announce label + address text; "+ Add a new address" and back arrow announce their purpose | PASS/FAIL |
| Button accessibility | All interactive elements are real `<button>` elements (Task 1 Step 5 keeps "Add a new address" as a `<button type="button">`, not a `<p>`) | PASS — verify by reading the file after Task 1 |
| ARIA attributes | `aria-label="Close"` (existing) and `aria-label="Back to saved addresses"` (new, Task 1 Step 4) present | PASS — verify by reading the file after Task 1 |
| Focus restoration after closing modal | Focus returns to the "Change" pill/button that opened it | Check current behavior first — pre-existing gap or working; record actual result, don't assume |
| Color contrast unchanged | Same Tailwind color classes (`text-[#E8202A]`, `text-slate-*`) reused, no new colors introduced | PASS — verify by reading Task 1's diff, no new color values introduced |

Document PASS/FAIL per row with evidence (screen reader transcript or keyboard-trace notes). Any pre-existing accessibility gap (e.g., Escape-to-close) is out of scope to fix — only confirm no regression.

- [ ] **Step 4: Error Handling Validation**

| Scenario | How to simulate | Expected | Result |
|---|---|---|---|
| Saved address fetch failure | DevTools → block the `customer_addresses` REST request | Existing behavior: `home/page.tsx`'s fetch effect (lines 76-99) logs the error via `console.error` and leaves `savedAddresses` as `[]` — `LocationPicker` then defaults `view` to `'map'` (since `hasSavedAddresses` is false), same as a zero-address customer. No crash. | NOT VERIFIED until run |
| Mapbox initialization failure | Temporarily set an invalid `NEXT_PUBLIC_MAPBOX_TOKEN` | Existing pre-change behavior (unchanged by this plan) — record whatever it does today (likely a blank/broken map tile area, no crash) | NOT VERIFIED until run |
| Reverse geocoding failure | Block the geocoding endpoint in DevTools while dragging the pin | Existing fallback in `LocationPicker.tsx`'s `updateFromLngLat`: falls back to `${lat.toFixed(5)}, ${lng.toFixed(5)}` (line 90) — unchanged by this plan | NOT VERIFIED until run |
| Address save failure | Block the `customer_addresses` insert | Existing behavior in `home/page.tsx`'s `handlePickLocation` catch block: `toast.error("Couldn't save that address — using it for now.")`, still calls `setLocation`/`setPickerOpen(false)` — unchanged by this plan | NOT VERIFIED until run |
| Network timeout / slow network | DevTools → Network → Slow 3G throttling | Loading/geocoding indicators (`geocoding` state, `Loader2` spinner) behave as before — unchanged logic | NOT VERIFIED until run |
| Offline mode | DevTools → Network → Offline | Record actual behavior — expect fetches to fail gracefully per the "fetch failure" row above; Mapbox tiles will fail to load (pre-existing, unrelated to this plan) | NOT VERIFIED until run |
| Empty API response | Saved addresses query returns `[]` | `hasSavedAddresses` is `false` → `view` defaults to `'map'`, identical to the zero-address case already covered in Task 2 Step 5 | Covered by Task 2 Step 5 |
| Invalid API response | N/A — `customer_addresses` schema is fixed/typed via Supabase client; not independently reproducible without corrupting data (out of scope to simulate) | N/A | NOT APPLICABLE |
| Database error | Simulate via Supabase dashboard (revoke a grant temporarily) or block the request | Same as "fetch failure" / "save failure" rows above | NOT VERIFIED until run |
| Authentication expiration | Expire the session (clear the Supabase auth cookie) mid-flow, then interact with the modal | `handleSelectSavedAddress`/`handlePickLocation` don't independently check auth — `supabase.auth.getUser()` inside `handlePickLocation` would return no user, the `if (user)` guard (line 166) skips the insert, and the location is still set locally. This is pre-existing behavior, unchanged by this plan. | NOT VERIFIED until run |

For every row actually run: record user-visible feedback, whether a retry path exists, and confirm no broken/stuck UI state (e.g., modal stuck open with a spinner forever).

- [ ] **Step 5: Edge Case Matrix**

Addresses:

| Case | Expected | Result |
|---|---|---|
| Zero addresses | `view` defaults to `'map'` (Task 2 Step 5) | Covered |
| One address | List shows 1 row + "+ Add a new address" | NOT VERIFIED until run |
| Multiple addresses | List shows all rows | NOT VERIFIED until run |
| 20+ addresses | List scrolls within `max-h-64 overflow-y-auto` (Task 1 Step 5) without breaking modal layout | NOT VERIFIED until run |
| Extremely long address text | `truncate` class on `address_line` (existing, unchanged) prevents overflow | NOT VERIFIED until run |
| Unicode / emoji in label or address | Renders as-is (no encoding logic touched) | NOT VERIFIED until run |
| Null label | `{addr.label}` renders empty string, no crash (existing behavior, unchanged) | NOT VERIFIED until run |
| Duplicate labels (e.g., two "Home") | Both rows render independently, keyed by `addr.id` (unique), no React key collision | NOT VERIFIED until run |
| Address deleted (via another tab/session) before modal opened | Next fetch simply won't include it — no stale entry | NOT VERIFIED until run |
| Address deleted while modal is open (list already fetched) | Stale row remains visible until modal is reopened (existing fetch-on-open behavior, unchanged by this plan) — tapping it calls `onSelectSaved` with stale but still-valid lat/lng data (no DB lookup at selection time), so no crash, just a client-side selection of the last-known coordinates | NOT VERIFIED until run |

User:

| Case | Expected | Result |
|---|---|---|
| Logged in | Baseline case, covered by Task 2 | Covered |
| Session refresh mid-flow | No client-side auth check inside `LocationPicker` itself; behavior matches "Authentication expiration" row above | NOT VERIFIED until run |
| Logout/Login | Covered by Task 2 Step 8 | Covered |
| Browser refresh with modal open | Modal state is local `useState`, not persisted — refresh closes it and resets `pickerOpen`/`view` to their initial defaults on next mount (expected, no persistence claimed anywhere in this plan) | NOT VERIFIED until run |
| Navigate away and back (e.g. `/home` → `/cook/[id]` → `/home`) | The resolved delivery location itself persists via `useResolvedLocation` (existing hook, untouched by this plan — see Impact Analysis). The picker's `view`/list-vs-map state is local and ephemeral by design: on the next "Change" open it re-evaluates `hasSavedAddresses` fresh and starts at `'list'` again if addresses exist — this is correct, not a persistence bug. | NOT VERIFIED until run |
| Multiple tabs | Each tab has independent local state; no shared/global store exists for this modal (confirmed — no Zustand/Redux address context in this repo) — no cross-tab interference expected | NOT VERIFIED until run |

UI:

| Case | Expected | Result |
|---|---|---|
| Rapid clicking a saved-address row | `onSelectSaved` closes the modal on first click (`setPickerOpen(false)` in `home/page.tsx`); subsequent clicks are no-ops since the modal unmounts (`if (!open) return null`) | NOT VERIFIED until run |
| Double click "+ Add a new address" | `setView('map')` is idempotent (same value set twice) — no duplicate map instances expected, but explicitly verify only one `.mapboxgl-canvas` exists in the DOM after a double click | NOT VERIFIED until run |
| Open/Close repeatedly | See Task 3 Step 7 (Memory Leak Verification) | See Step 7 |
| Resize window while modal open | Existing `map.on('load', () => map.resize())` only fires once on load, not on window resize — check whether Mapbox canvas visually breaks on resize (pre-existing behavior if so, not introduced by this plan) | NOT VERIFIED until run |
| Orientation change (mobile) | Same as resize — record actual behavior, do not assume | NOT VERIFIED until run |

- [ ] **Step 6: State Transition Verification**

Verify both flows below produce exactly the states described, with no invalid/unreachable state observed (e.g., map and list both visible simultaneously, or neither visible):

```
Flow A: Closed → Open → Saved Address List → Existing Address Selected → Modal Closed → Open Again → Saved Address List
Flow B: Closed → Open → Saved Address List → Add New Address → Map Picker → Confirm → Modal Closed → Open Again → Saved Address List
```

For each arrow in both flows, click through manually and record the actual `view` value and DOM state (screenshot or React DevTools component state inspection showing `view: 'list' | 'map'`). Additionally verify the two flows this plan's Task 1 also introduces:

```
Flow C: Saved Address List → Add New Address → Map Picker → Back arrow → Saved Address List   (no address created)
Flow D: Zero addresses → Open → Map Picker directly (no list, no back arrow)                    (legacy path, Task 2 Step 5)
```

Expected: no state where both the saved list and the map/confirm UI are visible at once; no state where neither is visible while the modal is open.

- [ ] **Step 7: Memory Leak Verification**

Using Chrome DevTools Memory tab and the Performance Monitor:

1. Take a heap snapshot before starting.
2. Open the Change-Address modal and close it (via saved-address selection) — repeat 50 times.
3. Take a heap snapshot.
4. Open the modal, switch to map view via "Add a new address", switch back via the back arrow — repeat 50 times.
5. Take a final heap snapshot.

Verify:
- No monotonically growing count of retained `mapboxgl.Map` instances between snapshots (the map-init `useEffect`'s cleanup at line 108-112, `map.remove()`, must fire on every `view` transition away from `'map'` per Task 1 Step 3's updated dependency array — confirm this empirically, don't assume the dependency array change is sufficient).
- No growing count of event listeners (Mapbox `marker.on('dragend', ...)`, `map.on('click', ...)`, `map.on('load', ...)`) — each should be removed when its owning `mapboxgl.Map` is removed.
- No duplicate listeners registered per open (i.e., listener count after 50 opens should equal listener count after 1 open, once the modal is closed each time).
- Detached DOM node count does not grow across the 3 snapshots.
- No stale closures over old `savedAddresses` arrays retained in memory after the component this data belonged to unmounts.

Record actual heap sizes/detached-node counts at each snapshot. Mark FAIL if any metric grows unboundedly across the 50-iteration run; mark NOT VERIFIED if not actually run.

- [ ] **Step 8: API and Network Validation**

Repeat with Network tab recording, for each of: (a) selecting a saved address, (b) adding a new address:

| Check | Expected |
|---|---|
| Duplicate requests | None — one fetch on modal open (existing `home/page.tsx` effect), zero additional requests from Task 1's changes |
| Unnecessary requests | None |
| Unexpected retries | None — no retry logic added or existing |
| HTTP methods | `GET`/`SELECT` via PostgREST for the address fetch; `POST`/`INSERT` only on "Add New Address" confirm; no `PATCH`/`DELETE` calls from this flow at all |
| Payload correctness | Insert payload matches `home/page.tsx`'s existing `handlePickLocation` body (label, address_line, lat, lng, is_default) — unchanged by this plan |
| Response correctness | Insert returns success; selection path makes no request to correctly return "nothing" |
| Error handling | Matches Task 3 Step 4 rows above |
| Saved address selection creates no new address | Row count unchanged — cross-reference Task 2 Step 2 and Task 3 Step 9 below |
| Add New Address creates exactly one address | Row count +1 — cross-reference Task 2 Step 4 and Task 3 Step 9 below |

Capture and attach the Network tab HAR or screenshot as evidence.

- [ ] **Step 9: Database Verification**

Using the Supabase table editor or a `select count(*) from customer_addresses where user_id = '<test-user-id>'` query, before and after each action:

| Action | Expected DB result | Result |
|---|---|---|
| Saved Address Selection | Row count unchanged; no INSERT/UPDATE/DELETE fired (cross-check against Task 3 Step 8's Network capture — zero write requests) | NOT VERIFIED until run |
| Add New Address | Exactly one new row (row count +1); no duplicate rows for the same lat/lng/label; `is_default` set correctly per the existing single-default-invariant logic in `handlePickLocation` (unchanged); `created_at`/`updated_at` timestamps set by existing table defaults (unchanged) | NOT VERIFIED until run |

Record the actual row counts and the new row's full column values as evidence.

- [ ] **Step 10: Visual Regression Validation**

Compare screenshots before (current `main`) vs after (post-Task-1) for:

| Surface | Expected |
|---|---|
| List view (new) | New UI — no "before" comparison possible; verify against the Task 1 Step 5 spec (padding `px-5 pt-4 pb-2`, row spacing `gap-2`, `max-h-64` scroll) |
| Map view (post-change) | Pixel-identical to today's map/search/label/confirm section, since Task 1 only wraps it in a conditional — no styling classes were changed inside that block |
| Modal container (width, corner radius, shadow, backdrop) | Unchanged — Task 1 does not touch the outer `<div className="fixed inset-0 z-[100] ...">` wrapper |
| Header | New back arrow (map view + has saved addresses only) and conditional subtitle text (Task 1 Step 4) — verify layout doesn't shift the close button position |
| Modal animation | No animation classes exist today (`open` toggles a hard mount/unmount via `if (!open) return null`) — confirm this plan does not introduce or imply any new transition/animation |
| Scroll behavior | Saved-address list scrolls internally (`overflow-y-auto`) without scrolling the whole modal; map section scroll behavior unchanged |
| Button styling | "+ Add a new address" uses `text-[#E8202A]` matching the existing brand red used elsewhere in this component (`Confirm location` button, saved-row `MapPin` icon) — no new color introduced |

No unrelated visual change should appear anywhere outside `components/location/LocationPicker.tsx`.

- [ ] **Step 11: Browser Compatibility**

Manually verify the full Flow A and Flow B (Task 3 Step 6) on each available browser:

| Browser | Result |
|---|---|
| Chrome | NOT VERIFIED until run |
| Edge | NOT VERIFIED until run |
| Firefox | NOT VERIFIED until run |
| Safari (if available) | NOT VERIFIED until run — note if unavailable in this environment |
| Mobile Chrome (device emulation or real device) | NOT VERIFIED until run |
| Mobile Safari (real device or BrowserStack if available; note if unavailable) | NOT VERIFIED until run |

Record PASS/FAIL per browser with notes on any rendering differences.

- [ ] **Step 12: Responsive Validation**

Extends Task 2 Step 9 (already covers desktop/tablet/mobile widths) with orientation:

| Viewport | Orientation | Expected | Result |
|---|---|---|---|
| Desktop (≥1024px) | N/A | Task 2 Step 9 | Covered |
| Tablet (~768px) | Portrait | No overflow/clipping | NOT VERIFIED until run |
| Tablet (~768px) | Landscape | No overflow/clipping; modal `max-h-[90vh]` (existing) still fits | NOT VERIFIED until run |
| Mobile (~375px) | Portrait | Task 2 Step 9 | Covered |
| Mobile (~375px) | Landscape | Modal height-constrained view — verify saved list and map sections both still scroll correctly within `max-h-[90vh]` | NOT VERIFIED until run |

- [ ] **Step 13: Regression Validation (full smoke test)**

Extends Task 2 Steps 6-8. Full pass required across: Home, Checkout, Cart, Profile, Address Book (`/addresses`), Login, Logout, Orders (list), Order Details, OTP Flow, Cook Discovery, Location Persistence, Order Placement, Delivery Flow (order tracking map). Record PASS/FAIL per surface. Since this plan modifies only `components/location/LocationPicker.tsx`, any regression found outside the Home page's Change-Address flow or the `/addresses` add/edit flows would indicate an unexpected coupling and must be investigated before proceeding, not dismissed.

- [ ] **Step 14: Git Validation**

Before committing (run against the working diff for Task 1):

```bash
git diff -- components/location/LocationPicker.tsx
```

Verify:
- Diff contains only the changes described in Task 1 Steps 1-6 (icon import, `view` state, effect gating, header, saved-list block, map-block wrapper).
- No unrelated formatting/whitespace churn outside the touched lines.
- No `console.log` left in (the temporary `console.count` from Task 3 Step 2 must be removed before this check, if it was added).
- No `TODO` comments introduced.
- No commented-out code blocks left behind.
- `git status` shows no accidental modifications to any file outside `components/location/LocationPicker.tsx` from this task's work.

- [ ] **Step 15: Rollback Strategy**

- **Files affected:** `components/location/LocationPicker.tsx` only (single file, single Task 1 commit).
- **Revert procedure:** `git revert <task-1-commit-sha>` — a single, self-contained commit revert restores the pre-plan behavior (saved list and map both always visible together, as shipped in commit `e5eae51`).
- **Expected rollback behavior:** `home/page.tsx`'s "Change" flow returns to showing the saved-address list and the full map/search/confirm UI simultaneously in one screen (the state this plan started from) — no other page or flow is affected by the revert, since no other file was touched.
- **Post-rollback validation:** re-run `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manually confirm the Home page's "Change" flow opens with both sections visible again (matching the "before" state documented in this plan's Root Cause Analysis).
- **Database rollback:** **not required** — this plan makes no schema, RPC, or migration changes; any `customer_addresses` rows inserted during testing are ordinary application data, not part of the rollback surface.

- [ ] **Step 16: Production Release Checklist**

Do not mark the overall feature complete until every line below is checked off with a recorded PASS (not assumed):

- [ ] Root cause identified — Root Cause Analysis section above
- [ ] Scope verified — Scope Verification section above
- [ ] Minimal implementation confirmed — Task 3 Step 1
- [ ] Architecture reviewed — Task 3 Step 1
- [ ] Performance validated — Task 3 Step 2
- [ ] Accessibility validated — Task 3 Step 3
- [ ] Error handling validated — Task 3 Step 4
- [ ] Edge cases validated — Task 3 Step 5
- [ ] State transitions validated — Task 3 Step 6
- [ ] Memory leak validation passed — Task 3 Step 7
- [ ] API validation passed — Task 3 Step 8
- [ ] Database validation passed — Task 3 Step 9
- [ ] Visual regression passed — Task 3 Step 10
- [ ] Browser compatibility passed — Task 3 Step 11
- [ ] Responsive validation passed — Task 3 Step 12 + Task 2 Step 9
- [ ] Build passed — Task 2 Step 1
- [ ] TypeScript passed — Task 1 Step 8, Task 2 Step 1
- [ ] ESLint passed — Task 1 Step 9, Task 2 Step 1
- [ ] Runtime console clean — Task 2 Step 10
- [ ] Network clean — Task 3 Step 8
- [ ] Git diff reviewed — Task 3 Step 14
- [ ] Code review completed — (external step: request review per `superpowers:requesting-code-review` before merge)
- [ ] Manual QA completed — Task 2
- [ ] Regression testing completed — Task 3 Step 13
- [ ] Acceptance criteria verified with evidence — Acceptance Criteria Mapping table, populated with real results

**Completion Rule (binding for all of Task 3 and the plan as a whole):** No task, acceptance criterion, or the overall feature may be marked complete without actual recorded evidence. Where evidence is unavailable, the status is **NOT VERIFIED**, **BLOCKED**, or **FAILED** — with a stated reason — never an assumed PASS. Do not infer success from reading the implementation code. Do not expand scope beyond what is described in this plan (Task 1: `components/location/LocationPicker.tsx` only).

---

## Deliverables (fill in after Task 2 and Task 3 complete)

1. Root cause analysis — see "Root Cause Analysis" section above.
2. Scope decision and evidence — see "Scope Verification" section above.
3. Files modified — `components/location/LocationPicker.tsx` only.
4. Diff summary — from `git diff` after Task 1's commit.
5. UI verification — Task 2, Steps 2-6, 9-10.
6. Supabase verification — Task 2, Steps 2 and 4 (row-count checks); Task 3, Step 9.
7. Network verification — Task 2, Step 2 (no POST on saved-address selection); Task 3, Step 8.
8. TypeScript/lint/build verification — Task 2, Step 1.
9. Regression verification — Task 2, Steps 6-8; Task 3, Step 13.
10. Production readiness verification — Task 3, Steps 1-16 (architecture, performance, accessibility, error handling, edge cases, state transitions, memory, API, database, visual, browser, responsive, git, rollback, release checklist).
11. Acceptance-criteria table (Verified / Not Verified / Failed, with evidence) — populate the "Acceptance Criteria Mapping" table above with actual PASS/FAIL/BLOCKED per AC after Task 2 and Task 3 complete. Do not state the feature is complete until that table has real evidence, not expected behavior.
