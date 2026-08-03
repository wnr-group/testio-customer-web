# Cook Open/Closed Status Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "is this cook open" resolve to the same answer everywhere (Home list, Explore list, Map, Cook detail — on both the web app and the mobile app) by defining the rule (`is_available AND has an in-stock dish today`) in exactly one place and having every consumer read that same source.

**Architecture:** Extract the rule that already lives inline inside `get_nearby_cooks` (`../testio-customer/supabase/migrations/20260517000001_nearby_cooks_kitchen_image.sql:34-40`) into a new shared Postgres function, `public.get_cook_open_status(p_cook_id uuid) returns boolean`. `get_nearby_cooks` is refactored to call this function instead of duplicating the `EXISTS(...)` subquery inline, so the list/map path is unchanged in behavior. Both cook-detail screens — which today derive "open" from the raw `is_available` column — are switched to call `get_cook_open_status` instead, fetched in parallel with the existing profile query (same pattern already used for `get_cook_phone` and `get_order_cook_phone` in this codebase).

**Tech Stack:** Next.js 16 App Router + `@supabase/supabase-js` (web, this repo), React Native/Expo Router + TanStack Query + `@supabase/supabase-js` (mobile, `../testio-customer`), Postgres/Supabase migrations (`../testio-customer/supabase/migrations/`).

## Global Constraints

- **Cross-repo change, confirmed with the user.** The `get_nearby_cooks` function and all Supabase migrations for this shared backend live in the sibling repo `../testio-customer` (folder name `testio-customer`, *not* `testio-customer-frontend` as the ticket assumed — that name doesn't exist on disk; it appears to be a stale name inside `../testio-customer/CLAUDE.md`'s local-dev doc, line 170, which itself is out of sync with the actual folder). `testio-customer-web` (this repo) has no `supabase/migrations` directory at all — it only holds a Supabase *client* (`lib/supabase/client.ts`, `lib/supabase/server.ts`). This plan therefore touches three repos' worth of files: `../testio-customer` (migration), `testio-customer-web` (this repo, web client), and `../testio-customer` again (mobile client, same repo as the migration).
- **Mobile app included, confirmed with the user.** `../testio-customer/app/cook/[id]/index.tsx:76` (`const isOffline = cook?.is_available === false;`) has the identical bug and isn't in the ticket's affected-files list, but shares the same root cause — it's fixed in Task 3 below.
- **`MapView.tsx` needs no code change.** It was flagged in the ticket as worth checking; it was checked (`components/map/MapView.tsx:21,60`) — it only *renders* a caller-supplied `isOpen` prop, it never computes it. Both callers (`app/(auth)/home/page.tsx:220`, `app/(browse)/explore/page.tsx:98`) already pass through `c.is_open` from the `get_nearby_cooks` RPC, so there's no divergence here today. No task modifies this file.
- **Preserve `get_nearby_cooks`'s exact current rule, including its one existing quirk:** the function accepts a `today_date` param but its `EXISTS(...)` dish check never actually filters by date — it only checks `is_available = true AND ordered_quantity < max_quantity` on the `dishes` row, regardless of `available_date`. This plan replicates that rule exactly (bug-for-bug) inside the new shared function. Fixing the missing date filter is a separate, unrequested behavior change and is out of scope — flag it as a follow-up, don't fix it here.
- Both cook-profile RLS (`cook_profiles_select`) and dish RLS (`dishes_customer_select`) already let anon/authenticated read approved cooks' available dishes directly (`../testio-customer/supabase/migrations/20260410000004_create_rls_policies.sql:21-32`), and `get_nearby_cooks` itself has no explicit `GRANT`/`REVOKE` (relies on Postgres's default `PUBLIC EXECUTE` grant). The new function follows the same convention — no explicit grants — so it stays callable by anon on `/explore` and `/cook/[id]` for logged-out visitors, matching today's access level.
- Neither repo has a test runner (no jest/vitest, no `*.test.ts(x)` outside `node_modules` in either `testio-customer-web` or `../testio-customer`). Verification uses `npx tsc --noEmit` (both repos have a root `tsconfig.json`), `npm run lint`, SQL run directly against the local Supabase Postgres instance, and manual QA. Do not introduce a test framework as part of this change.
- `testio-customer-web/package.json` has no `supabase` CLI setup of its own; `types/database.types.ts` in that repo is a manually-synced copy of the generated Supabase types (there is no `gen-types` script in either repo's `package.json`). Task 2 edits it by hand in the same style as its existing entries. `../testio-customer/types/database.types.ts` is a separate, hand-written 157-line domain model (no `Functions`/`Tables` block, `useCookProfile.ts` doesn't use it as a generic) — it is **not** touched by Task 3.
- Local Supabase ports for `../testio-customer` (`supabase/config.toml`): API `54341`, DB `54333`, Studio `54343`.

---

## Root Cause Analysis

**Today:**
- Home (`app/(auth)/home/page.tsx:111-122`) and Explore (`app/(browse)/explore/page.tsx:48-57`) both call `supabase.rpc('get_nearby_cooks', ...)`. That RPC computes `is_open` server-side as `cp.is_available AND EXISTS(an available dish with stock left)` (`../testio-customer/supabase/migrations/20260517000001_nearby_cooks_kitchen_image.sql:33-40`). `CookCard.tsx:66` and `MapView.tsx`'s popup (via the `isOpen` marker prop) both render "CLOSED" purely from that field.
- The Cook detail page (`app/(browse)/cook/[id]/page.tsx:54-58`) does a plain `select("*")` on `cook_profiles` and displays "Open now"/"Offline" from the raw `cook.is_available` column only (`app/(browse)/cook/[id]/page.tsx:156,268,273`) — it never looks at `dishes` at all.
- The mobile cook detail screen (`../testio-customer/app/cook/[id]/index.tsx:76`, backed by `../testio-customer/hooks/useCookProfile.ts:50-67`) has the exact same gap: `useCookProfile` selects raw `is_available` from `cook_profiles` and nothing from `dishes`.
- Net effect: a cook with `is_available = true` but zero in-stock dishes shows "Closed" on Home/Explore/Map (correct, per the product rule) and "Open now" on both detail screens (wrong) — exactly the ticket's repro.

**Fix:** one shared SQL function, called by `get_nearby_cooks` (list/map, unchanged output) and directly by both detail screens (new).

---

## Task 1: Add a shared `get_cook_open_status` SQL function and reuse it in `get_nearby_cooks`

**Files:**
- Create: `../testio-customer/supabase/migrations/20260722000002_add_cook_open_status_function.sql`

**Interfaces:**
- Produces: `public.get_cook_open_status(p_cook_id uuid) returns boolean` — callable via `supabase.rpc('get_cook_open_status', { p_cook_id: string })`, returning `true` only if the cook is available *and* has at least one dish that's `is_available = true` and `ordered_quantity < max_quantity`; `false` if the cook doesn't exist, is unavailable, or has no in-stock dish. Consumed by Task 2 and Task 3.
- Consumes: nothing new — reads `cook_profiles` and `dishes`, the same tables `get_nearby_cooks` already reads.

- [ ] **Step 1: Write the migration file**

```sql
-- Extract the "is this cook open" rule (is_available AND has an in-stock
-- dish) into a single shared function so every consumer computes the same
-- answer. Previously get_nearby_cooks computed this inline for the
-- Home/Explore/Map list, while the cook detail page (both web and mobile)
-- derived "open" purely from the raw is_available column and never checked
-- dish stock — causing a cook with is_available=true but no in-stock dishes
-- to show "Closed" on the list and "Open now" on the detail page.
--
-- Note: intentionally does NOT filter dishes by available_date, matching
-- get_nearby_cooks's existing (pre-existing, unchanged) behavior — its
-- today_date param is likewise never applied to the dish check. Fixing
-- that is a separate, out-of-scope behavior change.
CREATE OR REPLACE FUNCTION public.get_cook_open_status(p_cook_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(cp.is_available, false) AND EXISTS (
    SELECT 1 FROM dishes d
    WHERE d.cook_id = cp.id
      AND d.is_available = true
      AND d.ordered_quantity < d.max_quantity
  )
  FROM cook_profiles cp
  WHERE cp.id = p_cook_id;
$$;

-- Reuse the shared function inside get_nearby_cooks instead of duplicating
-- the EXISTS() rule inline. Signature and returned columns are byte-for-byte
-- unchanged from 20260517000001_nearby_cooks_kitchen_image.sql, so
-- CREATE OR REPLACE is safe without a DROP.
CREATE OR REPLACE FUNCTION public.get_nearby_cooks(user_lat double precision, user_lng double precision, radius_meters integer, today_date date)
  RETURNS TABLE(id uuid, kitchen_name character varying, cuisine_types text[], avg_rating numeric, total_reviews integer, distance_km numeric, address_text text, today_dish_count bigint, lat double precision, lng double precision, image_url text, is_open boolean, kitchen_image_url text)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.kitchen_name,
    cp.cuisine_types,
    cp.avg_rating,
    cp.total_reviews,
    ROUND(
      (ST_Distance(
        cp.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      ) / 1000)::NUMERIC, 1
    ) AS distance_km,
    cp.address_text,
    (
      SELECT COUNT(*) FROM dishes d
      WHERE d.cook_id = cp.id
        AND d.is_available = true
        AND d.ordered_quantity < d.max_quantity
    ) AS today_dish_count,
    ST_Y(cp.location::geometry) AS lat,
    ST_X(cp.location::geometry) AS lng,
    cp.profile_image_url AS image_url,
    public.get_cook_open_status(cp.id) AS is_open,
    cp.kitchen_image_urls[1] AS kitchen_image_url
  FROM cook_profiles cp
  WHERE cp.is_approved = true
    AND ST_DWithin(
      cp.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY cp.is_available DESC, distance_km ASC;
END;
$function$;
```

- [ ] **Step 2: Apply the migration locally**

From `../testio-customer`:
Run: `supabase db reset` (or, if Supabase is already running and you only want to apply new migrations: `supabase migration up`)
Expected: migration list includes `20260722000002_add_cook_open_status_function`, no SQL errors.

- [ ] **Step 3: Verify the function is registered correctly**

```bash
psql postgresql://postgres:postgres@127.0.0.1:54333/postgres -c "select proname, prosecdef, provolatile from pg_proc where proname in ('get_cook_open_status', 'get_nearby_cooks');"
```
Expected: two rows. `get_cook_open_status` has `prosecdef = t` (SECURITY DEFINER active) and `provolatile = 's'` (STABLE). `get_nearby_cooks` unchanged (`prosecdef = t`).

- [ ] **Step 4: Verify the exact bug scenario is fixed at the SQL layer**

In Supabase Studio (`http://127.0.0.1:54343`) or via `psql`, find an approved cook (or use one from `../testio-customer/scripts/seed.ts` seed data), then reproduce the three cases from the ticket. Temporarily edit rows and revert afterwards — do not leave test data mutated.

```sql
-- Pick any approved cook id to test with.
select id, kitchen_name, is_available from cook_profiles where is_approved = true limit 5;
```

```sql
-- Case A: cook is_available = true, but make every dish out of stock or
-- unavailable (the exact bug scenario from the ticket).
-- Record each dish's current is_available/ordered_quantity/max_quantity
-- first so you can restore them, then:
update dishes set ordered_quantity = max_quantity where cook_id = '<cook_id>';

select public.get_cook_open_status('<cook_id>');       -- Expected: false
select is_open from public.get_nearby_cooks(0, 0, 999999999, current_date)
  where id = '<cook_id>';                              -- Expected: false (matches)

-- Restore the dish rows to their original ordered_quantity values.
```

```sql
-- Case B: cook is_available = true and has at least one in-stock dish
-- (use a cook you haven't touched, or restore Case A's cook first).
select public.get_cook_open_status('<cook_id_with_stock>');  -- Expected: true
select is_open from public.get_nearby_cooks(0, 0, 999999999, current_date)
  where id = '<cook_id_with_stock>';                          -- Expected: true (matches)
```

```sql
-- Case C: cook is_available = false, regardless of dish stock.
update cook_profiles set is_available = false where id = '<cook_id>';
select public.get_cook_open_status('<cook_id>');  -- Expected: false
update cook_profiles set is_available = true where id = '<cook_id>';  -- revert
```

Expected: `get_cook_open_status` and `get_nearby_cooks.is_open` agree in all three cases, and Case A returns `false` — the case that used to show "Open now" on the detail pages before this fix.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260722000002_add_cook_open_status_function.sql
git commit -m "fix: extract shared get_cook_open_status function and reuse it in get_nearby_cooks"
```
(Run from `../testio-customer`.)

---

## Task 2: Fix the web Cook detail page to use `get_cook_open_status`

**Files:**
- Modify: `types/database.types.ts:1470-1478` (add `Functions` entry)
- Modify: `app/(browse)/cook/[id]/page.tsx:44-83` (fetch), `:156-162` (hero overlay), `:264-275` (status card)

**Interfaces:**
- Consumes: `get_cook_open_status` RPC from Task 1.
- Produces: nothing consumed by other tasks — leaf page.

- [ ] **Step 1: Add the `get_cook_open_status` entry to the generated types file**

In `types/database.types.ts`, insert this entry alphabetically between the existing `get_cook_location` (ends at line 1478) and `get_delivery_order_details` (starts at line 1479) entries:

```ts
      get_cook_open_status: {
        Args: { p_cook_id: string }
        Returns: boolean
      }
```

So the surrounding block reads:

```ts
      get_cook_location: {
        Args: { p_order_id: string }
        Returns: {
          address_text: string
          kitchen_name: string
          lat: number
          lng: number
        }[]
      }
      get_cook_open_status: {
        Args: { p_cook_id: string }
        Returns: boolean
      }
      get_delivery_order_details: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
```

- [ ] **Step 2: Fetch open status in parallel with the cook profile**

Replace the `fetchCook` function (currently `app/(browse)/cook/[id]/page.tsx:50-80`, inside the `useEffect`):

```tsx
  const [cook, setCook] = useState<CookProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cookPhone, setCookPhone] = useState<string | null>(null);
  const [cookPhoneLoading, setCookPhoneLoading] = useState(true);

  useEffect(() => {
    async function fetchCook() {
      if (!id) return;
      setLoading(true);
      const [cookResult, openStatusResult] = await Promise.all([
        supabase.from("cook_profiles").select("*").eq("id", id).maybeSingle(),
        supabase.rpc("get_cook_open_status", { p_cook_id: id }),
      ]);
      const { data, error } = cookResult;

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (openStatusResult.error) {
        console.error("Fetch cook open status error:", openStatusResult.error);
      }

      setCook(data);
      setIsOpen(openStatusResult.error ? false : Boolean(openStatusResult.data));
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

Note this replaces both the state declarations (adding `isOpen`) and the `fetchCook` body — the `cookPhone` fire-and-forget RPC is unchanged, only wrapped by the new `Promise.all` for the cook+open-status fetch it was already sequenced after.

- [ ] **Step 3: Use `isOpen` for the hero image overlay**

Replace (currently `app/(browse)/cook/[id]/page.tsx:156-162`):

```tsx
          {!cook.is_available && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/95 px-4 py-2 rounded-xl text-sm font-bold text-slate-800 tracking-wide">
                Currently Offline
              </span>
            </div>
          )}
```

with:

```tsx
          {!isOpen && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/95 px-4 py-2 rounded-xl text-sm font-bold text-slate-800 tracking-wide">
                Currently Offline
              </span>
            </div>
          )}
```

- [ ] **Step 4: Use `isOpen` for the status card**

Replace (currently `app/(browse)/cook/[id]/page.tsx:264-275`):

```tsx
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Status</span>
                <span
                  className={
                    cook.is_available
                      ? "text-emerald-600 font-bold"
                      : "text-slate-400 font-bold"
                  }
                >
                  {cook.is_available ? "Open now" : "Offline"}
                </span>
              </div>
```

with:

```tsx
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Status</span>
                <span
                  className={
                    isOpen
                      ? "text-emerald-600 font-bold"
                      : "text-slate-400 font-bold"
                  }
                >
                  {isOpen ? "Open now" : "Offline"}
                </span>
              </div>
```

- [ ] **Step 5: Type-check the change**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Lint the change**

Run: `npm run lint`
Expected: no new warnings/errors in `app/(browse)/cook/[id]/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git add types/database.types.ts "app/(browse)/cook/[id]/page.tsx"
git commit -m "fix: source cook detail open status from get_cook_open_status instead of raw is_available"
```
(Run from `testio-customer-web`.)

---

## Task 3: Fix the mobile Cook detail screen to use `get_cook_open_status`

**Files:**
- Modify: `../testio-customer/hooks/useCookProfile.ts:4-16` (`CookProfileData` interface), `:50-67` (`useCookProfile`)
- Modify: `../testio-customer/app/cook/[id]/index.tsx:76`

**Interfaces:**
- Consumes: `get_cook_open_status` RPC from Task 1.
- Produces: `CookProfileData.is_open: boolean | null`, consumed by the screen in the same task.

- [ ] **Step 1: Add `is_open` to `CookProfileData` and fetch it alongside the profile**

Replace the interface and `useCookProfile` function in `../testio-customer/hooks/useCookProfile.ts` (currently lines 4-16 and 50-67):

```ts
export interface CookProfileData {
  id: string
  kitchen_name: string
  cuisine_types: string[]
  avg_rating: number
  total_reviews: number
  address_text: string | null
  profile_image_url: string | null
  story_description: string | null
  is_available: boolean
  is_open: boolean | null
  lat: number | null
  lng: number | null
}
```

```ts
export function useCookProfile(cookId: string) {
  return useQuery({
    queryKey: ['cook-profile', cookId],
    queryFn: async () => {
      const [profileResult, openStatusResult] = await Promise.all([
        supabase
          .from('cook_profiles')
          .select('id, kitchen_name, cuisine_types, avg_rating, total_reviews, address_text, profile_image_url, story_description, is_available, location')
          .eq('id', cookId)
          .eq('is_approved', true)
          .single(),
        supabase.rpc('get_cook_open_status', { p_cook_id: cookId }),
      ])
      if (profileResult.error) throw profileResult.error
      if (openStatusResult.error) {
        console.error('Fetch cook open status error:', openStatusResult.error)
      }
      const raw = profileResult.data as any
      const point = typeof raw.location === 'string' ? parseWkbPoint(raw.location) : null
      return {
        ...raw,
        is_open: openStatusResult.error ? null : Boolean(openStatusResult.data),
        lat: point?.lat ?? null,
        lng: point?.lng ?? null,
      } as CookProfileData
    },
    enabled: !!cookId,
  })
}
```

(Only the interface's new `is_open` field and the `queryFn` body change — `parseWkbPoint`, `DishData`, and `useTodayDishes` below it are untouched.)

- [ ] **Step 2: Use `is_open` instead of raw `is_available` in the detail screen**

Replace (currently `../testio-customer/app/cook/[id]/index.tsx:76`):

```ts
  const isOffline = cook?.is_available === false;
```

with:

```ts
  const isOffline = cook?.is_open === false;
```

This matches the same fail-open convention already used on the web (`components/CookCard.tsx:66`, `cook.is_open === false`): if the status can't be determined (RPC error → `is_open: null`), the UI does not show the offline banner rather than guessing.

- [ ] **Step 3: Type-check the change**

From `../testio-customer`:
Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Lint the change**

Run: `npm run lint`
Expected: no new warnings.

- [ ] **Step 5: Commit**

```bash
git add hooks/useCookProfile.ts "app/cook/[id]/index.tsx"
git commit -m "fix: source mobile cook detail open status from get_cook_open_status instead of raw is_available"
```
(Run from `../testio-customer`.)

---

## Task 4: Manual QA & Regression Verification

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: the verification evidence required by Deliverables — do not report the fix complete until every step below has a recorded pass/fail with actual observed evidence.

- [ ] **Step 1: Start the local backend and both apps**

```bash
cd ../testio-customer
supabase start --exclude edge-runtime
npx expo start --web   # or --android with an emulator running
```
In a second terminal:
```bash
cd testio-customer-web
npm run dev
```
Point both apps' Supabase env vars at the local instance (API `http://127.0.0.1:54341`, anon key from `supabase status`).
Expected: both apps start with no errors.

- [ ] **Step 2: Reproduce the exact ticket scenario end-to-end**

In Studio (`http://127.0.0.1:54343`), set up (or find) one cook with `is_available = true` and no in-stock dish (every dish either `is_available = false` or `ordered_quantity >= max_quantity`).
- Open Home (`/home`) list view. Expected: cook shows "CLOSED" overlay.
- Open Home map view. Expected: cook's map popup shows the "CLOSED" pill.
- Open Explore (`/explore`) list and map views (logged out). Expected: same as above.
- Open that cook's detail page (`/cook/[id]`) on web. Expected: **"Offline"** status and "Currently Offline" hero overlay — no longer "Open now". This is the regression this plan fixes; record before/after screenshots.
- Open the same cook's detail screen on the mobile app. Expected: offline banner shown, not a false "open" state.

- [ ] **Step 3: Verify the true-open case still works**

Pick a cook with `is_available = true` and at least one in-stock dish.
Expected: "OPEN" (no CLOSED overlay) on Home/Explore list and map, "Open now" on both detail pages. No false positives introduced.

- [ ] **Step 4: Verify the fully-offline case still works**

Pick a cook with `is_available = false`.
Expected: "CLOSED"/"Offline" everywhere, unchanged from before this fix.

- [ ] **Step 5: Verify RPC failure fails safe on both detail pages**

Simulate an RPC error (e.g. temporarily rename the function, call with a malformed id, or throttle network right as the page loads) and confirm neither detail page crashes or hangs — both should fall back to treating the cook as not-offline (per Task 2 Step 2 / Task 3 Step 1's `false`/`null` fallback) rather than throwing.
Expected: no unhandled exception, no infinite skeleton/spinner.

- [ ] **Step 6: Console check**

With browser/Metro dev tools open, reload the Home list, Explore list/map, and both cook detail pages.
Expected: no new JS/console errors attributable to this change.

- [ ] **Step 7: TypeScript verification (both repos)**

```bash
cd testio-customer-web && npx tsc --noEmit
cd ../testio-customer && npx tsc --noEmit
```
Expected: zero errors in both.

- [ ] **Step 8: Lint verification (both repos)**

```bash
cd testio-customer-web && npm run lint
cd ../testio-customer && npm run lint
```
Expected: no new warnings vs. the pre-change baseline in either repo.

- [ ] **Step 9: Regression pass**

Web: click through Home, Explore, cook detail → menu → checkout, cart. Mobile: cook profile screen's menu/day-toggle, cart bar, review navigation.
Expected: all behave exactly as before — the only observable change is the open/closed status agreeing across screens.

- [ ] **Step 10: Record results and fill in Deliverables**

For each of Steps 2-9, record pass/fail with what was actually observed. Do not mark the fix complete if any step fails or couldn't be run — file it under Remaining Risks instead.

---

## Deliverables (fill in after Task 4 completes)

1. Root cause analysis — see "Root Cause Analysis" section above.
2. Files modified — `../testio-customer/supabase/migrations/20260722000002_add_cook_open_status_function.sql` (new), `testio-customer-web/types/database.types.ts`, `testio-customer-web/app/(browse)/cook/[id]/page.tsx`, `../testio-customer/hooks/useCookProfile.ts`, `../testio-customer/app/cook/[id]/index.tsx`.
3. SQL verification — Task 1, Steps 3-4.
4. End-to-end scenario verification (the exact ticket repro) — Task 4, Step 2.
5. True-open / fully-offline regression — Task 4, Steps 3-4.
6. Failure-mode verification — Task 4, Step 5.
7. TypeScript verification (both repos) — Task 4, Step 7.
8. Lint verification (both repos) — Task 4, Step 8.
9. Regression verification — Task 4, Step 9.
10. Remaining risks — populate from any failed/blocked step in Task 4; also note as a standing follow-up that `get_nearby_cooks`'s `today_date` param is accepted but never applied to the dish-stock check (pre-existing, unchanged by this plan — see Global Constraints).
11. Acceptance-criteria matrix (Verified / Not Verified / Failed, with evidence) — populate after Task 4 completes; do not state the fix is complete until this is filled in with real evidence.
