# Home/Discover Location Persistence Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the Home/Discover page (`/home`) from silently discarding a user's manually-picked location when they navigate away and back.

**Architecture:** `hooks/useResolvedLocation.ts` currently holds its resolved location in plain `useState`, so every remount re-runs the full device-geolocation → saved-address → needs-picker chain from scratch, overwriting whatever the user picked. `hooks/useBrowseLocation.ts` (used by `/explore` and `KitchensTeaser`) already solves this exact problem for its own flow by persisting the resolved location to `sessionStorage` and reading it back before doing any resolution work. This plan ports that same persistence pattern into `useResolvedLocation`, without touching `useBrowseLocation`, `/explore`, or `KitchensTeaser` at all — those are out of scope and already correct.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, browser `sessionStorage` (no new dependencies).

## Global Constraints

- This is a targeted bug fix, not the "unify into one shared hook" refactor the ticket floats as a suggestion — that was explicitly descoped by the user in favor of the smaller, lower-risk fix. Do not touch `hooks/useBrowseLocation.ts`, `app/(browse)/explore/page.tsx`, or `components/marketing/KitchensTeaser.tsx`.
- This repo has **no automated test runner** (`package.json` has no `test` script and no jest/vitest/RTL in `devDependencies` — confirmed by reading `package.json`). Do not add one for this fix. Verification is: `npx tsc --noEmit`, `npm run lint`, and a manual browser repro of the exact bug steps from the ticket, per this project's stated norm ("For UI or frontend changes... test the golden path... in a browser before reporting the task as complete").
- Keep the change inside `hooks/useResolvedLocation.ts` only. Do not modify `app/(auth)/home/page.tsx` — it already calls `setLocation` correctly; the fix is entirely inside the hook.
- Never fall back to a hardcoded/default location — preserve the existing "device → saved → needs-picker" priority chain and the `needs-picker` status exactly as today, just skip it when a persisted pick already exists.

---

### Task 1: Persist resolved/picked location to `sessionStorage` in `useResolvedLocation`

**Files:**
- Modify: `hooks/useResolvedLocation.ts` (full file — currently 115 lines)

**Interfaces:**
- Consumes: nothing new. Existing exports `ResolvedLocation`, `ResolveStatus`, `useResolvedLocation()` keep their exact current shapes — `app/(auth)/home/page.tsx:48` destructures `{ location, status, setLocation }` and must keep working unmodified.
- Produces: same public API (`{ location, status, setLocation }`), now backed by a `sessionStorage` key `resolved_location`. No new exports.

- [ ] **Step 1: Reproduce the bug manually before changing anything**

Run: `npm run dev`

In a browser, go to `http://localhost:3000/home`, sign in if prompted. Open the location picker (the pill under the hero heading) and pick a location that is clearly different from your device location (search for a different city/address). Confirm the pill now shows the picked label. Then click into a cook profile (any `CookCard`) and use the browser back button to return to `/home`.

Expected (current buggy behavior): the pill reverts to the device-resolved location or re-triggers the "needs-picker" flow, instead of showing the location you picked.

This confirms the repro before the fix, so Step 6 has something concrete to compare against.

- [ ] **Step 2: Read the file you're about to change**

Read `hooks/useResolvedLocation.ts` in full (115 lines) so the edit in Step 3 is applied against current content, not memory.

- [ ] **Step 3: Add sessionStorage load/persist, mirroring `useBrowseLocation.ts`**

Replace the entire contents of `hooks/useResolvedLocation.ts` with:

```ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { reverseGeocode } from '@/lib/utils'

export type LocationSource = 'device' | 'saved' | 'picked'
export type ResolvedLocation = {
  lat: number
  lng: number
  label: string
  source: LocationSource
}
// resolving  → still figuring out where the user is
// ready      → we have a location to show cooks for
// needs-picker → no device location and no saved address; the user must pick one
export type ResolveStatus = 'resolving' | 'ready' | 'needs-picker'

const STORAGE_KEY = 'resolved_location'

// Persisted across mounts (but not across browser sessions) so that
// navigating away from /home and back doesn't re-run the resolution
// chain and silently overwrite a location the user already picked.
function loadStored(): ResolvedLocation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number' && typeof parsed?.label === 'string') {
      return parsed as ResolvedLocation
    }
  } catch {
    // corrupted / private mode — ignore
  }
  return null
}

function storeLocation(loc: ResolvedLocation) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
  } catch {
    // private mode — session-only is fine
  }
}

async function tryGeolocation(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null
  // Avoid re-prompting if the user has already denied permission.
  try {
    const perms = (navigator as unknown as { permissions?: { query?: (d: unknown) => Promise<{ state: string }> } }).permissions
    if (perms?.query) {
      const status = await perms.query({ name: 'geolocation' })
      if (status.state === 'denied') return null
    }
  } catch {
    // Permissions API unsupported — fall through and let getCurrentPosition prompt.
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000 }
    )
  })
}

/**
 * Resolves the user's delivery location, in priority order:
 *   1. a location already persisted this session (a prior device/saved/picked resolution)
 *   2. device geolocation (if permitted)
 *   3. their default saved address
 *   4. otherwise → status 'needs-picker' so the UI can ask them to choose a spot
 * Never falls back to a hardcoded location.
 */
export function useResolvedLocation() {
  const [location, setLocationState] = useState<ResolvedLocation | null>(null)
  const [status, setStatus] = useState<ResolveStatus>('resolving')

  useEffect(() => {
    // 0. Already resolved/picked earlier this session — skip re-resolving
    // entirely so a manual pick survives unmount/remount (e.g. back-navigation).
    const stored = loadStored()
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationState(stored)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('ready')
      return
    }

    let cancelled = false

    void (async () => {
      const supabase = createClient()

      // 1. Device geolocation
      const geo = await tryGeolocation()
      if (cancelled) return
      if (geo) {
        const label = (await reverseGeocode(geo.lat, geo.lng)) || 'Current location'
        if (cancelled) return
        const resolved: ResolvedLocation = { lat: geo.lat, lng: geo.lng, label, source: 'device' }
        setLocationState(resolved)
        setStatus('ready')
        storeLocation(resolved)
        return
      }

      // 2. Default saved address
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('customer_addresses')
            .select('label, address_line, lat, lng, is_default, created_at')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
          const a = data?.[0]
          if (!cancelled && a && a.lat != null && a.lng != null) {
            const resolved: ResolvedLocation = {
              lat: Number(a.lat),
              lng: Number(a.lng),
              label: a.label || a.address_line || 'Saved address',
              source: 'saved',
            }
            setLocationState(resolved)
            setStatus('ready')
            storeLocation(resolved)
            return
          }
        }
      } catch (e) {
        console.error('Failed to load saved address', e)
      }
      if (cancelled) return

      // 3. Nothing to go on — ask the user to pick a spot.
      setStatus('needs-picker')
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Called when the user picks/changes a location (e.g. from the picker).
  const setLocation = useCallback((loc: ResolvedLocation) => {
    setLocationState(loc)
    setStatus('ready')
    storeLocation(loc)
  }, [])

  return { location, status, setLocation }
}
```

Key differences from the original file:
- Added `STORAGE_KEY`, `loadStored()`, and `storeLocation()` (same shape as `hooks/useBrowseLocation.ts:23-35` and `:42-49`).
- The resolution effect now checks `loadStored()` first and returns immediately if a location is already persisted, instead of unconditionally starting the device → saved-address chain.
- Both success branches of the resolution chain (device, saved-address) now call `storeLocation(resolved)` in addition to `setLocationState`/`setStatus`, so any location this hook resolves — not just ones the user manually picks — survives a remount.
- The public `setLocation` callback (used by `app/(auth)/home/page.tsx:186` and `:199` for "picked" and "saved-selected-in-UI" locations) now also calls `storeLocation`.
- `status` stays `'resolving'` only for the very first synchronous render before the effect runs, exactly as before — no change to the state machine's shape, just to what feeds it.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`

Expected: no new errors. (If the project already has pre-existing unrelated errors, confirm the count doesn't increase because of this file.)

- [ ] **Step 5: Lint**

Run: `npm run lint`

Expected: no new errors/warnings in `hooks/useResolvedLocation.ts`.

- [ ] **Step 6: Manually verify the fix in the browser**

Run: `npm run dev` (if not already running)

Repeat the exact repro from Step 1:
1. Go to `/home`, open the location picker, pick a location clearly different from your device location.
2. Confirm the pill shows the picked label.
3. Click into a cook profile, then use the browser back button to return to `/home`.

Expected (fixed behavior): the pill still shows the location you picked in step 1 — it must **not** revert to the device location or re-open the "needs-picker" prompt.

Also verify no regression on a **fresh session**: open a new incognito/private window, go to `/home` directly (no prior `sessionStorage`). Confirm it still resolves via device geolocation (or saved address, or `needs-picker`) exactly as before — i.e., the "first visit this session" path is untouched.

Also verify `/explore` and the landing page's "Kitchens near you" section still behave as before (they use `useBrowseLocation`, which this task does not touch) — quick smoke check, not a full regression pass.

- [ ] **Step 7: Commit**

```bash
git add hooks/useResolvedLocation.ts
git commit -m "fix: persist resolved home location across navigation so manual picks survive back-navigation"
```
