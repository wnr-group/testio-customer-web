# Delivery OTP Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the customer their delivery OTP on the Order Detail page, live and without refresh, once a delivery partner is assigned — so they can read it aloud to the partner instead of it being sent by SMS.

**Architecture:** The OTP already exists end-to-end in production — it's generated and persisted on `delivery_assignments.otp_code` by backend edge functions in the sibling `testio-customer` repo, and the Delivery App already validates it there. This repo (`testio-customer-web`) simply never queries that table. The fix is additive and frontend-only: fetch `delivery_assignments` for the order alongside the existing `orders` fetch, subscribe to its realtime changes the same way `useRealtimeOrder` already does for `orders.status`, and render a new card gated on assignment status.

**Tech Stack:** Next.js 16 App Router, Supabase JS client (`@supabase/supabase-js` v2, browser client via `lib/supabase/client.ts`), Supabase Realtime `postgres_changes`, Tailwind v4 (no config file, CVA-based `components/ui/*`), `sonner` for toasts.

## Global Constraints

- No backend changes — this repo has no `supabase/migrations` or `supabase/functions` directory; the OTP column, its generation, and its validation already exist and are owned by the sibling `testio-customer` repo. Do not attempt to create or edit anything under `supabase/` here.
- No new npm dependencies. No new test framework (confirmed with the user: this repo has zero test infrastructure today — no Jest/Vitest, no test script — and the user chose to keep it that way for this feature; verification is typecheck + lint + build + manual QA).
- Never log, persist to `localStorage`, or send the OTP value to analytics. Only `console.error` on fetch *failure* (never log fetched OTP values), matching the existing pattern for `cookPhone`/order-load errors in `app/(auth)/order/[id]/page.tsx`.
- Match existing file conventions exactly: this page hardcodes hex Tailwind values (`#091A36`, `#D61A22`, `#FAF8F8`, `slate-*`) rather than the CSS-variable design tokens in `app/globals.css` — new UI in this file must match that, not introduce a second color system into the same page.
- Reuse `components/ui/card.tsx` (`Card`) and `components/ui/button.tsx` (`Button`, variant `"outline"` already used for Cancel Order) — no new primitive components.

---

## Context: Architecture & Root Cause (evidence, Phases 1–2)

**Where the OTP lives today** (confirmed via `types/database.types.ts:441-503`, generated from the live schema):

`delivery_assignments` table — columns: `id, order_id, partner_id, status, otp_code, delivery_fee, distance_km, broadcast_at, assigned_at, picked_up_at, delivered_at, created_at, updated_at`. `otp_code: string | null` (4-digit numeric string). FK `delivery_assignments.order_id → orders.id`.

`orders` table (`types/database.types.ts:794-878`) has **no** OTP column — it never did; OTP was designed to live on the assignment, not the order.

**RLS already permits the customer to read it.** The sibling repo's migration `20260521000002_delivery_rls_policies.sql:60-64` defines:
```sql
CREATE POLICY "Customers can read assignments for their orders"
  ON delivery_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE id = delivery_assignments.order_id AND customer_id = auth.uid()));
```
This is row-level (not column-level), so a customer who can see their own assignment row can already see `otp_code` — no RLS change needed. `types/database.types.ts` having this table typed confirms the migration is live against the actual database this repo talks to.

**Root cause the OTP isn't shown:** `app/(auth)/order/[id]/page.tsx:101-108` fetches `orders` with an explicit column list (not `select("*")`) that was never going to include OTP (it isn't on `orders`). Critically, **the page never queries `delivery_assignments` at all** — no `.from("delivery_assignments")` call exists anywhere in this repo. Realtime is the same story: `hooks/useRealtimeOrder.ts:27-38` subscribes only to `postgres_changes` `UPDATE` on table `orders`, and even discards every field except `.status` (line 36: `setStatus((payload.new as { status: OrderStatus }).status)`). So even if OTP were added to `orders`, this hook would silently drop it. This is a pure omission, not a backend limitation, API sanitization, or a DTO/serializer issue — there is no DTO/serializer layer in this repo at all (direct Supabase client queries).

**Order status values** (`hooks/useRealtimeOrder.ts:6-16`, duplicated in `components/order/StatusStepper.tsx:6-16`, backed by a Postgres CHECK constraint per the sibling repo, not a native enum): `pending | accepted | preparing | ready | delivery_assigned | picked_up | delivered | completed | cancelled | rejected`.

**Assignment status values** (sibling repo CHECK constraint, `20260521000000_delivery_tables.sql`): `broadcast | assigned | picked_up | delivered | cancelled | expired`. `OrderTrackingMap.tsx:74-79` already treats `assigned` and `picked_up` as the two meaningful "partner is actively working this delivery" states (its `currentLeg` function branches only on those two) — this plan reuses that same distinction for OTP visibility, so the new UI's notion of "delivery in progress" matches the existing map's.

## Design Review — why this is the smallest safe change (Phase 3)

- **No API/schema changes**: reads an existing, already-RLS-scoped table with a plain `select()`, the same way `order_items` is already queried on this page.
- **No new realtime mechanism**: new hook is a structural copy of `useRealtimeOrder` (same `channel()` + `postgres_changes` + cleanup pattern), so it carries no new risk class into the codebase — reviewers already know how to reason about this shape.
- **No touch to unrelated flows**: checkout, cart, payments, reviews, cook flow, admin, notifications are untouched. The only existing file modified is `app/(auth)/order/[id]/page.tsx`, and the edit is additive (new state, new query alongside existing ones, new conditionally-rendered card) — no existing branch of that file's logic changes.
- **Fails closed**: if the `delivery_assignments` fetch errors or returns nothing (e.g. pickup orders, which never get an assignment row), the card simply never renders — order detail page keeps working exactly as it does today.

## Security Review (Phase 6, confirmed by design, not just intent)

- **Customer isolation**: enforced by existing Postgres RLS (`orders_customer_select` + `delivery_assignments` policy above) — a customer can only ever have a row returned for an order they own. No client-side filtering is relied on for security.
- **No OTP in logs**: fetch error paths log `error`, never the row/OTP. No `console.log` of `otp_code` anywhere in this plan.
- **No storage**: OTP lives only in React state (`useState`), never written to `localStorage`/`sessionStorage`/cookies.
- **No analytics leakage**: no analytics calls exist in this file today; none are added.
- **Visibility gating** (UI requirement, not a security boundary — RLS already restricts *who* can fetch it; this restricts *when* it's shown): OTP card renders only when `order.delivery_type === "delivery"`, `currentAssignment.status` is `"assigned"` or `"picked_up"`, and `currentStatus` (order-level) is not `"cancelled"` or `"rejected"`. It is never shown before a partner is assigned, and disappears once the order is `delivered`/`completed` or cancelled.

## Regression Analysis (Phase 7)

Modules touched: **Order Detail page only** (new state + one new query + one new hook call + one new conditionally-rendered card). Everything else on the page — status stepper, live tracking map, cook-call card, itemized bill, cancel button — reads and renders exactly as before; no existing state variable, query, or conditional is changed. Checkout, Cart, Orders list, Profile, Addresses, Reviews, Payments, Cook Details, Notifications, Authentication, Order History: **zero files touched**, confirmed by this plan's task file list below.

---

## Task 1: `useRealtimeDeliveryAssignment` hook

**Files:**
- Create: `hooks/useRealtimeDeliveryAssignment.ts`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/client` (existing browser Supabase client factory, already used identically in `hooks/useRealtimeOrder.ts:4`).
- Produces: `useRealtimeDeliveryAssignment(orderId: string): { assignment: DeliveryAssignmentRow | null }`, plus exported types `DeliveryAssignmentStatus` and `DeliveryAssignmentRow` — consumed by Task 2 (page fetch) and Task 4 (page wiring).

- [ ] **Step 1: Create the hook**

```ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type DeliveryAssignmentStatus =
  | 'broadcast'
  | 'assigned'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'expired'

export interface DeliveryAssignmentRow {
  status: DeliveryAssignmentStatus
  otp_code: string | null
}

export function useRealtimeDeliveryAssignment(orderId: string) {
  const [assignment, setAssignment] = useState<DeliveryAssignmentRow | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!orderId) return

    const channel = supabase
      .channel(`delivery-assignment-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setAssignment(null)
            return
          }
          setAssignment(payload.new as DeliveryAssignmentRow)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { assignment }
}
```

Notes on why this shape:
- `event: '*'` (not just `'UPDATE'` like `useRealtimeOrder`) because the assignment row is `INSERT`ed when a partner accepts/is broadcast the delivery (with `otp_code` already set at that point, per `accept-order/index.ts:70-84` and `broadcast-delivery/index.ts:69-83` in the sibling repo) and then `UPDATE`d as `status` moves `assigned → picked_up → delivered`. Missing `INSERT` would mean the OTP never appears until some unrelated update touched the row.
- This hook intentionally does **not** do an initial fetch — exactly like `useRealtimeOrder`, it only reports live changes; Task 2 does the initial fetch as part of the page's existing `load()` function, matching the codebase's established split (page owns initial GET, hook owns realtime deltas).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (this file has no consumers yet, so it must compile standalone — check for typos/import errors only).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors or warnings for the new file.

- [ ] **Step 4: Commit**

```bash
git add hooks/useRealtimeDeliveryAssignment.ts
git commit -m "feat: add realtime hook for delivery_assignments changes"
```

---

## Task 2: Fetch the delivery assignment on Order Detail page load

**Files:**
- Modify: `app/(auth)/order/[id]/page.tsx:1-155` (imports + `load()`)

**Interfaces:**
- Consumes: `DeliveryAssignmentRow` type from Task 1 (`@/hooks/useRealtimeDeliveryAssignment`).
- Produces: page-level `assignment` state of type `DeliveryAssignmentRow | null`, consumed by Task 4's visibility gate.

- [ ] **Step 1: Import the new type**

In `app/(auth)/order/[id]/page.tsx`, change the existing hook import (currently line 9):

```ts
import { useRealtimeOrder, type OrderStatus } from "@/hooks/useRealtimeOrder";
```

to also import the new type (kept as a separate import line — the two hooks are unrelated modules, don't merge the imports):

```ts
import { useRealtimeOrder, type OrderStatus } from "@/hooks/useRealtimeOrder";
import type { DeliveryAssignmentRow } from "@/hooks/useRealtimeDeliveryAssignment";
```

- [ ] **Step 2: Add `assignment` state**

Immediately after the existing state declarations (currently `page.tsx:81-87`, ending at `const [cookPhoneLoading, setCookPhoneLoading] = useState(true);`), add:

```ts
  const [assignment, setAssignment] = useState<DeliveryAssignmentRow | null>(null);
```

- [ ] **Step 3: Fetch the assignment row inside `load()`**

In the `load()` function, immediately after the existing `order_items` fetch block (currently `page.tsx:130-134`):

```ts
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("id, quantity, unit_price, total_price, dishes ( name, image_url )")
        .eq("order_id", id);
      setItems((itemsData as unknown as OrderItemRow[]) ?? []);
```

add:

```ts

      const { data: assignmentData, error: assignmentError } = await supabase
        .from("delivery_assignments")
        .select("status, otp_code")
        .eq("order_id", id)
        .maybeSingle();
      if (assignmentError) {
        console.error("Fetch delivery assignment error:", assignmentError);
      } else if (isMounted) {
        setAssignment(assignmentData as DeliveryAssignmentRow | null);
      }
```

`.maybeSingle()` (not `.single()`) is required here — pickup orders, and delivery orders before broadcast, will have zero matching rows, which `.single()` treats as an error but `.maybeSingle()` returns as `null` cleanly (this mirrors the existing `reviews` lookup two blocks below at `page.tsx:137-141`, which also uses `.maybeSingle()` for the same "may legitimately not exist yet" reason).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors or warnings.

- [ ] **Step 6: Manual verification**

Run `npm run dev`, sign in as a customer with an existing delivery order in the `preparing`/`ready` state (or use Supabase Studio to manually insert a `delivery_assignments` row with `status='assigned'`, `otp_code='1234'` for a test order you own), open `/order/<id>`, and confirm in the Network tab that a `delivery_assignments` query fires and returns the row (nothing renders yet — this task only wires the fetch, Task 4 wires the UI). Also open a **pickup**-type order and confirm no console error appears (the `.maybeSingle()` returning `null` for a nonexistent row must not throw).

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)/order/[id]/page.tsx"
git commit -m "feat: fetch delivery assignment alongside order detail"
```

---

## Task 3: `DeliveryOtpCard` component

**Files:**
- Create: `components/order/DeliveryOtpCard.tsx`

**Interfaces:**
- Consumes: `Card` from `@/components/ui/card`, `Button` from `@/components/ui/button`, `toast` from `sonner`, `Copy`/`Check` icons from `lucide-react` — all already used identically elsewhere in `app/(auth)/order/[id]/page.tsx`.
- Produces: `export default function DeliveryOtpCard({ otp }: { otp: string })` — a self-contained card, consumed by Task 4.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeliveryOtpCardProps {
  otp: string;
}

export default function DeliveryOtpCard({ otp }: DeliveryOtpCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      toast.success("OTP copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy OTP");
    }
  };

  return (
    <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
      <div>
        <p className="font-bold text-[#091A36] text-sm">Delivery OTP</p>
        <p className="text-slate-400 text-[11px] font-semibold mt-0.5">
          Share this code with your delivery partner to confirm delivery
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-2xl font-extrabold text-[#D61A22] tracking-[0.35em] tabular-nums">
          {otp}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          className="border-slate-200 text-[#091A36] hover:bg-slate-50 rounded-xl font-bold text-xs tracking-wider uppercase h-9 flex items-center gap-1.5 shrink-0 shadow-none"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Card>
  );
}
```

Design notes: color/spacing/radius classes are copied verbatim from the sibling "Cook Info Card" pattern (`page.tsx:270`) so this card is visually indistinguishable in style from the rest of the page. Copy button reuses the existing `Button` `"outline"` variant (already used for Cancel Order, `page.tsx:395`) and the existing `sonner` toast (already used for every other success/error message on this page) — no new UI pattern introduced.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors or warnings.

- [ ] **Step 4: Commit**

```bash
git add components/order/DeliveryOtpCard.tsx
git commit -m "feat: add DeliveryOtpCard component"
```

---

## Task 4: Wire the OTP card into Order Detail page with visibility gating

**Files:**
- Modify: `app/(auth)/order/[id]/page.tsx`

**Interfaces:**
- Consumes: `useRealtimeDeliveryAssignment` (Task 1), `assignment` state (Task 2), `DeliveryOtpCard` (Task 3).
- Produces: final rendered feature — no further tasks depend on this one.

- [ ] **Step 1: Import the hook and component**

Add to the top imports (near the other `@/hooks` and `@/components/order` imports):

```ts
import { useRealtimeDeliveryAssignment } from "@/hooks/useRealtimeDeliveryAssignment";
import DeliveryOtpCard from "@/components/order/DeliveryOtpCard";
```

- [ ] **Step 2: Call the realtime hook and merge with fetched state**

Immediately after the existing `const { status: liveStatus } = useRealtimeOrder(id);` (currently `page.tsx:89`), add:

```ts
  const { assignment: liveAssignment } = useRealtimeDeliveryAssignment(id);
```

Immediately after the existing `const currentStatus: OrderStatus = ...` line (currently `page.tsx:157`), add the merged assignment and the visibility gate:

```ts
  const currentAssignment = liveAssignment ?? assignment;
  const showDeliveryOtp =
    order != null &&
    order.delivery_type === "delivery" &&
    !!currentAssignment?.otp_code &&
    (currentAssignment.status === "assigned" || currentAssignment.status === "picked_up") &&
    currentStatus !== "cancelled" &&
    currentStatus !== "rejected";
```

This is evaluated on every render (cheap boolean derivation, same pattern as the existing `canCancel` on the next line) — no extra state, no extra effect.

- [ ] **Step 3: Render the card**

In the JSX, immediately after the existing Live Tracking Map block and before the Cook Info Card (currently `page.tsx:260-267`, ending `)}`), add:

```tsx
        {/* Delivery OTP — only while a partner is actively assigned/en route */}
        {showDeliveryOtp && <DeliveryOtpCard otp={currentAssignment!.otp_code!} />}
```

Placed between the tracking map and the Cook Info card so the two delivery-in-progress cards (map, then OTP) read together before the static Cook Info card.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (The non-null assertions on `currentAssignment!.otp_code!` are safe because `showDeliveryOtp` already checked both are truthy in the same expression — TypeScript's control-flow narrowing doesn't cross the `&&` into the JSX conditional here since `currentAssignment` is a `const` derived value, not directly narrowed by the `{showDeliveryOtp && ...}` JSX check, so the assertions are required and correct.)

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors or warnings.

- [ ] **Step 6: Manual verification — normal flow**

1. `npm run dev`, sign in as a customer.
2. Using Supabase Studio (or the sibling Delivery App / edge functions if you have them running locally), drive a real delivery order through: `pending → accepted → preparing → ready`, then have a delivery partner accept it so `delivery_assignments` gets created with `status='assigned'` and a 4-digit `otp_code`.
3. On `/order/<id>`, confirm: no page refresh needed — the OTP card appears live within a few seconds of the assignment being created (Realtime `INSERT`), showing the 4-digit code.
4. Click "Copy" — confirm a toast reads "OTP copied" and the code is on the clipboard (paste to verify).
5. Advance the assignment to `picked_up` — confirm the card stays visible (code unchanged).
6. Advance the order to `delivered`/`completed` — confirm the OTP card disappears live, without refresh.
7. Refresh the page mid-flow (while `status='assigned'`) — confirm the card still shows the OTP (proves the initial fetch from Task 2 works, not just realtime).
8. Log out and back in mid-flow — confirm the card still shows correctly after re-auth.

- [ ] **Step 7: Manual verification — edge cases**

- **Pickup order**: confirm the card never appears (no assignment row is ever created for `delivery_type='pickup'`).
- **Cancelled order**: cancel an order via the existing Cancel Order button before assignment — confirm no OTP card ever appears; if cancelled after assignment exists, confirm the card disappears (gated on `currentStatus !== "cancelled"`).
- **Rejected order**: confirm no OTP card (gated on `currentStatus !== "rejected"`).
- **Before assignment** (`status` in `pending/accepted/preparing/ready` with no `delivery_assignments` row yet): confirm no card, no console error.
- **`broadcast` status** (assignment row exists, no partner accepted yet): confirm no card (gated on status being `assigned`/`picked_up` specifically).
- **Multiple tabs**: open the same order in two tabs, trigger an assignment status change in a third context — confirm both tabs update live.
- **Network offline → reconnect**: use browser devtools to go offline, then online — confirm the Realtime channel reconnects and subsequent status changes still propagate (Supabase Realtime's client handles reconnection automatically; verify no crash/stuck state in the console).
- **Cross-user access**: attempt to load another customer's order id directly in the URL — confirm the existing `orders_customer_select` RLS policy causes the base order fetch to fail/redirect exactly as it does today (unchanged behavior — this task doesn't touch that gate), so the OTP fetch is never reached for another customer's order.
- **Responsive**: resize to mobile width — confirm the card's `flex-col sm:flex-row` layout stacks the label above the code+button cleanly (same responsive pattern as the existing Cook Info Card).
- **Console check**: throughout all of the above, confirm zero console errors/warnings and no `otp_code` value ever appears in a `console.log`/`console.error` call (search the diff for `console.` calls involving `assignment` — the only one added is the error-path log in Task 2, which logs the Supabase `error` object, never `assignmentData`).

- [ ] **Step 8: Commit**

```bash
git add "app/(auth)/order/[id]/page.tsx"
git commit -m "feat: display delivery OTP on order detail page"
```

---

## Task 5: Production validation (Phase 9)

**Files:** none (verification only).

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Expected: exits 0, no errors or warnings anywhere in the repo (not just changed files).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: exits 0. Confirm the build output lists `/order/[id]` as a route with no new build warnings, and no hydration-mismatch warnings in the build log (this page is `"use client"` throughout, so there's no server/client markup split to mismatch, but confirm anyway).

- [ ] **Step 4: Preview the production build**

Run: `npm run start` (after `npm run build`), open `/order/<id>` for a test delivery order in the `assigned`/`picked_up` state.
Expected: OTP card renders identically to the dev-mode manual verification in Task 4, confirming no dev-only behavior was relied upon.

- [ ] **Step 5: Re-run the full manual QA checklist from Task 4, Steps 6–7, against the production build**

Expected: identical results to dev mode — normal flow, all edge cases, responsive, console-clean.

- [ ] **Step 6: Final acceptance check**

Confirm every item is true before considering this plan complete:
- [ ] Architecture and root cause documented above, with file:line evidence (done in this plan's Context section).
- [ ] No backend/API/schema changes made (confirmed — only files touched are `hooks/useRealtimeDeliveryAssignment.ts`, `components/order/DeliveryOtpCard.tsx`, `app/(auth)/order/[id]/page.tsx`).
- [ ] `npx tsc --noEmit` passes with zero errors.
- [ ] `npm run lint` passes with zero errors/warnings.
- [ ] `npm run build` passes.
- [ ] Manual QA (Task 4 Steps 6–7) passed against both dev and production builds, including cancelled/rejected/pickup/pre-assignment/broadcast-only edge cases, multi-tab, offline/reconnect, cross-user, responsive, and console-clean checks.
- [ ] No `console.log`/analytics call ever includes the OTP value (verified by diff review).
- [ ] No regression to Checkout, Cart, Orders list, Profile, Addresses, Reviews, Payments, Cook Details, Notifications, Authentication, or Order History — none of those files were touched by this plan.

If any box is unchecked, the feature is not done — return to the relevant task instead of committing further.
