# Task 2: Wire the real phone number into the Order Detail page

**Context:** This task implements the client-side integration for displaying the cook's real phone number on the "Call Cook" button. The backend RPC (`get_order_cook_phone`) has already been created in Supabase (Task 1). Your job is to modify the Order Detail page to fetch and display the phone.

**Scope:** Single file modification: `app/(auth)/order/[id]/page.tsx`

**Key Requirements (from plan):**
- Add phone state (initial `null`, loading state `true`)
- Fetch the cook phone in the existing `load()` effect, but do not `await` it inline — fire the RPC and handle its result independently so it never blocks `setLoading(false)` or the rest of the page's loading flow
- Replace the disabled "Call Cook" button with three states:
  1. Loading: disabled, grey (while `cookPhoneLoading` is true)
  2. Success: active `tel:` link showing phone on two lines ("Call Cook" / number), red button (`#D61A22` / `#b21018`)
  3. Failure: disabled, grey "Phone unavailable" button (null/empty phone, RPC error, missing cook)
- Render only the button part—no layout changes, no component rewrites, no folder restructuring
- Use existing `buttonVariants` + `cn` from component library for styling consistency
- Handle all edge cases gracefully: null phone, missing cook, RPC error (log errors but don't crash)
- Never duplicate the existing order query (one RPC call per page view, max)

**Files to Modify:**
- `app/(auth)/order/[id]/page.tsx` — the Order Detail page

**Global Constraints (binding):**
- Scope is the Order Detail page's Call Cook button only. Do NOT touch the Cook Profile browse page's Call Cook button (`app/(browse)/cook/[id]/page.tsx`) — it is explicitly out of scope.
- Do NOT touch the `masked_calls`/`exotel_sid` DB schema or any existing code referencing them — they are unused.
- Do NOT crash the page: null phone, missing cook, or RPC error all render the same "Phone unavailable" disabled state.
- Do NOT add component rewrites, folder restructuring, or design changes — reuse the existing Cook Info card layout and the same primary-action button color already used elsewhere on this page (the "Rate your order" button).
- Do NOT add tests or a test framework — this repo has no test runner configured. Verification uses `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manual browser QA.

**Exact Implementation Steps (from plan's Task 2):**

1. **Update imports** (around line 11):
   ```tsx
   import { Button, buttonVariants } from "@/components/ui/button";
   ```
   Add near the top after imports:
   ```tsx
   import { cn } from "@/lib/utils";
   ```

2. **Add state** (around line 67-71, alongside existing state):
   ```tsx
   const [cookPhone, setCookPhone] = useState<string | null>(null);
   const [cookPhoneLoading, setCookPhoneLoading] = useState(true);
   ```

3. **Fetch phone in load() effect** (right after `setOrder(orderData as unknown as OrderRow);`):
   ```tsx
   setOrder(orderData as unknown as OrderRow);

   supabase.rpc(
     "get_order_cook_phone",
     { p_order_id: id }
   ).then(({ data: phoneData, error: phoneError }) => {
     if (phoneError) {
       console.error("Fetch cook phone error:", phoneError);
     }
     setCookPhone(typeof phoneData === "string" && phoneData.trim() ? phoneData : null);
   }).catch((err) => {
     console.error("Unhandled phone fetch error:", err);
   }).finally(() => {
     setCookPhoneLoading(false);
   });
   ```

4. **Replace the Call Cook button** (lines 260-267) with the conditional three-state render block shown in the plan.

**Verification After Implementation:**
- `npx tsc --noEmit` — zero errors
- `npm run lint` — no new warnings
- `npm run build` — build succeeds
- Manual QA: load an order with a cook phone, verify button shows the phone; test with missing/empty phone, verify fallback state

**Test Cases You Will Verify Manually:**
- Pending, Ready, Completed orders (different cooks and phone scenarios)
- Empty/missing phone → "Phone unavailable" state
- Network/RPC error → graceful fallback, logged error
- Responsive layout at desktop/tablet/mobile widths
- No new console errors or React warnings

**Report File:** Write your full report to `docs/superpowers/tasks/task-2-report.md` (create if it doesn't exist). Include:
- What you implemented and any deviations from the spec
- Test results (each manual QA case from the verification list)
- Any concerns or edge cases you observed
- Commits made (include sha7 of the commit)
