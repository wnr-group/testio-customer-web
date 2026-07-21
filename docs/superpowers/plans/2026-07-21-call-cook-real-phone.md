# Call Cook — Real Phone Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "Call Cook" button on the Order Detail page show the cook's real phone number (sourced from `public.users.phone` via the order's cook) and let the customer call it, instead of the current static "Calling coming soon" disabled placeholder.

**Architecture:** Add a `SECURITY DEFINER` Postgres RPC, `get_order_cook_phone(p_order_id uuid)`, that returns the cook's phone only when the calling customer owns that order. The Order Detail page's existing client-side `load()` effect calls this RPC once (no extra network round trips beyond the one call, no N+1) and renders the button as a live `tel:` link with the number, or a "Phone unavailable" disabled state on any failure/missing data.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@supabase/ssr` browser client, Tailwind v4 + `class-variance-authority` (`components/ui/button.tsx`), Postgres/Supabase (SQL editor — this repo has no `supabase/` migrations directory).

## Global Constraints

- Scope is the Order Detail page's Call Cook button only (`app/(auth)/order/[id]/page.tsx`). The Cook Profile browse page's Call Cook button (`app/(browse)/cook/[id]/page.tsx`) is explicitly out of scope per product decision and must not be touched.
- No Exotel/masked-number code exists client-side today (confirmed by repo-wide search — see Root Cause Analysis below) — this is an additive implementation, not a removal/replacement of working logic. Do not touch the `masked_calls`/`exotel_sid` DB schema; it is unused and out of scope.
- This repo has no `supabase/` directory (no local migrations, no edge functions source). The one backend change (the RPC) ships as a manual SQL step run directly in the Supabase SQL Editor by a human with project access — it cannot be authored as a file in this repo.
- Never duplicate the existing order query. Extend the page's data loading, don't add a second `orders` fetch. One RPC call per Order Detail page view is acceptable (not per item, not per render).
- Must never crash the page: null phone, missing cook, or RPC error all render the same "Phone unavailable" disabled state.
- No component rewrites, folder restructuring, or design changes — reuse the existing Cook Info card layout and the same primary-action button color (`#D61A22`/`#b21018`) already used elsewhere on this exact page (the "Rate your order" button).
- This repo has no test runner configured (no jest/vitest/playwright, no `*.test.ts(x)` files outside `node_modules`) and no `npm run typecheck` script (only `dev`, `build`, `start`, `lint` exist in `package.json`). Verification uses `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manual browser QA — do not introduce a test framework as part of this change.

---

## Root Cause Analysis (Phase 1 & 2 findings)

**Current flow (Order Detail → Call Cook):**

```
OrderDetailPage (app/(auth)/order/[id]/page.tsx)
  → load() effect: supabase.from("orders").select(...).eq("id", id).single()
  → Cook Info Card renders kitchen name/image from the same query
  → Call Cook button: <Button disabled title="Calling coming soon"> — static, no data source, no click handler
```

There is **no masked-number/Exotel logic in this repository at all**. Confirmed via repo-wide search:

| Term | Result |
|---|---|
| `Exotel` / `exotel` | Only `types/database.types.ts:645/655/665` (generated type for `masked_calls.exotel_sid` — an unused table, no code references it) |
| `masked_calls` / `masked_number` | Only the same generated type block (`types/database.types.ts:640-694`) |
| `Call Cook` | `app/(auth)/order/[id]/page.tsx:266` (disabled button, "Calling coming soon") and `app/(browse)/cook/[id]/page.tsx:210` (disabled button, "Masked calling is not available on web yet" — **out of scope**, see Global Constraints) |
| `phone_number` / `cook.phone` | No matches — these field names don't exist in the schema |
| `phone` (schema) | Exists on `public.users.phone` (NOT NULL), `public.delivery_partners.phone`, `public.otp_rate_limits.phone` — **not** on `public.cook_profiles`, which has no phone column at all |

**Where the cook's real phone actually lives:** `cook_profiles` has no phone field. The FK chain is:

```
orders.cook_id → cook_profiles.id
cook_profiles.user_id → users.id
users.phone   ← the actual number
```

(`orders.customer_id → users.id` is the separate FK for the ordering customer — confirmed in `types/database.types.ts:791-875`.)

**Why a direct client-side nested select is not used:** The existing order query already embeds `cook_profiles ( kitchen_name, profile_image_url )` via PostgREST, so extending it to `cook_profiles ( ..., users ( phone ) )` is technically possible — but that requires an RLS policy on `public.users` permitting one customer to `SELECT` another user's (the cook's) row. This repo has no visibility into that policy (no `supabase/` directory here), and the existing pattern in this exact file (`handleCancelOrder`, `app/(auth)/order/[id]/page.tsx:138-141`) shows the codebase already hit this class of problem once — "orders has no customer UPDATE RLS policy" — and solved it by routing through a privileged server-side function rather than assuming/widening RLS. A `SECURITY DEFINER` RPC follows that same established pattern: it keeps the "does this customer own this order" authorization check in one auditable place, and doesn't require (or risk) opening broader read access to `users.phone`.

---

## Task 1: Create the `get_order_cook_phone` Supabase RPC

**Files:**
- None in this repo (no `supabase/` directory exists). This is a manual step run in the Supabase SQL Editor by whoever has project access (confirmed available).

**Interfaces:**
- Produces: a Postgres function `public.get_order_cook_phone(p_order_id uuid) returns text`, callable from the browser via `supabase.rpc("get_order_cook_phone", { p_order_id: string })`, returning the cook's phone as a string, or `null` if the order doesn't exist, doesn't belong to the calling customer, or the cook/phone can't be resolved.

- [ ] **Step 1: Run the function-creation SQL in the Supabase SQL Editor**

```sql
create or replace function public.get_order_cook_phone(p_order_id uuid)
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
  from public.orders o
  join public.cook_profiles cp on cp.id = o.cook_id
  join public.users u on u.id = cp.user_id
  where o.id = p_order_id
    and o.customer_id = auth.uid();

  return v_phone;
end;
$$;

revoke all on function public.get_order_cook_phone(uuid) from public;
grant execute on function public.get_order_cook_phone(uuid) to authenticated;
```

Expected: `CREATE FUNCTION` / `REVOKE` / `GRANT` all succeed with no errors.

- [ ] **Step 2: Verify the function is registered with the correct security mode**

```sql
select proname, prosecdef
from pg_proc
where proname = 'get_order_cook_phone';
```

Expected: one row, `prosecdef = true` (confirms `SECURITY DEFINER` is active).

- [ ] **Step 3: Verify authorization behavior with a real order**

Pick a real `order_id` that belongs to a real customer (`customer_id`) with a cook that has a `users.phone` value set. The SQL Editor session has no JWT, so `auth.uid()` is `NULL` there by default — simulate the customer's session explicitly:

```sql
begin;
select set_config('request.jwt.claims', json_build_object('sub', '<customer_user_id>')::text, true);
set local role authenticated;
select public.get_order_cook_phone('<order_id>');
rollback;
```

Expected: returns the cook's phone number as text (not null).

Then verify the negative case — a *different* customer's id must not get the phone:

```sql
begin;
select set_config('request.jwt.claims', json_build_object('sub', '<some_other_user_id>')::text, true);
set local role authenticated;
select public.get_order_cook_phone('<order_id>');
rollback;
```

Expected: returns `null`.

- [ ] **Step 4: Confirm the change is live (no separate deploy step needed)**

Supabase SQL Editor changes apply immediately to the project's Postgres instance — the RPC is callable from the app as soon as Step 1 completes. Record the order id(s) used in Step 3 for reuse in Task 3's manual QA.

---

## Task 2: Wire the real phone number into the Order Detail page

**Files:**
- Modify: `app/(auth)/order/[id]/page.tsx`

**Interfaces:**
- Consumes: `supabase.rpc("get_order_cook_phone", { p_order_id: string })` from Task 1, returning `{ data: string | null, error: PostgrestError | null }`.
- Produces: no new exports — this is a leaf page component.

- [ ] **Step 1: Add phone state and import `buttonVariants` + `cn`**

In `app/(auth)/order/[id]/page.tsx`, update the imports (around line 11):

```tsx
import { Button, buttonVariants } from "@/components/ui/button";
```

Add near the top of the file, after the other imports:

```tsx
import { cn } from "@/lib/utils";
```

- [ ] **Step 2: Add state for the cook's phone**

In `OrderDetailPage`, alongside the existing state declarations (around line 67-71):

```tsx
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasReview, setHasReview] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cookPhone, setCookPhone] = useState<string | null>(null);
  const [cookPhoneLoading, setCookPhoneLoading] = useState(true);
```

- [ ] **Step 3: Fetch the phone number in the existing `load()` effect**

In the `load()` function, right after `setOrder(orderData as unknown as OrderRow);` (currently line 99), insert:

```tsx
      setOrder(orderData as unknown as OrderRow);

      const { data: phoneData, error: phoneError } = await supabase.rpc(
        "get_order_cook_phone",
        { p_order_id: id }
      );
      if (phoneError) {
        console.error("Fetch cook phone error:", phoneError);
      }
      setCookPhone(typeof phoneData === "string" && phoneData.trim() ? phoneData : null);
      setCookPhoneLoading(false);
```

This reuses the same `load()` call already running for the order — no duplicate `orders` fetch, exactly one additional network call per page view.

- [ ] **Step 4: Replace the disabled Call Cook button with the live/fallback states**

Replace the current button block (lines 260-267):

```tsx
          <Button
            disabled
            title="Calling coming soon"
            className="bg-slate-100 text-slate-400 hover:bg-slate-100 rounded-xl font-bold text-xs tracking-wider uppercase h-9 flex items-center gap-1.5 cursor-not-allowed shrink-0 shadow-none"
          >
            <Phone className="size-3.5" />
            Call Cook
          </Button>
```

with:

```tsx
          {cookPhoneLoading ? (
            <Button
              disabled
              className="bg-slate-100 text-slate-400 hover:bg-slate-100 rounded-xl font-bold text-xs tracking-wider uppercase h-9 flex items-center gap-1.5 cursor-not-allowed shrink-0 shadow-none"
            >
              <Phone className="size-3.5" />
              Call Cook
            </Button>
          ) : cookPhone ? (
            <a
              href={`tel:${cookPhone}`}
              className={cn(
                buttonVariants({
                  className:
                    "h-auto flex-col items-start gap-0.5 px-4 py-2 bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl shrink-0",
                })
              )}
            >
              <span className="flex items-center gap-1.5 font-bold text-xs tracking-wider uppercase">
                <Phone className="size-3.5" />
                Call Cook
              </span>
              <span className="text-[11px] font-semibold normal-case tracking-normal opacity-90">
                {cookPhone}
              </span>
            </a>
          ) : (
            <Button
              disabled
              title="Phone unavailable"
              className="bg-slate-100 text-slate-400 hover:bg-slate-100 rounded-xl font-bold text-xs tracking-wider uppercase h-9 flex items-center gap-1.5 cursor-not-allowed shrink-0 shadow-none"
            >
              <Phone className="size-3.5" />
              Phone unavailable
            </Button>
          )}
```

- [ ] **Step 5: Type-check the change**

Run: `npx tsc --noEmit`
Expected: no errors (the Supabase browser client is untyped against `Database`, so `supabase.rpc("get_order_cook_phone", ...)` type-checks regardless of `types/database.types.ts` contents — confirmed via `lib/supabase/client.ts`, which calls `createBrowserClient` with no `Database` generic).

- [ ] **Step 6: Lint the change**

Run: `npm run lint`
Expected: no new warnings/errors in `app/(auth)/order/[id]/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)/order/[id]/page.tsx"
git commit -m "feat: show real cook phone number on Call Cook button"
```

---

## Task 3: Manual QA & Regression Verification

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: the RPC from Task 1 and the page change from Task 2.
- Produces: the verification evidence required by Deliverables (below) — do not report the feature complete until every item here has a recorded pass/fail.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts on `localhost:3000` with no build errors.

- [ ] **Step 2: Test 1 — Pending order**

Log in as a customer with a `pending` order whose cook has a `users.phone` set. Open `/order/[id]`.
Expected: the page's own loading skeleton clears as soon as the order/items data resolves — it no longer waits on the phone RPC. The Call Cook button independently shows its loading (disabled, grey) state and then shows the cook's real number on two lines ("Call Cook" / phone), no console errors.

- [ ] **Step 3: Test 2 — Ready order**

Repeat Step 2 for an order in `ready` status, for a *different* cook.
Expected: the phone shown matches that specific order's cook (verify against the `cook_profiles`/`users` row directly in Supabase), not a stale value from a previous page view.

- [ ] **Step 4: Test 3 — Completed order**

Repeat Step 2 for a `completed` order.
Expected: phone still displays correctly; "Rate your order" button (unrelated feature) still renders and functions as before.

- [ ] **Step 5: Test 4 — No phone on the cook's user row**

Using an order whose cook's `users.phone` is empty/whitespace only (or temporarily set one to `''` in a test row, then revert), open that order.
Expected: button renders the "Phone unavailable" disabled state, no crash, no console error.

- [ ] **Step 6a: Test 5a — Unauthorized order (redirect, no disclosure)**

Use an order id that doesn't belong to the logged-in customer. Open `/order/[id]`.
Expected: the page redirects to `/orders` with a "Order not found" toast before the phone RPC ever runs — no order detail, items, or phone data is disclosed.

- [ ] **Step 6b: Test 5b — Authorized order, RPC returns no phone**

Use an order id that *does* belong to the logged-in customer, but where `get_order_cook_phone` resolves to `null` (e.g. rely on Task 1 Step 3's negative-case SQL result as evidence since this is the same code branch as Test 4, or construct a case where the RPC's own logic returns no row for an authorized order).
Expected: the order page loads normally (order, items, status all render), and the Call Cook button settles into the "Phone unavailable" state with no crash.

- [ ] **Step 7: Test 6 — Network/RPC failure**

In browser DevTools, throttle to "Offline" right as the page loads, or block the Supabase RPC endpoint via DevTools request blocking.
Expected: `phoneError` is logged to the console, `cookPhoneLoading` still resolves to `false`, button falls back to "Phone unavailable" — page does not hang on the loading state and does not crash.

- [ ] **Step 8: Test 7 — Responsive**

Check the Order Detail page at desktop (≥1024px), tablet (~768px), and mobile (~375px) widths in DevTools device emulation.
Expected: the two-line Call Cook button wraps/aligns correctly inside the existing Cook Info card at all three widths, matching the existing "Rate your order" button's responsive behavior on the same page.

- [ ] **Step 9: Test 8 — Console**

With DevTools console open, reload the Order Detail page for a pending, ready, and completed order.
Expected: no new JS errors, no React warnings (e.g., no key warnings, no hydration mismatches) attributable to this change.

- [ ] **Step 10: Test 9 — TypeScript**

Run: `npx tsc --noEmit`
Expected: zero errors (repo has no `npm run typecheck` script — confirmed absent from `package.json`).

- [ ] **Step 11: Test 10 — Lint**

Run: `npm run lint`
Expected: no new warnings introduced versus the pre-change baseline.

- [ ] **Step 12: Test 11 — Production build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 13: Test 12 — Regression pass**

Manually click through and confirm unaffected by this change: Orders list (`/orders`), an in-progress order's realtime status updates (`useRealtimeOrder`), the Status Stepper, the Review page flow, the Cancel Order dialog (`handleCancelOrder`), Totals/Items rendering, Cart, Checkout, top-level navigation, and login/auth redirect (the `router.push("/login")` guard at the top of `load()`).
Expected: all behave exactly as they did before this change — no regressions.

- [ ] **Step 14: Record results**

For each of Steps 2-13, record pass/fail with what was observed (screenshot or console output where relevant). Do not mark the feature complete if any step fails — file it as a remaining risk instead per the plan's Deliverables.

---

## Deliverables (fill in after all tasks complete)

1. Root cause analysis — see "Root Cause Analysis" section above.
2. Files modified — `app/(auth)/order/[id]/page.tsx` (code) + one Postgres function `public.get_order_cook_phone` (Supabase SQL Editor, no repo file).
3. Why each file changed — Task 1/2 headers above state this per file.
4. Diff summary — from `git diff` after Task 2, Step 7's commit.
5. UI verification — Task 3, Steps 2-9.
6. Supabase verification — Task 1, Steps 2-3.
7. TypeScript verification — Task 3, Step 10.
8. Lint verification — Task 3, Step 11.
9. Build verification — Task 3, Step 12.
10. Regression verification — Task 3, Step 13.
11. Remaining risks — populate from any failed/blocked step in Task 3.
12. Acceptance-criteria mapping (Verified / Not Verified / Failed, with evidence) — populate after Task 3 completes; do not state the feature is complete until this table is filled in with real evidence.
